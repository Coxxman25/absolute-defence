/**
 * useTheme — Three-mode theme system for Absolute Defence OS
 *
 * Modes:
 *   'night' → Absolute Night (deepest dark, default for operators)
 *   'dusk'  → Dusk (deep navy-blue, clearly distinct from night)
 *   'light' → Command Light (clean white, bright environments)
 *
 * Strategy: CSS variables are injected directly onto document.documentElement
 * via JavaScript so every component responds instantly, regardless of whether
 * it uses Tailwind tokens or inline styles.
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'night' | 'dusk' | 'light';

const STORAGE_KEY = 'ados-theme';
const DEFAULT_THEME: Theme = 'night';

// ─── Per-theme CSS variable maps ──────────────────────────────────────────────
// Injected directly onto :root.style so every var(--canvas-bg) etc. responds.
// CRITICAL: Night vs Dusk must be unmistakably different.
//   Night → near-black  #0D0F14
//   Dusk  → deep navy   #0B1628  (blue cast, immediately obvious)
//   Light → white       #F8FAFC

const THEME_VARS: Record<Theme, Record<string, string>> = {
  night: {
    '--canvas-bg':      '#0D0F14',
    '--rail-bg':        '#0D0F14',
    '--rail-border':    'rgba(255,255,255,0.05)',
    '--surface':        '#12141A',
    '--surface-2':      '#1A1C23',
    '--surface-border': 'rgba(255,255,255,0.06)',
    '--text-primary':   '#F1F5F9',
    '--text-muted':     '#64748B',
    '--panel-bg':       'rgba(13,15,20,0.95)',
  },
  dusk: {
    '--canvas-bg':      '#0B1628',
    '--rail-bg':        '#0C1A30',
    '--rail-border':    'rgba(51,119,255,0.18)',
    '--surface':        '#112038',
    '--surface-2':      '#163050',
    '--surface-border': 'rgba(51,187,255,0.12)',
    '--text-primary':   '#E8EFF8',
    '--text-muted':     '#6B8BB0',
    '--panel-bg':       'rgba(11,22,40,0.97)',
  },
  light: {
    '--canvas-bg':      '#F8FAFC',
    '--rail-bg':        '#FFFFFF',
    '--rail-border':    'rgba(0,0,0,0.08)',
    '--surface':        '#FFFFFF',
    '--surface-2':      '#F1F5F9',
    '--surface-border': 'rgba(0,0,0,0.07)',
    '--text-primary':   '#0F172A',
    '--text-muted':     '#64748B',
    '--panel-bg':       'rgba(248,250,252,0.97)',
  },
};

// ─── DOM application ──────────────────────────────────────────────────────────

/** Apply theme to the document root. Safe to call outside React. */
export function applyTheme(theme: Theme): void {
  const html = document.documentElement;

  // 1. Set data-theme attribute (for CSS [data-theme] selectors)
  html.setAttribute('data-theme', theme);

  // 2. Toggle Tailwind dark: class
  if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    html.classList.add('dark');
  }

  // 3. Inject CSS variables directly onto :root.style
  const vars = THEME_VARS[theme];
  for (const [key, value] of Object.entries(vars)) {
    html.style.setProperty(key, value);
  }

  // 4. Force page background (catches components with hardcoded dark classes)
  html.style.setProperty('background', vars['--canvas-bg'] ?? '');
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'night' || stored === 'dusk' || stored === 'light') return stored;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_THEME;
}

// ─── React hook ───────────────────────────────────────────────────────────────

/** React hook — provides theme state with localStorage persistence. */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = getStoredTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch { /* ignore */ }
    setThemeState(newTheme);
  }, []);

  /** Cycle: night → dusk → light → night */
  const cycleTheme = useCallback(() => {
    setTheme(
      theme === 'night' ? 'dusk'
      : theme === 'dusk' ? 'light'
      : 'night'
    );
  }, [theme, setTheme]);

  return { theme, setTheme, cycleTheme };
}

// ─── Labels & icons ───────────────────────────────────────────────────────────

/** Human-readable label for each theme — used in Settings UI. */
export const THEME_LABELS: Record<Theme, string> = {
  night: 'Absolute Night',
  dusk:  'Dusk',
  light: 'Command Light',
};

/** Icon character for each theme — used in NavRail cycle button. */
export const THEME_ICONS: Record<Theme, string> = {
  night: '🌑',
  dusk:  '🌘',
  light: '☀',
};
