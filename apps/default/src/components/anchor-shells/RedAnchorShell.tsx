/**
 * RedAnchorShell — ACT Layer
 *
 * Shown when someone scans a RED QR anchor.
 * Psychology: urgent, immediate, unambiguous.
 * Primary goal: get help to this person as fast as possible.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Mic, AlertTriangle, ChevronRight, MapPin, ArrowLeft, Phone } from 'lucide-react';

export type RedMode = 'default' | 'guide' | 'report' | 'journal' | 'sos' | 'sent';

interface RedAnchorShellProps {
  zoneCode?: string;
  initialMode?: RedMode;
}

// Colour tokens — crimson palette
const R = {
  bg:       '#0D0000',
  surface:  'rgba(192,57,43,0.12)',
  border:   'rgba(192,57,43,0.30)',
  solid:    '#C0392B',
  bright:   '#FF4444',
  glow:     'rgba(192,57,43,0.25)',
  text:     '#FF6B6B',
  muted:    'rgba(255,255,255,0.45)',
  white:    '#FFFFFF',
};

function RedHeader({ zone }: { zone: string }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{ borderBottom: `1px solid ${R.border}`, background: R.surface }}
    >
      <div className="flex items-center gap-2">
        <motion.span
          className="w-2 h-2 rounded-full"
          style={{ background: R.bright }}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: R.text }}>
          SOS ANCHOR
        </span>
        {zone && (
          <>
            <span style={{ color: R.border }}>·</span>
            <span className="text-[10px] font-mono" style={{ color: R.muted }}>{zone}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <MapPin size={9} style={{ color: R.muted }} />
        <span className="text-[9px]" style={{ color: R.muted }}>Location active</span>
      </div>
    </div>
  );
}

function SentScreen({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center flex-1 px-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border-2"
        style={{ background: 'rgba(0,200,83,0.12)', borderColor: 'rgba(0,200,83,0.4)' }}
      >
        <span className="text-3xl">✓</span>
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-3">Alert Sent</h2>
      <p className="text-sm leading-relaxed mb-2" style={{ color: R.muted }}>
        Your silent SOS has been received. A trained responder has been alerted to your zone.
      </p>
      <p className="text-[11px] mb-8" style={{ color: 'rgba(0,200,83,0.7)' }}>
        Stay calm. Help is on the way.
      </p>
      <div
        className="w-full rounded-2xl p-4 text-left mb-6 border"
        style={{ background: R.surface, borderColor: R.border }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: R.text }}>What happens next</p>
        <ul className="space-y-1.5">
          {['A safety responder has been notified', 'Your location has been logged anonymously', 'ARIA is monitoring this zone for escalation'].map(s => (
            <li key={s} className="flex items-center gap-2 text-[11px]" style={{ color: R.muted }}>
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: R.text }} />
              {s}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-[11px]" style={{ color: R.muted }}>
        <ArrowLeft size={12} />
        Back to zone
      </button>
    </motion.div>
  );
}

export function RedAnchorShell({ zoneCode = '', initialMode = 'default' }: RedAnchorShellProps) {
  const [mode, setMode] = useState<RedMode>(initialMode);
  const [sosPressed, setSosPressed] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'night');
    document.documentElement.classList.add('dark');
    document.documentElement.style.setProperty('--canvas-bg', R.bg);
    return () => {
      document.documentElement.style.removeProperty('--canvas-bg');
    };
  }, []);

  const handleSOS = () => {
    setSosPressed(true);
    setTimeout(() => setMode('sent'), 1200);
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans overflow-hidden"
      style={{ background: `radial-gradient(ellipse at top, #1A0004 0%, ${R.bg} 70%)` }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${R.glow}, transparent)` }}
      />

      {/* Status bar */}
      <RedHeader zone={zoneCode} />

      <AnimatePresence mode="wait">

        {/* ── SENT CONFIRMATION ── */}
        {mode === 'sent' && (
          <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
            <SentScreen onBack={() => { setMode('default'); setSosPressed(false); }} />
          </motion.div>
        )}

        {/* ── MAIN / DEFAULT ── */}
        {mode === 'default' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col flex-1 px-6 pt-8 pb-6"
          >
            {/* Hero headline */}
            <div className="flex-1 flex flex-col justify-center mb-6">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[2.6rem] font-black text-white leading-[1.05] tracking-tight mb-4"
              >
                DO YOU<br />NEED HELP?
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm leading-relaxed"
                style={{ color: R.muted }}
              >
                Your location has been detected. A responder can reach you in under 90 seconds.
              </motion.p>
            </div>

            {/* Primary action — Silent SOS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-3 mb-6"
            >
              <motion.button
                onClick={handleSOS}
                disabled={sosPressed}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-white text-base uppercase tracking-widest border-0 outline-none disabled:opacity-60"
                style={{
                  background: sosPressed ? 'rgba(192,57,43,0.5)' : R.solid,
                  boxShadow: `0 0 40px ${R.glow}, 0 4px 20px rgba(0,0,0,0.5)`,
                }}
                whileTap={{ scale: 0.97 }}
                animate={sosPressed ? {} : { boxShadow: [`0 0 30px ${R.glow}`, `0 0 60px rgba(192,57,43,0.5)`, `0 0 30px ${R.glow}`] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
              >
                <ShieldAlert size={20} />
                {sosPressed ? 'Sending…' : 'SILENT SOS — SEND NOW'}
              </motion.button>

              <button
                onClick={() => setMode('report')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider border"
                style={{ color: R.text, borderColor: R.border, background: R.surface }}
              >
                <AlertTriangle size={15} />
                Report a Hazard
              </button>

              <button
                onClick={() => setMode('journal')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold uppercase tracking-wider border"
                style={{ color: R.muted, borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
              >
                <Mic size={15} />
                Voice Journal — Record Concern
              </button>
            </motion.div>

            {/* Secondary options */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 pt-4"
              style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}
            >
              <button
                onClick={() => setMode('info')}
                className="text-[11px] flex items-center gap-1"
                style={{ color: R.muted }}
              >
                Not an emergency?
                <ChevronRight size={10} />
                View zone info
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── REPORT ── */}
        {mode === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: R.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Report a Hazard</h2>
            <p className="text-xs mb-6" style={{ color: R.muted }}>Anonymous. No login required.</p>
            <textarea
              className="flex-1 w-full rounded-2xl p-4 text-sm text-white resize-none outline-none min-h-[160px] border"
              style={{ background: R.surface, borderColor: R.border, color: R.white }}
              placeholder="Describe what you saw or experienced..."
            />
            <button
              onClick={() => setMode('sent')}
              className="mt-4 w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest"
              style={{ background: R.solid }}
            >
              Submit Report
            </button>
          </motion.div>
        )}

        {/* ── VOICE JOURNAL ── */}
        {mode === 'journal' && (
          <motion.div key="journal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col flex-1 px-6 pt-6 pb-6 items-center justify-center text-center">
            <button onClick={() => setMode('default')} className="self-start flex items-center gap-2 text-[11px] mb-8" style={{ color: R.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <motion.div
              className="w-24 h-24 rounded-full flex items-center justify-center border-2 mb-6"
              style={{ background: R.surface, borderColor: R.border }}
              animate={{ boxShadow: [`0 0 0px ${R.glow}`, `0 0 30px ${R.glow}`, `0 0 0px ${R.glow}`] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Mic size={36} style={{ color: R.text }} />
            </motion.div>
            <h2 className="text-xl font-black text-white mb-2">Tap to Record</h2>
            <p className="text-xs mb-8" style={{ color: R.muted }}>Your voice is anonymous. Speak freely.</p>
            <button className="w-full py-4 rounded-2xl font-black uppercase tracking-widest" style={{ background: R.solid, color: R.white }}>
              Start Recording
            </button>
          </motion.div>
        )}

        {/* ── ZONE INFO (secondary from green/amber detour) ── */}
        {mode === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col flex-1 px-6 pt-6 pb-6">
            <button onClick={() => setMode('default')} className="flex items-center gap-2 text-[11px] mb-6" style={{ color: R.muted }}>
              <ArrowLeft size={12} />Back
            </button>
            <h2 className="text-xl font-black text-white mb-1">{zoneCode || 'Zone Information'}</h2>
            <p className="text-xs mb-6" style={{ color: R.muted }}>This is an SOS anchor zone. Emergency help is always available here.</p>
            <div className="rounded-2xl p-4 border mb-4" style={{ background: R.surface, borderColor: R.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: R.text }}>Zone Status</p>
              <p className="text-sm text-white">Safety monitoring active</p>
            </div>
            <button onClick={() => setMode('default')} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm" style={{ background: R.solid, color: R.white }}>
              🆘 Emergency Help
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Always-visible emergency strip at bottom (non-default modes) */}
      {mode !== 'default' && mode !== 'sent' && (
        <div className="sticky bottom-0 px-6 pb-6">
          <button
            onClick={() => setMode('default')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border"
            style={{ color: R.text, borderColor: R.border, background: R.surface }}
          >
            <ShieldAlert size={12} />
            Emergency Help
          </button>
        </div>
      )}
    </div>
  );
}
