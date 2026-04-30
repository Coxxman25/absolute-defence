/**
 * AppContext — Global state for Absolute Defence OS operator dashboard.
 *
 * Lifts all shared state out of Layout.tsx so components further down
 * the tree can consume it without prop-drilling, and so Layout.tsx can
 * be slimmed from a 645-line god component to a lean shell.
 *
 * Data polling: fetches locations, incidents, risk zones, and voice
 * journals every 30 seconds. Surfaces loading / refreshing flags.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  Location,
  Incident,
  RiskZone,
  VoiceJournal,
  getLocations,
  getIncidents,
  getRiskZones,
  getVoiceJournals,
} from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type View = 'map' | 'vault' | 'registry' | 'knowledge' | 'demokit' | 'journals';

export interface MapFocus {
  lat: number;
  lng: number;
  zoom?: number;
}

export interface AppState {
  // ── Data ──────────────────────────────────────────────────────────────
  locations: Location[];
  incidents: Incident[];
  riskZones: RiskZone[];
  voiceJournals: VoiceJournal[];
  loading: boolean;
  refreshing: boolean;
  fetchData: (silent?: boolean) => Promise<void>;

  // ── Navigation ────────────────────────────────────────────────────────
  activeView: View;
  setActiveView: (v: View) => void;

  // ── Map ───────────────────────────────────────────────────────────────
  mapFocus: MapFocus | null;
  setMapFocus: (f: MapFocus | null) => void;
  /** Location code of the currently selected map pin. Drives ContextPanel. */
  selectedLocationCode: string | null;
  setSelectedLocationCode: (code: string | null) => void;

  // ── Search ────────────────────────────────────────────────────────────
  globalSearch: string;
  setGlobalSearch: (s: string) => void;

  // ── ARIA overlay ──────────────────────────────────────────────────────
  ariaOpen: boolean;
  ariaContext: string | undefined;
  openAria: (context?: string) => void;
  closeAria: () => void;

  // ── Context Panel ─────────────────────────────────────────────────────
  /** When true, the ContextPanel renders its ARIA chat mode instead of location detail. */
  contextPanelAriaMode: boolean;
  setContextPanelAriaMode: (b: boolean) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppState | null>(null);

const POLL_INTERVAL_MS = 30_000;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ── Data state ──────────────────────────────────────────────────────
  const [locations, setLocations] = useState<Location[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [voiceJournals, setVoiceJournals] = useState<VoiceJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Navigation state ────────────────────────────────────────────────
  const [activeView, setActiveViewRaw] = useState<View>('map');

  // ── Map state ───────────────────────────────────────────────────────
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);
  const [selectedLocationCode, setSelectedLocationCode] = useState<string | null>(null);

  // ── Search state ────────────────────────────────────────────────────
  const [globalSearch, setGlobalSearch] = useState('');

  // ── ARIA overlay state ──────────────────────────────────────────────
  const [ariaOpen, setAriaOpen] = useState(false);
  const [ariaContext, setAriaContext] = useState<string | undefined>(undefined);

  // ── Context panel state ─────────────────────────────────────────────
  const [contextPanelAriaMode, setContextPanelAriaMode] = useState(false);

  // ── Demo seed data (local dev — shown when API returns empty) ────────
  const DEMO_LOCATIONS: Location[] = [
    { id: 'd1', code: 'ZONE-A1', name: 'Main Entrance', type: 'entry', risk: 'critical', lat: 51.5081, lng: -0.1285, incidentCount: 3, anchorTypes: ['red'],   zoneId: 'z1' },
    { id: 'd2', code: 'ZONE-B2', name: 'East Corridor',  type: 'corridor', risk: 'high',     lat: 51.5074, lng: -0.1270, incidentCount: 2, anchorTypes: ['red'],   zoneId: 'z2' },
    { id: 'd3', code: 'ZONE-C3', name: 'West Stairwell', type: 'stairwell', risk: 'medium',   lat: 51.5068, lng: -0.1295, incidentCount: 1, anchorTypes: ['amber'], zoneId: 'z3' },
    { id: 'd4', code: 'ZONE-D4', name: 'Cafeteria',      type: 'common',   risk: 'medium',   lat: 51.5060, lng: -0.1278, incidentCount: 1, anchorTypes: ['amber'], zoneId: 'z4' },
    { id: 'd5', code: 'ZONE-E5', name: 'Staff Office',   type: 'office',   risk: 'low',      lat: 51.5055, lng: -0.1260, incidentCount: 0, anchorTypes: ['green'], zoneId: 'z5' },
    { id: 'd6', code: 'ZONE-F6', name: 'Car Park Level 1', type: 'parking', risk: 'low',     lat: 51.5090, lng: -0.1300, incidentCount: 0, anchorTypes: ['green'], zoneId: 'z6' },
  ];

  const now = new Date();
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

  const DEMO_INCIDENTS: Incident[] = [
    { id: 'i1', incidentId: 'INC-2401', locationCode: 'ZONE-A1', severity: 'critical', status: 'pending',   description: '[PHYSICAL_THREAT] Aggressive individual at main entrance — security requested', reporter: 'SOS-AUTO', createdAt: minsAgo(4),  lat: 51.5081, lng: -0.1285 },
    { id: 'i2', incidentId: 'INC-2402', locationCode: 'ZONE-A1', severity: 'critical', status: 'reviewing', description: '[WEAPONS] Weapon reported near turnstiles by staff member', reporter: 'staff-01',  createdAt: minsAgo(18), lat: 51.5081, lng: -0.1285 },
    { id: 'i3', incidentId: 'INC-2403', locationCode: 'ZONE-A1', severity: 'high',     status: 'pending',   description: '[VERBAL_ABUSE] Sustained verbal harassment at reception desk', reporter: 'SOS-AUTO', createdAt: minsAgo(32), lat: 51.5081, lng: -0.1285 },
    { id: 'i4', incidentId: 'INC-2404', locationCode: 'ZONE-B2', severity: 'high',     status: 'pending',   description: '[PHYSICAL_HARM] Altercation between two individuals', reporter: 'staff-02',  createdAt: minsAgo(8),  lat: 51.5074, lng: -0.1270 },
    { id: 'i5', incidentId: 'INC-2405', locationCode: 'ZONE-B2', severity: 'medium',   status: 'resolved',  description: '[THEFT] Mobile phone reported stolen from locker room', reporter: 'user-22',   createdAt: minsAgo(95), lat: 51.5074, lng: -0.1270 },
    { id: 'i6', incidentId: 'INC-2406', locationCode: 'ZONE-C3', severity: 'medium',   status: 'pending',   description: '[LONE_WORKER] Staff member not checked in after shift', reporter: 'system',    createdAt: minsAgo(45), lat: 51.5068, lng: -0.1295 },
    { id: 'i7', incidentId: 'INC-2407', locationCode: 'ZONE-D4', severity: 'low',      status: 'reviewing', description: '[SUBSTANCE] Suspected alcohol consumption reported', reporter: 'staff-03',  createdAt: minsAgo(60), lat: 51.5060, lng: -0.1278 },
    { id: 'i8', incidentId: 'INC-2408', locationCode: 'ZONE-A1', severity: 'critical', status: 'pending',   description: '[PHYSICAL_THREAT] Second SOS activation from same zone — escalating', reporter: 'SOS-AUTO', createdAt: minsAgo(2),  lat: 51.5081, lng: -0.1285 },
  ];

  // ── Data fetching ────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [locs, incs, zones, journals] = await Promise.all([
        getLocations(),
        getIncidents(),
        getRiskZones(),
        getVoiceJournals(),
      ]);
      // Fall back to demo data if API returns empty (local dev without Taskade credentials)
      setLocations(locs.length > 0 ? locs : DEMO_LOCATIONS);
      setIncidents(incs.length > 0 ? incs : DEMO_INCIDENTS);
      setRiskZones(zones);
      setVoiceJournals(journals);
    } catch {
      // On hard API failure, show demo data so the UI is always testable
      setLocations(DEMO_LOCATIONS);
      setIncidents(DEMO_INCIDENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch
  useEffect(() => { fetchData(false); }, [fetchData]);

  // 30-second polling
  useEffect(() => {
    const id = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  // Refresh immediately when switching to journals tab
  const prevView = useRef<View>(activeView);
  const setActiveView = useCallback((v: View) => {
    setActiveViewRaw(v);
    setGlobalSearch(''); // clear search on view change
    if (v === 'journals' && prevView.current !== 'journals') {
      fetchData(true);
    }
    prevView.current = v;
  }, [fetchData]);

  // ── ARIA helpers ─────────────────────────────────────────────────────
  const openAria = useCallback((context?: string) => {
    setAriaContext(context);
    setAriaOpen(true);
  }, []);

  const closeAria = useCallback(() => {
    setAriaOpen(false);
    setAriaContext(undefined);
  }, []);

  // ── Context value ────────────────────────────────────────────────────
  const value: AppState = {
    locations, incidents, riskZones, voiceJournals,
    loading, refreshing, fetchData,
    activeView, setActiveView,
    mapFocus, setMapFocus,
    selectedLocationCode, setSelectedLocationCode,
    globalSearch, setGlobalSearch,
    ariaOpen, ariaContext, openAria, closeAria,
    contextPanelAriaMode, setContextPanelAriaMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}

// ─── Derived selectors (memoisation-friendly) ─────────────────────────────────

/** Incidents that are critical + pending. */
export function selectCriticalPending(incidents: Incident[]): Incident[] {
  return incidents.filter(i => i.severity === 'critical' && i.status === 'pending');
}

/** Incidents that are high + pending. */
export function selectHighPending(incidents: Incident[]): Incident[] {
  return incidents.filter(i => i.severity === 'high' && i.status === 'pending');
}

/** SOS incidents (reporter === 'SOS-AUTO') that are pending. */
export function selectSosPending(incidents: Incident[]): Incident[] {
  return incidents.filter(i => i.reporter === 'SOS-AUTO' && i.status === 'pending');
}

/** Voice journals that are flagged concern or urgent. */
export function selectFlaggedJournals(journals: VoiceJournal[]): VoiceJournal[] {
  return journals.filter(j => j.flag === 'concern' || j.flag === 'urgent');
}
