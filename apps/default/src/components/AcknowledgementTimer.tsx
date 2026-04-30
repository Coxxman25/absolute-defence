import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Siren, ChevronRight, Users, UserCheck } from 'lucide-react';
import { formatCountdown } from '@/hooks/useAcknowledgementChain';
import { cn } from '@/lib/utils';

interface AcknowledgementTimerProps {
  remainingMs: number;
  totalMs: number;
  tier: 1 | 2 | 3;
  phase: 'tier1' | 'tier2' | 'breached';
  percentLeft: number;
  onAcknowledge: () => void;
  isUpdating: boolean;
}

// Arc SVG ring for countdown visualisation
function CountdownRing({
  percent,
  phase,
}: {
  percent: number;
  phase: 'tier1' | 'tier2' | 'breached';
}) {
  const size = 44;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;

  const color =
    phase === 'breached' ? '#ef4444'
    : phase === 'tier2'  ? '#f97316'
    : percent < 25       ? '#ef4444'
    : percent < 50       ? '#f59e0b'
    : '#06b6d4';

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
      />
    </svg>
  );
}

const TIER_CONFIG = {
  tier1: {
    label: 'Safety Lead',
    sublabel: '15 min response window',
    Icon: UserCheck,
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-800/30',
    textColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-900/40',
  },
  tier2: {
    label: 'Escalated → Facilities Manager',
    sublabel: '10 min escalation window',
    Icon: Users,
    bg: 'bg-orange-950/40',
    border: 'border-orange-700/40',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-900/40',
  },
  breached: {
    label: 'COMPLIANCE BREACH',
    sublabel: 'Duty manager notified · Event logged',
    Icon: Siren,
    bg: 'bg-red-950/50',
    border: 'border-red-600/50',
    textColor: 'text-red-400',
    badgeBg: 'bg-red-900/40',
  },
};

export function AcknowledgementTimer({
  remainingMs,
  totalMs,
  tier,
  phase,
  percentLeft,
  onAcknowledge,
  isUpdating,
}: AcknowledgementTimerProps) {
  const cfg = TIER_CONFIG[phase];
  const { Icon } = cfg;
  const isBreached = phase === 'breached';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'mt-3 rounded-2xl border overflow-hidden',
          cfg.bg,
          cfg.border
        )}
      >
        {/* Top strip — tier label */}
        <div className={cn('flex items-center gap-2 px-4 py-2 border-b', cfg.border)}>
          <Icon size={11} className={cfg.textColor} />
          <span className={cn('text-[10px] font-black tracking-[0.18em] uppercase', cfg.textColor)}>
            {cfg.label}
          </span>
          {!isBreached && (
            <span className="ml-auto text-[10px] text-white/30 font-medium">
              {cfg.sublabel}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Ring + time */}
          <div className="relative shrink-0">
            <CountdownRing percent={isBreached ? 0 : percentLeft} phase={phase} />
            <div className="absolute inset-0 flex items-center justify-center">
              {isBreached ? (
                <AlertTriangle size={14} className="text-red-400" />
              ) : (
                <span className={cn('text-[10px] font-black tabular-nums leading-none', cfg.textColor)}>
                  {formatCountdown(remainingMs)}
                </span>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            {isBreached ? (
              <>
                <p className="text-red-300 text-xs font-bold leading-snug">
                  SLA window expired — unacknowledged
                </p>
                <p className="text-red-400/60 text-[10px] mt-0.5 leading-relaxed">
                  Compliance event recorded. Duty manager escalated.
                </p>
              </>
            ) : phase === 'tier2' ? (
              <>
                <p className="text-orange-300 text-xs font-bold leading-snug">
                  Safety Lead did not respond in time
                </p>
                <p className="text-orange-400/60 text-[10px] mt-0.5">
                  Facilities Manager now on notice. Acknowledge to close chain.
                </p>
              </>
            ) : (
              <>
                <p className="text-cyan-300 text-xs font-bold leading-snug">
                  Awaiting Safety Lead acknowledgement
                </p>
                <p className="text-cyan-400/50 text-[10px] mt-0.5">
                  Auto-escalates to Facilities Manager if unacknowledged.
                </p>
              </>
            )}
          </div>

          {/* Acknowledge button */}
          {!isBreached && (
            <button
              disabled={isUpdating}
              onClick={onAcknowledge}
              className={cn(
                'shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all',
                'disabled:opacity-40',
                phase === 'tier2'
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : 'bg-cyan-700 hover:bg-cyan-600 text-white'
              )}
            >
              {isUpdating ? (
                <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <>
                  <ShieldCheck size={11} />
                  <span>Acknowledge</span>
                </>
              )}
            </button>
          )}

          {isBreached && (
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-lg bg-red-600/30 border border-red-500/40 flex items-center justify-center">
                <AlertTriangle size={13} className="text-red-400" />
              </div>
            </div>
          )}
        </div>

        {/* Escalation chain visualisation */}
        {!isBreached && (
          <div className="flex items-center gap-1 px-4 py-2.5 border-t border-white/5">
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest',
              phase === 'tier1' ? 'bg-cyan-900/60 text-cyan-400' : 'bg-white/5 text-white/20 line-through'
            )}>
              <UserCheck size={8} /> Safety Lead
            </div>
            <ChevronRight size={10} className="text-white/15" />
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest',
              phase === 'tier2' ? 'bg-orange-900/60 text-orange-400' : 'bg-white/5 text-white/15'
            )}>
              <Users size={8} /> Facilities Mgr
            </div>
            <ChevronRight size={10} className="text-white/15" />
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/5 text-white/15">
              <Siren size={8} /> Duty Manager
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
