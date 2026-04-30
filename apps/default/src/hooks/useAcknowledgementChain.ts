import { useState, useEffect, useCallback, useRef } from 'react';
import { createIncidentDirect } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

// Tier 1: Safety Lead must acknowledge within 15 minutes
export const TIER1_WINDOW_MS = 15 * 60 * 1000;
// Tier 2: Facilities Manager — 10 more minutes after escalation
export const TIER2_WINDOW_MS = 10 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AckTier = 1 | 2 | 3;

export interface AckState {
  incidentId: string;        // The @incID value (e.g. INC-1234567890)
  nodeId: string;            // The Taskade node id
  locationCode: string;
  severity: string;
  description: string;
  startedAt: number;         // epoch ms when the incident was logged / timer started
  tier: AckTier;             // current escalation tier
  acknowledged: boolean;
  breached: boolean;         // tier 1 window has passed without ack
  escalatedAt?: number;      // epoch ms when tier 2 escalation fired
  breachedAt?: number;       // epoch ms when final breach / compliance event logged
}

// Map of nodeId → AckState
type AckMap = Record<string, AckState>;

const STORAGE_KEY = 'ados_ack_chain_v1';
const LOGGED_EVENTS_KEY = 'ados_ack_logged_events_v1';

// Auto-generated escalation reporters — we MUST skip these to prevent infinite loops
const AUTO_REPORTERS = new Set(['BREACH-AUTO', 'ESCALATION-AUTO', 'SOS-AUTO']);

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadAckMap(): AckMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAckMap(map: AckMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* quota exceeded — silent */ }
}

// Persist the set of already-fired compliance events so they survive refresh
function loadLoggedEvents(): Set<string> {
  try {
    const raw = localStorage.getItem(LOGGED_EVENTS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLoggedEvents(set: Set<string>): void {
  try {
    // Keep max 500 entries to avoid bloat
    const arr = [...set];
    const trimmed = arr.length > 500 ? arr.slice(arr.length - 500) : arr;
    localStorage.setItem(LOGGED_EVENTS_KEY, JSON.stringify(trimmed));
  } catch { /* silent */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAcknowledgementChain(
  incidents: Array<{
    id: string;
    incidentId: string;
    locationCode: string;
    severity: string;
    status: string;
    description: string;
    reporter?: string;
    createdAt?: string;
  }>
) {
  const [ackMap, setAckMap] = useState<AckMap>(loadAckMap);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Persisted set of escalation events already logged — survives refresh
  const loggedEventsRef = useRef<Set<string>>(loadLoggedEvents());

  // ── Sync new critical/high pending incidents into the ack map ──────────────
  useEffect(() => {
    const current = loadAckMap();
    let dirty = false;

    for (const inc of incidents) {
      const isCriticalOrHigh = inc.severity === 'critical' || inc.severity === 'high';
      const isPending = inc.status === 'pending';

      // ──────────────────────────────────────────────────────────────────────
      // CRITICAL FIX: Skip auto-generated escalation incidents.
      // Without this guard, escalation events created by this hook get tracked
      // in the ack map → immediately breach → create MORE escalation events
      // → infinite loop of ghost critical incidents on every refresh.
      // ──────────────────────────────────────────────────────────────────────
      if (inc.reporter && AUTO_REPORTERS.has(inc.reporter)) {
        continue;
      }

      if (isCriticalOrHigh && isPending && !current[inc.id]) {
        const startedAt = inc.createdAt
          ? new Date(inc.createdAt).getTime() || Date.now()
          : Date.now();

        current[inc.id] = {
          incidentId: inc.incidentId,
          nodeId: inc.id,
          locationCode: inc.locationCode,
          severity: inc.severity,
          description: inc.description,
          startedAt,
          tier: 1,
          acknowledged: false,
          breached: false,
        };
        dirty = true;
      }

      // If incident was resolved/reviewing externally, mark acknowledged
      if (current[inc.id] && !current[inc.id].acknowledged && inc.status !== 'pending') {
        current[inc.id] = { ...current[inc.id], acknowledged: true };
        dirty = true;
      }
    }

    if (dirty) {
      saveAckMap(current);
      setAckMap({ ...current });
    }
  }, [incidents]);

  // ── Tick every second — drives countdown and fires escalations ─────────────
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const current = loadAckMap();
      const now = Date.now();
      let dirty = false;

      for (const nodeId of Object.keys(current)) {
        const state = current[nodeId];
        if (state.acknowledged || state.breached) continue;

        const elapsed = now - state.startedAt;

        // Tier 1 → Tier 2 escalation at 15 minutes
        if (state.tier === 1 && elapsed >= TIER1_WINDOW_MS) {
          current[nodeId] = { ...state, tier: 2, escalatedAt: now };
          dirty = true;

          // Log escalation — but only if we haven't already
          const eventKey = `${nodeId}-t2`;
          if (!loggedEventsRef.current.has(eventKey)) {
            loggedEventsRef.current.add(eventKey);
            saveLoggedEvents(loggedEventsRef.current);
            logEscalationEvent(state, 'TIER2_ESCALATION', now);
          }
        }

        // Tier 2 → Final breach at 25 minutes (15 + 10)
        if (state.tier >= 2 && elapsed >= TIER1_WINDOW_MS + TIER2_WINDOW_MS) {
          current[nodeId] = { ...state, tier: 3, breached: true, breachedAt: now };
          dirty = true;

          const eventKey = `${nodeId}-t3`;
          if (!loggedEventsRef.current.has(eventKey)) {
            loggedEventsRef.current.add(eventKey);
            saveLoggedEvents(loggedEventsRef.current);
            logEscalationEvent(state, 'COMPLIANCE_BREACH', now);
          }
        }
      }

      if (dirty) {
        saveAckMap(current);
        setAckMap({ ...current });
      } else {
        // Force re-render every second for countdown display
        setAckMap(m => ({ ...m }));
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Acknowledge action ─────────────────────────────────────────────────────
  const acknowledge = useCallback((nodeId: string) => {
    const current = loadAckMap();
    if (current[nodeId]) {
      current[nodeId] = { ...current[nodeId], acknowledged: true };
      saveAckMap(current);
      setAckMap({ ...current });
    }
  }, []);

  // ── Clear resolved incidents from the map ─────────────────────────────────
  const clearResolved = useCallback((nodeId: string) => {
    const current = loadAckMap();
    delete current[nodeId];
    saveAckMap(current);
    setAckMap({ ...current });
  }, []);

  // ── Computed countdown values ──────────────────────────────────────────────
  const getCountdown = useCallback((nodeId: string): {
    remainingMs: number;
    totalMs: number;
    tier: AckTier;
    phase: 'tier1' | 'tier2' | 'breached';
    percentLeft: number;
  } | null => {
    const state = ackMap[nodeId];
    if (!state) return null;

    const now = Date.now();
    const elapsed = now - state.startedAt;

    if (state.breached || state.tier >= 3) {
      return { remainingMs: 0, totalMs: TIER1_WINDOW_MS + TIER2_WINDOW_MS, tier: 3, phase: 'breached', percentLeft: 0 };
    }

    if (state.tier === 1) {
      const remaining = Math.max(0, TIER1_WINDOW_MS - elapsed);
      return {
        remainingMs: remaining,
        totalMs: TIER1_WINDOW_MS,
        tier: 1,
        phase: 'tier1',
        percentLeft: (remaining / TIER1_WINDOW_MS) * 100,
      };
    }

    // Tier 2
    const tier2Elapsed = elapsed - TIER1_WINDOW_MS;
    const remaining = Math.max(0, TIER2_WINDOW_MS - tier2Elapsed);
    return {
      remainingMs: remaining,
      totalMs: TIER2_WINDOW_MS,
      tier: 2,
      phase: 'tier2',
      percentLeft: (remaining / TIER2_WINDOW_MS) * 100,
    };
  }, [ackMap]);

  return { ackMap, acknowledge, clearResolved, getCountdown };
}

// ─── Escalation event logger ──────────────────────────────────────────────────
// Writes a compliance record to the incidents project. Fire-and-forget.

async function logEscalationEvent(
  state: AckState,
  eventType: 'TIER2_ESCALATION' | 'COMPLIANCE_BREACH',
  now: number
): Promise<void> {
  const elapsed = Math.round((now - state.startedAt) / 1000 / 60);

  const descriptions: Record<string, string> = {
    TIER2_ESCALATION: `⚠️ ESCALATION — ${state.incidentId} unacknowledged after 15 minutes. Auto-escalated to Facilities Manager at ${new Date(now).toISOString()}. Zone: ${state.locationCode}. Original severity: ${state.severity.toUpperCase()}.`,
    COMPLIANCE_BREACH: `🔴 COMPLIANCE BREACH — ${state.incidentId} unacknowledged after ${elapsed} minutes. Duty Manager notified. Compliance event logged at ${new Date(now).toISOString()}. Zone: ${state.locationCode}. This is a recorded failure to respond within SLA. Immediate escalation to duty management required.`,
  };

  try {
    await createIncidentDirect({
      locationCode: state.locationCode,
      severity: 'critical',
      latitude: 0,
      longitude: 0,
      reporter: eventType === 'COMPLIANCE_BREACH' ? 'BREACH-AUTO' : 'ESCALATION-AUTO',
      description: descriptions[eventType],
    });
  } catch {
    // Silent — compliance logging must never surface errors to users
  }
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
