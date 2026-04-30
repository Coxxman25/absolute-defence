/**
 * NavRail — The 56px permanent icon navigation rail.
 *
 * Always 56px wide. No expand/collapse. Hover reveals a floating
 * label tooltip pill. Active state = 2px left cyan border + cyan icon.
 *
 * Structure (top to bottom):
 *   Logo / shield icon (click = go to map)
 *   ── Workspace nav ──
 *   Zone Map · Case Vault · Area Registry · Voice Journals · Knowledge
 *   ── Intelligence ──
 *   ARIA (pulsing green dot when connected)
 *   ── spacer ──
 *   Theme cycle (3 dot indicator)
 *   Settings
 */

import React from 'react';
import {
  ShieldAlert, MapPin, AlertCircle, Building2,
  Mic, Library, Zap, Settings, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type View } from '@/lib/app-context';
import { type Theme, THEME_LABELS } from '@/lib/use-theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavRailProps {
  activeView: View;
  onViewChange: (v: View) => void;
  criticalCount: number;
  flaggedJournals: number;
  onOpenAria: () => void;
  onOpenSettings: () => void;
  theme: Theme;
  onCycleTheme: () => void;
}

// ─── Rail Item ────────────────────────────────────────────────────────────────

interface RailItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: boolean;         // dot badge (red = critical, violet = flagged)
  badgeColor?: string;
  onClick: () => void;
  tooltipSide?: 'top' | 'bottom';
}

function RailItem({
  icon: Icon,
  label,
  active = false,
  badge = false,
  badgeColor = 'bg-rose-500',
  onClick,
}: RailItemProps) {
  return (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={onClick}
        className={cn(
          'relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200',
          // Active: left-border accent handled by the wrapper below
          active
            ? 'text-[var(--agent-aria)] bg-[var(--agent-aria)]/10'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5',
        )}
        aria-label={label}
      >
        <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />

        {/* Badge dot */}
        {badge && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2',
              badgeColor,
              'border-white dark:border-[#12141A]',
            )}
          />
        )}
      </button>

      {/* Active left-border indicator */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: 'var(--agent-aria)' }}
        />
      )}

      {/* Hover tooltip */}
      <div
        className={cn(
          'absolute left-14 z-50 pointer-events-none',
          'bg-slate-900 dark:bg-[#0F1117] text-white',
          'px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap',
          'border border-white/10 shadow-xl',
          'opacity-0 group-hover:opacity-100',
          'translate-x-1 group-hover:translate-x-0',
          'transition-all duration-200',
        )}
      >
        {label}
        {/* Tooltip caret */}
        <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-[#0F1117] border-l border-b border-white/10 rotate-45" />
      </div>
    </div>
  );
}

// ─── Theme Cycle Button ────────────────────────────────────────────────────────

const THEME_ORDER: Theme[] = ['night', 'dusk', 'light'];
const THEME_DOT_COLORS: Record<Theme, string> = {
  night: 'bg-slate-700',
  dusk:  'bg-slate-500',
  light: 'bg-slate-300',
};

function ThemeCycleButton({ theme, onCycle }: { theme: Theme; onCycle: () => void }) {
  return (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={onCycle}
        className="w-10 h-10 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200"
        aria-label={`Theme: ${THEME_LABELS[theme]}. Click to cycle.`}
      >
        {THEME_ORDER.map(t => (
          <span
            key={t}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all duration-300',
              t === theme
                ? 'scale-125 bg-[var(--agent-aria)]'
                : THEME_DOT_COLORS[t],
            )}
          />
        ))}
      </button>

      {/* Tooltip */}
      <div
        className={cn(
          'absolute left-14 z-50 pointer-events-none',
          'bg-slate-900 dark:bg-[#0F1117] text-white',
          'px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-widest whitespace-nowrap',
          'border border-white/10 shadow-xl',
          'opacity-0 group-hover:opacity-100',
          'translate-x-1 group-hover:translate-x-0',
          'transition-all duration-200',
        )}
      >
        {THEME_LABELS[theme]}
        <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-[#0F1117] border-l border-b border-white/10 rotate-45" />
      </div>
    </div>
  );
}

// ─── ARIA Rail Button ──────────────────────────────────────────────────────────

function AriaRailButton({ onClick, urgentCount }: { onClick: () => void; urgentCount: number }) {
  return (
    <div className="relative group flex items-center justify-center">
      <button
        onClick={onClick}
        className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200',
          'bg-[var(--agent-aria)]/10 border border-[var(--agent-aria)]/20',
          'hover:bg-[var(--agent-aria)]/20 hover:border-[var(--agent-aria)]/40',
          'text-[var(--agent-aria)]',
        )}
        aria-label="Open ARIA Intelligence"
      >
        <Zap size={16} />
        {/* Live status dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#12141A] animate-pulse" />
        {/* Urgent count badge */}
        {urgentCount > 0 && (
          <span className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 border border-white dark:border-[#12141A] flex items-center justify-center text-[8px] font-black text-white">
            {urgentCount > 9 ? '9+' : urgentCount}
          </span>
        )}
      </button>

      {/* Tooltip */}
      <div
        className={cn(
          'absolute left-14 z-50 pointer-events-none',
          'bg-[#0F1117] text-white',
          'px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap',
          'border border-[var(--agent-aria)]/20 shadow-xl shadow-black/40',
          'opacity-0 group-hover:opacity-100',
          'translate-x-1 group-hover:translate-x-0',
          'transition-all duration-200',
        )}
      >
        <span className="block text-[var(--agent-aria)] tracking-widest uppercase">ARIA</span>
        <span className="block text-[9px] text-[var(--agent-aria)]/50 uppercase tracking-wider font-bold mt-0.5">
          {urgentCount > 0 ? `${urgentCount} need${urgentCount === 1 ? 's' : ''} review` : 'Intelligence ready'}
        </span>
        <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0F1117] border-l border-b border-[var(--agent-aria)]/20 rotate-45" />
      </div>
    </div>
  );
}

// ─── Main NavRail ──────────────────────────────────────────────────────────────

export function NavRail({
  activeView,
  onViewChange,
  criticalCount,
  flaggedJournals,
  onOpenAria,
  onOpenSettings,
  theme,
  onCycleTheme,
}: NavRailProps) {
  const urgentCount = criticalCount + flaggedJournals;

  return (
    <aside
      style={{
        background: 'var(--rail-bg, #0D0F14)',
        borderRightColor: 'var(--rail-border, rgba(255,255,255,0.05))',
      }}
      className={cn(
        'flex-shrink-0 w-14 h-screen flex flex-col items-center py-4 gap-1',
        'backdrop-blur-2xl border-r',
        'z-40 relative transition-colors duration-500',
      )}
    >
      {/* ── Logo ── */}
      <div className="relative group flex items-center justify-center mb-3">
        <button
          onClick={() => onViewChange('map')}
          className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-[var(--agent-aria)] flex items-center justify-center shadow-lg dark:shadow-[var(--agent-aria)]/20 hover:scale-105 active:scale-95 transition-transform duration-200"
          aria-label="Absolute Defence OS — Go to map"
        >
          <ShieldAlert size={18} className="text-white dark:text-slate-900" />
        </button>
        <div className="absolute left-14 z-50 pointer-events-none bg-slate-900 dark:bg-[#0F1117] text-white px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-widest whitespace-nowrap border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200">
          Absolute Defence OS
          <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-[#0F1117] border-l border-b border-white/10 rotate-45" />
        </div>
      </div>

      {/* ── Workspace divider ── */}
      <span className="w-5 h-px bg-slate-200 dark:bg-white/10 mb-1" />

      {/* ── Primary nav ── */}
      <RailItem
        icon={MapPin}
        label="Zone Map"
        active={activeView === 'map'}
        onClick={() => onViewChange('map')}
      />
      <RailItem
        icon={Building2}
        label="Area Registry"
        active={activeView === 'registry'}
        onClick={() => onViewChange('registry')}
      />
      <RailItem
        icon={AlertCircle}
        label="Case Vault"
        active={activeView === 'vault'}
        badge={criticalCount > 0}
        badgeColor="bg-rose-500"
        onClick={() => onViewChange('vault')}
      />
      <RailItem
        icon={Mic}
        label="Voice Journals"
        active={activeView === 'journals'}
        badge={flaggedJournals > 0}
        badgeColor="bg-violet-500"
        onClick={() => onViewChange('journals')}
      />

      {/* ── Intelligence divider ── */}
      <span className="w-5 h-px bg-slate-200 dark:bg-white/10 my-1" />

      <RailItem
        icon={Library}
        label="Knowledge Vault"
        active={activeView === 'knowledge'}
        onClick={() => onViewChange('knowledge')}
      />
      <RailItem
        icon={Package}
        label="Demo Kit Studio"
        active={activeView === 'demokit'}
        onClick={() => onViewChange('demokit')}
      />

      {/* ── ARIA ── */}
      <div className="mt-1">
        <AriaRailButton onClick={onOpenAria} urgentCount={urgentCount} />
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Theme cycle ── */}
      <ThemeCycleButton theme={theme} onCycle={onCycleTheme} />

      {/* ── Settings ── */}
      <RailItem
        icon={Settings}
        label="Settings"
        onClick={onOpenSettings}
      />
    </aside>
  );
}
