/**
 * StatusStrip — Alert-mode indicator strip + canvas ring.
 *
 * Invisible (0px height) when all clear.
 * Expands to 28px when SOS or critical incidents are pending.
 * Simultaneously applies a red glow border to the map canvas via CSS class.
 *
 * Uses a pure CSS marquee for scrolling text (no JS animation frame).
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Incident } from '@/lib/api';
import {
  selectCriticalPending,
  selectSosPending,
} from '@/lib/app-context';

interface StatusStripProps {
  incidents: Incident[];
  /** Callback so Layout can apply/remove the canvas alert ring class */
  onAlertChange: (active: boolean) => void;
}

export function StatusStrip({ incidents, onAlertChange }: StatusStripProps) {
  const sos = selectSosPending(incidents);
  const critical = selectCriticalPending(incidents);
  const isActive = sos.length > 0 || critical.length > 0;

  // Notify parent of alert state changes
  const prevActive = useRef(false);
  useEffect(() => {
    if (isActive !== prevActive.current) {
      prevActive.current = isActive;
      onAlertChange(isActive);
    }
  }, [isActive, onAlertChange]);

  // Build ticker messages
  const messages: string[] = [];
  sos.forEach(inc =>
    messages.push(
      `🚨 SOS ACTIVE — ${inc.locationCode || 'Unknown Zone'} · ${inc.description?.slice(0, 70) ?? 'Emergency alert triggered'}`
    )
  );
  if (critical.length > 0) {
    messages.push(
      `⚠ ${critical.length} CRITICAL CASE${critical.length > 1 ? 'S' : ''} REQUIRE IMMEDIATE REVIEW`
    );
  }
  // Triplicate for seamless loop
  const ticker = [...messages, ...messages, ...messages];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="status-strip"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 28, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 overflow-hidden"
          style={{ background: 'rgba(120,0,0,0.9)', borderBottom: '1px solid rgba(192,57,43,0.5)' }}
        >
          <div className="h-full flex items-center">
            {/* Left badge */}
            <div className="shrink-0 flex items-center gap-2 px-4 h-full border-r border-[var(--anchor-red)]/40 bg-[var(--anchor-red)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" />
              <span className="text-[9px] font-black text-red-300 uppercase tracking-[0.25em] whitespace-nowrap">
                Live Alert
              </span>
            </div>

            {/* Scrolling ticker */}
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div className="flex items-center gap-12 whitespace-nowrap marquee-track">
                {ticker.map((msg, i) => (
                  <span key={i} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="text-[10px] font-bold tracking-wide text-red-200">{msg}</span>
                    <span className="text-red-700 mx-4">◆</span>
                  </span>
                ))}
              </div>
              {/* Fade edges */}
              <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-[rgba(120,0,0,0.9)] to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
