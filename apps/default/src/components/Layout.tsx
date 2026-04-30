/**
 * Layout — The operator dashboard shell.
 *
 * Composes:
 *   NavRail (56px)  +  Map Canvas (full-bleed)
 *                       StatusStrip (28px, alert-only)
 *                       ContextPanel (380px overlay, right)
 *                       AriaDrawer  (460px overlay, right, standalone)
 *
 * All shared state lives in AppContext (lib/app-context.tsx).
 * This component is intentionally slim — it wires, not manages.
 */

import React, { useState, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';

import { useApp, selectCriticalPending, selectFlaggedJournals } from '@/lib/app-context';
import { useTheme } from '@/lib/use-theme';

import { NavRail } from './NavRail';
import { StatusStrip } from './StatusStrip';
import { ContextPanel } from './ContextPanel';
import { RiskMap } from './RiskMap';
import { IncidentVault } from './IncidentVault';
import { Registry } from './Registry';
import { KnowledgeVault } from './KnowledgeVault';
import { DemoKit } from './DemoKit';
import { VoiceJournalMonitor } from './VoiceJournalMonitor';
import { AriaDrawer } from './AriaDrawer';
import { IncidentDialog } from './IncidentDialog';
import { IncidentNotification } from './IncidentNotification';
import { UpsellModal } from './UpsellModal';
import { UserSettingsModal } from './UserSettingsModal';

// ─── Layout ───────────────────────────────────────────────────────────────────

export function Layout() {
  const {
    locations, incidents, riskZones, voiceJournals,
    loading, refreshing, fetchData,
    activeView, setActiveView,
    mapFocus, setMapFocus,
    selectedLocationCode, setSelectedLocationCode,
    globalSearch,
    ariaOpen, ariaContext, openAria, closeAria,
  } = useApp();

  const { theme, setTheme, cycleTheme } = useTheme();

  // ── Local overlay state ────────────────────────────────────────────
  const [upsellModal, setUpsellModal] = useState<{ open: boolean; title: string; desc: string }>({
    open: false, title: '', desc: '',
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertRingActive, setAlertRingActive] = useState(false);

  const openUpsell = (title: string, desc: string) => setUpsellModal({ open: true, title, desc });
  const closeUpsell = () => setUpsellModal(m => ({ ...m, open: false }));

  // ── Map interactions ───────────────────────────────────────────────
  const handleViewInMap = useCallback((lat: number, lng: number) => {
    const valid =
      typeof lat === 'number' && typeof lng === 'number' &&
      !isNaN(lat) && !isNaN(lng) &&
      !(lat === 0 && lng === 0) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    if (valid) {
      setMapFocus({ lat, lng, zoom: 19 });
      setActiveView('map');
    } else {
      toast.error('No GPS data — the reporter may not have had location enabled.', { duration: 4000 });
    }
  }, [setMapFocus, setActiveView]);

  const handleLocationSelect = useCallback((locationCode: string) => {
    setSelectedLocationCode(locationCode);
    // Pan to location on map
    const loc = locations.find(l => l.code === locationCode);
    if (loc && loc.lat && loc.lng) {
      setMapFocus({ lat: loc.lat, lng: loc.lng, zoom: 17 });
    }
  }, [locations, setSelectedLocationCode, setMapFocus]);

  // ── Counts for NavRail badges ──────────────────────────────────────
  const criticalCount = selectCriticalPending(incidents).length;
  const flaggedCount  = selectFlaggedJournals(voiceJournals).length;

  // ── Panel is open when a location is selected ──────────────────────
  const contextPanelOpen = selectedLocationCode !== null;

  return (
    <div
      style={{ background: 'var(--canvas-bg, #0D0F14)' }}
      className={cn(
        'h-screen w-full flex overflow-hidden font-sans',
        'text-slate-900 dark:text-slate-100',
        'transition-colors duration-500',
        'selection:bg-[var(--agent-aria)]/30',
        // Alert ring — 1px red glow border around the entire canvas
        alertRingActive && 'ring-2 ring-[var(--anchor-red)] ring-inset',
      )}
    >
      <Toaster position="bottom-center" richColors />

      {/* ── 1. Navigation Rail ── */}
      <NavRail
        activeView={activeView}
        onViewChange={setActiveView}
        criticalCount={criticalCount}
        flaggedJournals={flaggedCount}
        onOpenAria={openAria}
        onOpenSettings={() => setSettingsOpen(true)}
        theme={theme}
        onCycleTheme={cycleTheme}
      />

      {/* ── 2. Main Canvas ── */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">

        {/* Alert strip — expands from 0 to 28px on alert */}
        <StatusStrip incidents={incidents} onAlertChange={setAlertRingActive} />

        {/* View content — always full-bleed */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-[#F4F7F9] dark:bg-[#12141A]">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-2xl bg-[var(--agent-aria)]/10 border border-[var(--agent-aria)]/20 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--agent-aria)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[var(--agent-aria)]/60 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-[0.2em]">
                  Absolute Defence OS
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  Initialising systems…
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className={cn('flex-1 min-h-0 relative', activeView === 'demokit' ? 'bg-[#090A0F]' : '')}>
            {activeView === 'map' && (
              <RiskMap
                locations={locations}
                riskZones={riskZones}
                incidents={incidents}
                focus={mapFocus}
                onLocationSelect={handleLocationSelect}
                panOffset={contextPanelOpen ? 190 : 0}
              />
            )}
            {activeView === 'vault' && (
              <IncidentVault
                incidents={incidents}
                search={globalSearch}
                onRefresh={() => fetchData(true)}
                onViewInMap={handleViewInMap}
                onOpenAria={openAria}
              />
            )}
            {activeView === 'registry' && (
              <Registry
                locations={locations}
                incidents={incidents}
                riskZones={riskZones}
                search={globalSearch}
                onRefresh={() => fetchData(true)}
                onOpenAria={openAria}
              />
            )}
            {activeView === 'journals' && (
              <VoiceJournalMonitor
                journals={voiceJournals}
                search={globalSearch}
                onRefresh={() => fetchData(true)}
                onOpenAria={openAria}
              />
            )}
            {activeView === 'knowledge' && (
              <KnowledgeVault search={globalSearch} onOpenAria={openAria} />
            )}
            {activeView === 'demokit' && (
              <DemoKit locations={locations} />
            )}

            {/* ── 3. Context Panel (right-side overlay) ── */}
            <ContextPanel
              isOpen={contextPanelOpen}
              locationCode={selectedLocationCode}
              locations={locations}
              incidents={incidents}
              voiceJournals={voiceJournals}
              onClose={() => setSelectedLocationCode(null)}
              onViewInMap={handleViewInMap}
              onRefresh={() => fetchData(true)}
              onOpenAria={openAria}
              onLogConcern={() => {}} // handled by IncidentDialog below
            />
          </div>
        )}
      </main>

      {/* ── 4. Global overlays ── */}
      <IncidentNotification
        incidents={incidents}
        onOpenAria={openAria}
        onRefresh={() => fetchData(true)}
      />

      <AriaDrawer
        isOpen={ariaOpen}
        onClose={closeAria}
        context={ariaContext}
      />

      <UpsellModal
        open={upsellModal.open}
        title={upsellModal.title}
        desc={upsellModal.desc}
        onClose={closeUpsell}
      />

      <UserSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={setTheme}
      />
    </div>
  );
}
