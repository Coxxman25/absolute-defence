/**
 * GreenAnchorShell — GO Layer
 *
 * Shown when someone scans a GREEN QR anchor.
 * Psychology: welcoming, calm, utility-focused.
 * Primary goal: "How do I get what I need quickly?"
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Utensils, ParkingCircle, Info, ShieldAlert, Search, ArrowLeft, Settings, Wifi, AlertTriangle } from 'lucide-react';

const G = {
  bg:      '#000D04',
  surface: 'rgba(0,200,83,0.08)',
  border:  'rgba(0,200,83,0.22)',
  solid:   '#00C853',
  glow:    'rgba(0,200,83,0.18)',
  text:    '#00C853',
  muted:   'rgba(255,255,255,0.45)',
  white:   '#FFFFFF',
};

type GreenMode = 'default' | 'map' | 'request' | 'report';

interface GreenAnchorShellProps {
  zoneCode?: string;
}

const QUICK_TILES = [
  { icon: MapPin,        label: 'You Are Here',   sub: 'View Map',           mode: 'map' as GreenMode },
  { icon: Utensils,     label: 'Cafeteria',       sub: 'Open until 16:00',   mode: null },
  { icon: ParkingCircle,label: 'Car Parking',     sub: '24 spaces available',mode: null },
  { icon: Settings,     label: 'Facilities',      sub: 'Request help',       mode: 'request' as GreenMode },
];

const SERVICES = [
  { icon: Wifi,        label: 'Guest Wi-Fi',     detail: 'Network: AD-Guest / No password' },
  { icon: Info,        label: 'Opening Hours',   detail: 'Mon–Fri 08:00–18:00 · Sat 09:00–13:00' },
  { icon: AlertTriangle, label: 'Report Hazard', detail: 'Submit an anonymous safety concern' },
];

export function GreenAnchorShell({ zoneCode = '' }: GreenAnchorShellProps) {
  const [mode, setMode] = useState<GreenMode>('default');
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--canvas-bg', G.bg);
    return () => { document.documentElement.style.removeProperty('--canvas-bg'); };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-hidden"
      style={{ background: `radial-gradient(ellipse at top, #001A08 0%, ${G.bg} 70%)` }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${G.glow}, transparent)` }} />

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${G.border}`, background: G.surface }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: G.solid }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: G.text }}>SAFE ANCHOR</span>
          {zoneCode && <><span style={{ color: G.border }}>·</span><span className="text-[10px] font-mono" style={{ color: G.muted }}>{zoneCode}</span></>}
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={9} style={{ color: G.muted }} />
          <span className="text-[9px]" style={{ color: G.muted }}>Zone active</span>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── MAIN ── */}
        {mode === 'default' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col flex-1 px-6 pt-8 pb-6 overflow-y-auto"
          >
            {/* Headline */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">✓</span>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: G.text }}>Safe Zone</span>
              </div>
              <h1 className="text-[2.4rem] font-black text-white leading-[1.05] tracking-tight">
                HOW CAN<br />WE HELP?
              </h1>
            </div>

            {/* Quick-action grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {QUICK_TILES.map(({ icon: Icon, label, sub, mode: tileMode }, i) => (
                <motion.button
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => tileMode && setMode(tileMode)}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl border text-left"
                  style={{ background: G.surface, borderColor: G.border }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon size={22} style={{ color: G.solid }} />
                  <div>
                    <p className="text-[12px] font-bold text-white leading-tight">{label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: G.muted }}>{sub}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Search bar */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border mb-6"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <Search size={14} style={{ color: G.muted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent text-white placeholder:text-slate-600 outline-none"
                placeholder="Search services, rooms, information…"
              />
            </div>

            {/* Services list */}
            <div className="space-y-2 mb-4">
              {SERVICES.map(({ icon: Icon, label, detail }) => (
                <button
                  key={label}
                  onClick={() => label === 'Report Hazard' && setMode('report')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left"
                  style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <Icon size={15} style={{ color: G.text }} />
                  <div>
                    <p className="text-[12px] font-semibold text-white">{label}</p>
                    <p className="text-[10px]" style={{ color: G.muted }}>{detail}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Emergency strip — always visible but subtle */}
            <div className="mt-auto pt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
              <button
                onClick={() => window.location.href = '?anchor=red' + (zoneCode ? `&zone=${zoneCode}` : '')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border"
                style={{ color: '#FF6B6B', borderColor: 'rgba(192,57,43,0.3)', background: 'rgba(192,57,43,0.08)' }}
              >
                <ShieldAlert size={12} />
                Emergency Help
              </button>
            </div>
          </motion.div>
        )}

        {/* ── MAP ── */}
        {mode === 'map' && (
          <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: G.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-2xl font-black text-white mb-1">You Are Here</h2>
            <p className="text-xs mb-4" style={{ color: G.muted }}>Zone: {zoneCode || 'Safe zone'}</p>
            <div className="flex-1 rounded-2xl border flex items-center justify-center min-h-[260px]" style={{ background: 'rgba(0,200,83,0.05)', borderColor: G.border }}>
              <div className="text-center">
                <MapPin size={32} style={{ color: G.solid }} className="mx-auto mb-3" />
                <p className="text-sm font-bold text-white">Interactive map</p>
                <p className="text-xs mt-1" style={{ color: G.muted }}>Full map available in connected mode</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── FACILITY REQUEST ── */}
        {mode === 'request' && (
          <motion.div key="request" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: G.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Facilities Request</h2>
            <p className="text-xs mb-6" style={{ color: G.muted }}>Submit a request — our team will respond shortly.</p>
            <textarea
              className="flex-1 w-full rounded-2xl p-4 text-sm text-white resize-none outline-none min-h-[140px] border mb-4"
              style={{ background: G.surface, borderColor: G.border, color: G.white }}
              placeholder="What do you need?"
            />
            <button className="w-full py-4 rounded-2xl font-black uppercase tracking-widest" style={{ background: G.solid, color: '#000' }}>
              Submit Request
            </button>
          </motion.div>
        )}

        {/* ── REPORT ── */}
        {mode === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: G.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Report a Hazard</h2>
            <p className="text-xs mb-6" style={{ color: G.muted }}>Anonymous. No login required.</p>
            <textarea
              className="flex-1 w-full rounded-2xl p-4 text-sm text-white resize-none outline-none min-h-[140px] border mb-4"
              style={{ background: G.surface, borderColor: G.border, color: G.white }}
              placeholder="Describe the hazard or concern..."
            />
            <button className="w-full py-4 rounded-2xl font-black uppercase tracking-widest" style={{ background: G.solid, color: '#000' }}>
              Submit Report
            </button>
            <button
              onClick={() => window.location.href = '?anchor=red' + (zoneCode ? `&zone=${zoneCode}` : '')}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border"
              style={{ color: '#FF6B6B', borderColor: 'rgba(192,57,43,0.3)', background: 'rgba(192,57,43,0.08)' }}
            >
              <ShieldAlert size={12} />This is an emergency →
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
