import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { RedAnchorShell } from './components/anchor-shells/RedAnchorShell';
import { AmberAnchorShell } from './components/anchor-shells/AmberAnchorShell';
import { GreenAnchorShell } from './components/anchor-shells/GreenAnchorShell';

/**
 * Absolute Defence OS — Root Router
 *
 * Anchor-type routing (Spatial OS — new QR codes):
 *   ?anchor=red&zone=ZONE_ID    → Red   Anchor (ACT  — Emergency / Safety)
 *   ?anchor=amber&zone=ZONE_ID  → Amber Anchor (KNOW — Information / Pinboard)
 *   ?anchor=green&zone=ZONE_ID  → Green Anchor (GO   — Utility / Wayfinding)
 *
 * Legacy routing (backward-compatible — existing printed QR codes never break):
 *   ?view=guide   → RedAnchorShell (guide mode)
 *   ?view=sos     → RedAnchorShell (sos mode)
 *   ?view=journal → RedAnchorShell (journal mode)
 *   ?view=report  → RedAnchorShell (report mode)
 *   ?loc=CODE     → RedAnchorShell (report mode, original legacy param)
 *
 * The Genesis platform serves the app only at the space root URL.
 * Sub-paths 404 — all routing uses query params on root.
 */
function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPublicView = params.has('anchor') || params.has('view') || params.has('loc');
    if (!isPublicView) {
      // Operator dashboard — default to Absolute Night
      document.documentElement.setAttribute('data-theme', 'night');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const params = new URLSearchParams(window.location.search);
  const anchor = params.get('anchor');
  // ?zone= is the new canonical param; ?loc= is the legacy alias
  const zone = params.get('zone') ?? params.get('loc') ?? '';
  const view = params.get('view'); // legacy param

  // ── New anchor-type routing (Spatial OS) ─────────────────────────────
  if (anchor === 'red')   return <RedAnchorShell zoneCode={zone} />;
  if (anchor === 'amber') return <AmberAnchorShell zoneCode={zone} />;
  if (anchor === 'green') return <GreenAnchorShell zoneCode={zone} />;

  // ── Legacy routing — backward-compatible with all printed QR codes ───
  if (view === 'sos')                        return <RedAnchorShell zoneCode={zone} initialMode="sos" />;
  if (view === 'journal')                    return <RedAnchorShell zoneCode={zone} initialMode="journal" />;
  if (view === 'guide')                      return <RedAnchorShell zoneCode={zone} initialMode="guide" />;
  if (view === 'report' || params.has('loc')) return <RedAnchorShell zoneCode={zone} initialMode="report" />;

  // ── Operator dashboard ───────────────────────────────────────────────
  return <Layout />;
}

export default App;
