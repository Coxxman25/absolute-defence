/**
 * AmberAnchorShell — KNOW Layer
 *
 * Shown when someone scans an AMBER QR anchor.
 * Psychology: situational awareness, calm but alert.
 * Primary goal: "What do I need to know here, right now?"
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, ShieldAlert, ChevronRight, MapPin, ArrowLeft, Bell, Cloud, Users, Clock } from 'lucide-react';

const A = {
  bg:      '#0A0800',
  surface: 'rgba(255,184,0,0.08)',
  border:  'rgba(255,184,0,0.25)',
  solid:   '#FFB800',
  glow:    'rgba(255,184,0,0.2)',
  text:    '#FFB800',
  muted:   'rgba(255,255,255,0.45)',
  white:   '#FFFFFF',
};

type AmberMode = 'default' | 'report' | 'info';

interface AmberAnchorShellProps {
  zoneCode?: string;
}

const ZONE_ALERTS = [
  { icon: '⚠', text: 'Wet floor: East Corridor — cleaning in progress', time: '12m ago' },
  { icon: '🚫', text: 'Lift out of service: Level 2 — use stairwell C', time: '1h ago' },
  { icon: '📋', text: "Today's Briefing: High footfall expected 14:00–16:00", time: 'Today' },
];

const ZONE_STATS = [
  { icon: Cloud, label: 'Weather', value: 'Partly cloudy' },
  { icon: Users, label: 'Capacity', value: '78% full' },
  { icon: Clock, label: 'Last incident', value: '2h ago' },
];

export function AmberAnchorShell({ zoneCode = '' }: AmberAnchorShellProps) {
  const [mode, setMode] = useState<AmberMode>('default');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'night');
    document.documentElement.classList.add('dark');
    document.documentElement.style.setProperty('--canvas-bg', A.bg);
    return () => { document.documentElement.style.removeProperty('--canvas-bg'); };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-hidden"
      style={{ background: `radial-gradient(ellipse at top, #1A1000 0%, ${A.bg} 70%)` }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${A.glow}, transparent)` }} />

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${A.border}`, background: A.surface }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: A.solid }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: A.text }}>HAZARD ANCHOR</span>
          {zoneCode && <><span style={{ color: A.border }}>·</span><span className="text-[10px] font-mono" style={{ color: A.muted }}>{zoneCode}</span></>}
        </div>
        <div className="flex items-center gap-1.5">
          <Bell size={9} style={{ color: A.muted }} />
          <span className="text-[9px]" style={{ color: A.muted }}>Alerts active</span>
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
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} style={{ color: A.solid }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: A.text }}>Zone Alert Active</span>
              </div>
              <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
                ZONE ALERT<br />ACTIVE
              </h1>
            </div>

            {/* Alert feed */}
            <div className="space-y-2 mb-6">
              {ZONE_ALERTS.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3.5 rounded-2xl border"
                  style={{ background: A.surface, borderColor: A.border }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{alert.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-snug">{alert.text}</p>
                    <p className="text-[10px] mt-0.5 font-mono" style={{ color: A.muted }}>{alert.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* What you need to know */}
            <div className="mb-6">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-3" style={{ color: A.muted }}>WHAT YOU NEED TO KNOW</p>
              <div className="grid grid-cols-3 gap-2">
                {ZONE_STATS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center" style={{ background: A.surface, borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Icon size={16} style={{ color: A.text }} />
                    <p className="text-[10px] text-white font-semibold leading-tight">{value}</p>
                    <p className="text-[9px]" style={{ color: A.muted }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('report')}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider border"
                  style={{ color: A.text, borderColor: A.border, background: A.surface }}
                >
                  <AlertTriangle size={13} />
                  Report a Hazard
                </button>
                <button
                  onClick={() => window.location.href = '?anchor=red' + (zoneCode ? `&zone=${zoneCode}` : '')}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider"
                  style={{ background: '#C0392B', color: '#FFFFFF' }}
                >
                  <ShieldAlert size={13} />
                  EMERGENCY →
                </button>
              </div>

              <button
                onClick={() => setMode('info')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs border"
                style={{ color: A.muted, borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="flex items-center gap-2"><Info size={12} />More zone information</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── REPORT ── */}
        {mode === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: A.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Report a Hazard</h2>
            <p className="text-xs mb-6" style={{ color: A.muted }}>Anonymous. No login required.</p>
            <textarea
              className="flex-1 w-full rounded-2xl p-4 text-sm text-white resize-none outline-none min-h-[160px] border"
              style={{ background: A.surface, borderColor: A.border, color: A.white }}
              placeholder="Describe the hazard or concern..."
            />
            <button className="mt-4 w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest" style={{ background: A.solid, color: '#000' }}>
              Submit Report
            </button>
          </motion.div>
        )}

        {/* ── MORE INFO ── */}
        {mode === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: A.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-xl font-black text-white mb-1">{zoneCode || 'Zone Information'}</h2>
            <p className="text-xs mb-6" style={{ color: A.muted }}>Safety and operational information for this zone.</p>
            <div className="rounded-2xl p-4 border" style={{ background: A.surface, borderColor: A.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: A.text }}>Zone Status</p>
              <p className="text-sm text-white">Amber alert in effect — monitor and follow guidance</p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Always-visible emergency access */}
      {mode !== 'default' && (
        <div className="sticky bottom-0 px-6 pb-6">
          <button
            onClick={() => window.location.href = '?anchor=red' + (zoneCode ? `&zone=${zoneCode}` : '')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border"
            style={{ color: '#FF6B6B', borderColor: 'rgba(192,57,43,0.3)', background: 'rgba(192,57,43,0.1)' }}
          >
            <ShieldAlert size={12} />Emergency Help
          </button>
        </div>
      )}
    </div>
  );
}
