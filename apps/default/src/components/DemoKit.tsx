import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Download, Printer, ShieldAlert, ShieldCheck,
  MapPin, AlertTriangle, CheckCircle2, Smartphone,
  ArrowRight, Package, BookOpen, ClipboardList, Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRedAnchorQrUrl, getAmberAnchorQrUrl, getGreenAnchorQrUrl } from '@/lib/api';
import { toast } from 'sonner';

// ─── Anchor definitions ───────────────────────────────────────────────────────

const ANCHORS = {
  red: {
    label: 'SOS — ACT',
    sub: 'Emergency · Risk · Protection',
    color: '#C0392B', bg: 'rgba(192,57,43,0.10)', border: 'rgba(192,57,43,0.30)',
    tagColor: '#FF6B6B',
    getQr: getRedAnchorQrUrl,
    headline: 'DO YOU NEED HELP?',
    body: 'Your location has been detected. A responder can reach you in under 90 seconds.',
    actions: ['Silent SOS — Send Now', 'Report a Hazard', 'Voice Journal'],
    printSpec: 'Public entry points, car parks, isolated zones',
    pitch: '"Hand the client a red poster. Ask them to scan it. Watch the emergency screen appear."',
  },
  amber: {
    label: 'KNOW — INFORM',
    sub: 'Alerts · Pinboard · Situational Awareness',
    color: '#FFB800', bg: 'rgba(255,184,0,0.10)', border: 'rgba(255,184,0,0.30)',
    tagColor: '#FFB800',
    getQr: getAmberAnchorQrUrl,
    headline: 'ZONE ALERT ACTIVE',
    body: 'Live alerts, operational notices, and daily briefing for this zone.',
    actions: ['View Zone Alerts', 'Today\'s Briefing', 'Report a Hazard'],
    printSpec: 'Corridors, notice boards, staff areas',
    pitch: '"Amber scans show what\'s happening right now. Operational clarity at a glance."',
  },
  green: {
    label: 'GO — UTILITY',
    sub: 'Wayfinding · Services · Facilities',
    color: '#00C853', bg: 'rgba(0,200,83,0.10)', border: 'rgba(0,200,83,0.30)',
    tagColor: '#00C853',
    getQr: getGreenAnchorQrUrl,
    headline: 'HOW CAN WE HELP?',
    body: 'Wayfinding, facilities, cafeteria, parking and daily services.',
    actions: ['You Are Here — Map', 'Cafeteria & Services', 'Facilities Request'],
    printSpec: 'Entrances, receptions, cafeteria, lobbies',
    pitch: '"Green scans handle 80% of daily visitor queries — without any staff involvement."',
  },
} as const;

type AnchorKey = keyof typeof ANCHORS;

// ─── Zone list ────────────────────────────────────────────────────────────────

const ZONES = [
  { code: 'ZONE-A1', label: 'Main Entrance' },
  { code: 'ZONE-B2', label: 'East Corridor' },
  { code: 'ZONE-C3', label: 'West Stairwell' },
  { code: 'ZONE-D4', label: 'Cafeteria' },
  { code: 'ZONE-E5', label: 'Staff Office' },
  { code: 'ZONE-F6', label: 'Car Park Level 1' },
];

// ─── Deployment Bag ───────────────────────────────────────────────────────────

const BAG = [
  { icon: Monitor,      item: 'iPad / Tablet',          desc: 'Full-screen map view for the live demo' },
  { icon: Package,      item: 'Laminated QR Posters',   desc: '3 anchor types — Red, Amber, Green' },
  { icon: Package,      item: 'Blu-Tack / Command Strips', desc: 'Non-permanent, policy-compliant placement' },
  { icon: BookOpen,     item: 'Policy Summary',         desc: 'One-pager referencing UK law alignment' },
  { icon: ClipboardList,item: 'Demo Case Pack',         desc: 'Anonymised example: concern → triage → close' },
];

// ─── Phone Mockup Preview ─────────────────────────────────────────────────────

function PhoneMockup({ anchor }: { anchor: AnchorKey }) {
  const a = ANCHORS[anchor];
  return (
    <div
      className="rounded-[2rem] border-4 overflow-hidden shadow-2xl"
      style={{ borderColor: 'rgba(255,255,255,0.08)', background: anchor === 'red' ? '#0D0000' : anchor === 'amber' ? '#0A0800' : '#000D04', minHeight: 420 }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: a.border, background: a.bg }}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: a.tagColor }}>{a.label.split('—')[0].trim()} ANCHOR</span>
        </div>
        <span className="text-[8px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>ZONE-A1</span>
      </div>

      {/* Content */}
      <div className="px-5 pt-6 pb-5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: a.tagColor }}>{a.sub}</p>
        <h2 className="text-xl font-black text-white leading-tight mb-2">{a.headline}</h2>
        <p className="text-[10px] text-white/50 leading-relaxed mb-5">{a.body}</p>

        <div className="space-y-2">
          {a.actions.map((action, i) => (
            <div
              key={action}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold text-white"
              style={{
                background: i === 0 ? a.color : a.bg,
                borderColor: i === 0 ? 'transparent' : a.border,
                color: i === 0 ? (anchor === 'amber' ? '#000' : '#fff') : a.tagColor,
              }}
            >
              {i === 0 && anchor === 'red' && <ShieldAlert size={10} />}
              {i === 0 && anchor === 'amber' && <AlertTriangle size={10} />}
              {i === 0 && anchor === 'green' && <MapPin size={10} />}
              {action}
            </div>
          ))}
        </div>

        {/* Always-visible emergency strip */}
        {anchor !== 'red' && (
          <div className="mt-4 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest" style={{ borderColor: 'rgba(192,57,43,0.3)', background: 'rgba(192,57,43,0.08)', color: '#FF6B6B' }}>
            <ShieldAlert size={9} />Emergency Help
          </div>
        )}
      </div>
    </div>
  );
}

// ─── QR Card ──────────────────────────────────────────────────────────────────

function QrCard({ anchor, zone }: { anchor: AnchorKey; zone: string }) {
  const a = ANCHORS[anchor];
  const qrUrl = a.getQr(zone);

  return (
    <div className="rounded-2xl border p-4 flex flex-col items-center gap-3" style={{ background: a.bg, borderColor: a.border }}>
      <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: a.tagColor }}>
        {a.label} · {zone || 'No Zone'}
      </p>
      <div className="relative p-2 rounded-xl border-2" style={{ borderColor: a.color, background: '#000' }}>
        <img
          src={qrUrl}
          alt={`${anchor} QR`}
          className="w-32 h-32 block"
          onError={e => {
            (e.currentTarget as HTMLImageElement).src =
              `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?anchor=' + anchor + '&zone=' + zone)}&format=png&margin=10`;
          }}
        />
      </div>
      <p className="text-[9px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Scan to preview the {anchor} experience
      </p>
    </div>
  );
}

// ─── Main DemoKit ──────────────────────────────────────────────────────────────

interface DemoKitProps {
  locations?: { code: string; name: string }[];
}

type Section = 'studio' | 'blueprint' | 'bag';

export function DemoKit({ locations = [] }: DemoKitProps) {
  const [anchor, setAnchor] = useState<AnchorKey>('red');
  const [zone, setZone] = useState(ZONES[0].code);
  const [section, setSection] = useState<Section>('studio');
  const [bagChecked, setBagChecked] = useState<Record<string, boolean>>({});

  const a = ANCHORS[anchor];
  const bagDone = Object.values(bagChecked).filter(Boolean).length;

  const handleDownload = () => {
    const url = a.getQr(zone);
    const link = document.createElement('a');
    link.href = url; link.download = `AD-${anchor.toUpperCase()}-${zone}.png`; link.target = '_blank';
    link.click();
    toast.success(`${anchor.toUpperCase()} QR for ${zone} downloading`);
  };

  const previewUrl = `${window.location.origin}?anchor=${anchor}&zone=${encodeURIComponent(zone)}`;

  return (
    <div className="h-full w-full bg-[#090A0F] overflow-auto text-white font-sans">
      <div className="max-w-[1400px] mx-auto p-10 space-y-10">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-4xl font-light tracking-tight text-white">
              Anchor <span className="font-black">Studio.</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Generate, preview and deploy Red · Amber · Green QR anchors for any zone.
            </p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['studio', 'blueprint', 'bag'] as Section[]).map(s => (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={cn(
                  'px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize',
                  section === s ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                )}
              >
                {s === 'studio' ? '⚡ Anchor Studio' : s === 'blueprint' ? '📋 Blueprint' : '🎒 The Bag'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STUDIO ── */}
          {section === 'studio' && (
            <motion.div key="studio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left — controls */}
                <div className="lg:col-span-5 space-y-5">

                  {/* Anchor type selector */}
                  <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Select Anchor Type</p>
                    {(Object.entries(ANCHORS) as [AnchorKey, typeof ANCHORS['red']][]).map(([key, def]) => (
                      <button
                        key={key}
                        onClick={() => setAnchor(key)}
                        className={cn(
                          'w-full flex items-center justify-between p-4 rounded-2xl border transition-all',
                          anchor === key ? 'bg-white/10' : 'bg-white/[0.02] hover:bg-white/[0.05]'
                        )}
                        style={{ borderColor: anchor === key ? def.border : 'rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: def.color }} />
                          <div className="text-left">
                            <p className="text-sm font-black" style={{ color: anchor === key ? def.tagColor : '#fff' }}>{def.label}</p>
                            <p className="text-[10px] text-slate-500">{def.sub}</p>
                          </div>
                        </div>
                        {anchor === key && <CheckCircle2 size={16} style={{ color: def.color }} />}
                      </button>
                    ))}
                  </div>

                  {/* Zone selector */}
                  <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Select Zone</p>
                    <select
                      value={zone}
                      onChange={e => setZone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      {ZONES.map(z => <option key={z.code} value={z.code} className="bg-[#0D0F14]">{z.label} — {z.code}</option>)}
                    </select>
                  </div>

                  {/* QR preview */}
                  <QrCard anchor={anchor} zone={zone} />

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                      style={{ background: a.color, color: anchor === 'amber' ? '#000' : '#fff' }}
                    >
                      <Download size={14} />Download {anchor.toUpperCase()} QR · {zone}
                    </button>
                    <button
                      onClick={() => { window.open(previewUrl, '_blank'); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all"
                      style={{ color: a.tagColor, borderColor: a.border, background: a.bg }}
                    >
                      <Smartphone size={13} />Preview on Mobile
                    </button>
                    <button
                      onClick={() => { toast.success('Opening print dialog…'); setTimeout(() => window.print(), 300); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Printer size={13} />Print All Three Anchors
                    </button>
                  </div>

                  {/* Print spec */}
                  <div className="rounded-2xl border border-white/10 p-4 bg-white/[0.02] text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-slate-400 mb-2">📌 Placement guide</p>
                    <p>{a.printSpec}</p>
                    <p className="mt-2">Print at A4 · Laminate · 150dpi minimum</p>
                  </div>
                </div>

                {/* Right — phone preview */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                      Mobile Experience Preview — {anchor.toUpperCase()} Anchor
                    </p>

                    {/* 3-anchor comparison strip */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {(Object.keys(ANCHORS) as AnchorKey[]).map(k => (
                        <button
                          key={k}
                          onClick={() => setAnchor(k)}
                          className={cn('rounded-2xl p-3 border transition-all text-center', k === anchor ? 'bg-white/10' : 'bg-white/[0.03] hover:bg-white/[0.06]')}
                          style={{ borderColor: k === anchor ? ANCHORS[k].border : 'rgba(255,255,255,0.06)' }}
                        >
                          <span className="w-4 h-4 rounded-full block mx-auto mb-1.5" style={{ background: ANCHORS[k].color }} />
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: ANCHORS[k].tagColor }}>
                            {k.toUpperCase()}
                          </p>
                          <p className="text-[8px] text-slate-600 mt-0.5">
                            {k === 'red' ? 'ACT' : k === 'amber' ? 'KNOW' : 'GO'}
                          </p>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={anchor}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-[280px] mx-auto"
                      >
                        <PhoneMockup anchor={anchor} />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Pitch note */}
                  <div
                    className="rounded-2xl p-5 border"
                    style={{ background: a.bg, borderColor: a.border }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: a.tagColor }}>
                      The Demo Moment
                    </p>
                    <p className="text-sm italic leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {a.pitch}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── BLUEPRINT ── */}
          {section === 'blueprint' && (
            <motion.div key="blueprint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 space-y-4">
                <h2 className="text-lg font-black text-white">Site Deployment Blueprint</h2>
                <p className="text-xs text-slate-500">Repeatable 5-step anchor deployment for any venue</p>
                <div className="relative space-y-3 mt-4">
                  <div className="absolute left-5 top-6 bottom-6 w-px bg-white/5" />
                  {[
                    { n: '01', title: 'Site Survey', desc: 'Walk the site. Identify entry points, blind spots, lone-worker areas. Assign anchor types to each zone.', tool: 'Zone Registry' },
                    { n: '02', title: 'Register Zones', desc: 'Add Zone IDs in the Registry. Each zone gets auto-generated Red, Amber, and Green QR codes.', tool: 'Anchor Studio' },
                    { n: '03', title: 'Upload Policies', desc: 'Upload safety policies and legal frameworks into the Knowledge Vault for ARIA to reference.', tool: 'Knowledge Vault' },
                    { n: '04', title: 'Deploy Anchors', desc: 'Print, laminate, and place QR posters. Red at risk points, Amber at info boards, Green at entrances.', tool: 'Printed QR Anchors' },
                    { n: '05', title: 'Live Demo', desc: 'Run the demo — scan each anchor type with the client. Watch incidents appear live on the map.', tool: 'ARIA + Map' },
                  ].map((step, i) => (
                    <motion.div key={step.n} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 text-white flex items-center justify-center shrink-0 z-10 text-xs font-black">
                        {step.n}
                      </div>
                      <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-black text-white">{step.title}</h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 whitespace-nowrap shrink-0">
                          {step.tool}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── BAG ── */}
          {section === 'bag' && (
            <motion.div key="bag" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-white">Deployment Bag</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Everything for a professional, no-hesitation install</p>
                  </div>
                  <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full border', bagDone === BAG.length ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-slate-400 border-white/10')}>
                    {bagDone}/{BAG.length} packed
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-400"
                    animate={{ width: `${(bagDone / BAG.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="space-y-2 mt-4">
                  {BAG.map(({ icon: Icon, item, desc }) => {
                    const done = bagChecked[item];
                    return (
                      <button
                        key={item}
                        onClick={() => setBagChecked(p => ({ ...p, [item]: !p[item] }))}
                        className={cn('w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all', done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]')}
                      >
                        <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border', done ? 'bg-emerald-500 border-emerald-500' : 'bg-white/5 border-white/10')}>
                          {done ? <CheckCircle2 size={13} className="text-white" /> : <Icon size={13} className="text-slate-500" />}
                        </div>
                        <div>
                          <p className={cn('text-sm font-bold', done ? 'text-emerald-400 line-through opacity-60' : 'text-white')}>{item}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
