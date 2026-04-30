import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, TrendingUp, TrendingDown, Minus, Flame,
  ShieldAlert, BarChart3, Layers, X, ChevronRight, MapPin, AlertTriangle,
  Users, HardHat, Shield, Radio, UserCheck, Wifi, WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Location, RiskZone, Incident } from '@/lib/api';
import { useHeatmapData, TimeWindow, ClusterZone, ZoneRiskRow } from '@/hooks/useHeatmapData';

// ─── Personnel types ──────────────────────────────────────────────────────────

type PersonnelRole = 'security' | 'supervisor' | 'operative' | 'contractor' | 'medic';
type PersonnelStatus = 'active' | 'standby' | 'incident' | 'offline';

interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
  status: PersonnelStatus;
  lat: number;
  lng: number;
  zone: string;
  lastPing: string; // "Xs ago"
  heightBand?: 'ground' | 'low' | 'mid' | 'high' | 'rope';
}

// Seed realistic personnel around whatever locations exist
function seedPersonnel(locations: Location[]): Personnel[] {
  if (locations.length === 0) return [];

  const PERSONNEL_SEEDS: Omit<Personnel, 'lat' | 'lng' | 'zone'>[] = [
    { id: 'p1', name: 'M. Hargrove', role: 'supervisor',  status: 'active',   lastPing: '12s ago',  heightBand: 'ground' },
    { id: 'p2', name: 'J. Okafor',   role: 'security',    status: 'active',   lastPing: '8s ago',   heightBand: 'ground' },
    { id: 'p3', name: 'A. Petrov',   role: 'operative',   status: 'incident', lastPing: '3s ago',   heightBand: 'high'   },
    { id: 'p4', name: 'L. Mbeki',    role: 'contractor',  status: 'active',   lastPing: '22s ago',  heightBand: 'mid'    },
    { id: 'p5', name: 'T. Singh',    role: 'medic',       status: 'standby',  lastPing: '45s ago',  heightBand: 'ground' },
    { id: 'p6', name: 'R. Castillo', role: 'security',    status: 'active',   lastPing: '6s ago',   heightBand: 'ground' },
    { id: 'p7', name: 'D. Nkosi',    role: 'operative',   status: 'active',   lastPing: '18s ago',  heightBand: 'rope'   },
    { id: 'p8', name: 'F. Laurent',  role: 'contractor',  status: 'offline',  lastPing: '4m ago',   heightBand: 'ground' },
    { id: 'p9', name: 'K. Yamamoto', role: 'supervisor',  status: 'active',   lastPing: '31s ago',  heightBand: 'low'    },
  ];

  // Spread personnel across available locations with small offsets
  const offsets = [
    [0.00012,  0.00015], [-0.00018, 0.00008], [0.00005, -0.00020],
    [-0.00008, -0.00012],[0.00022, -0.00005], [-0.00015,  0.00018],
    [0.00009,  0.00025], [-0.00025, -0.00008],[0.00018,  0.00011],
  ];

  return PERSONNEL_SEEDS.map((p, i) => {
    const loc = locations[i % locations.length];
    const [dlat, dlng] = offsets[i % offsets.length];
    return {
      ...p,
      lat: loc.lat + dlat,
      lng: loc.lng + dlng,
      zone: loc.code,
    };
  });
}

// ─── Personnel config ─────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<PersonnelRole, { label: string; color: string; bg: string }> = {
  supervisor:  { label: 'Supervisor',  color: '#818cf8', bg: '#818cf820' },
  security:    { label: 'Security',    color: '#06B6D4', bg: '#06B6D420' },
  operative:   { label: 'Operative',   color: '#34d399', bg: '#34d39920' },
  contractor:  { label: 'Contractor',  color: '#f59e0b', bg: '#f59e0b20' },
  medic:       { label: 'Medic',       color: '#f87171', bg: '#f8717120' },
};

const STATUS_CONFIG: Record<PersonnelStatus, { dot: string; pulse: boolean; label: string }> = {
  active:   { dot: '#34d399', pulse: false, label: 'Active'   },
  standby:  { dot: '#f59e0b', pulse: false, label: 'Standby'  },
  incident: { dot: '#ef4444', pulse: true,  label: 'INCIDENT' },
  offline:  { dot: '#475569', pulse: false, label: 'Offline'  },
};

const HEIGHT_LABEL: Record<NonNullable<Personnel['heightBand']>, string> = {
  ground: '▬ Ground',
  low:    '↑ Low  (0–4m)',
  mid:    '↑↑ Mid (4–15m)',
  high:   '↑↑↑ High (15m+)',
  rope:   '🧗 Rope Access',
};

// ─── Personnel marker icon ────────────────────────────────────────────────────

function makePersonnelIcon(p: Personnel) {
  const cfg = ROLE_CONFIG[p.role];
  const sCfg = STATUS_CONFIG[p.status];
  const pulseRing = sCfg.pulse
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;background:${sCfg.dot}25;animation:personnel-pulse 1.4s ease-in-out infinite;"></div>`
    : '';
  return L.divIcon({
    className: 'custom-icon bg-transparent border-0',
    html: `
      <div style="position:relative;width:28px;height:28px;">
        ${pulseRing}
        <div style="
          width:24px;height:24px;
          background:${cfg.bg};
          border:2px solid ${cfg.color};
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          position:absolute;top:2px;left:2px;
          box-shadow:0 0 10px ${cfg.color}60;
          font-size:9px;font-weight:900;color:${cfg.color};
          font-family:system-ui,sans-serif;letter-spacing:-0.5px;
        ">
          ${p.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div style="
          position:absolute;bottom:-1px;right:-1px;
          width:8px;height:8px;
          background:${sCfg.dot};
          border:1.5px solid #0A0C12;
          border-radius:50%;
        "></div>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RiskMapProps {
  locations: Location[];
  riskZones: RiskZone[];
  incidents?: Incident[];
  focus?: { lat: number; lng: number; zoom?: number } | null;
  /** Called when a location pin is clicked — opens the ContextPanel */
  onLocationSelect?: (locationCode: string) => void;
  /** Pixels to pan the map left when the ContextPanel is open */
  panOffset?: number;
}

// ─── Anchor-type pin icons ────────────────────────────────────────────────────
// Matches the mockup: teardrop shape, icon inside, radar rings on RED.

const ANCHOR_CONFIG = {
  red: {
    bg:     '#C0392B',
    glow:   '#C0392B',
    border: '#FF6B6B',
    label:  'SOS',
    icon:   '🆘',
    rings:  true,
  },
  amber: {
    bg:     '#FFB800',
    glow:   '#FFB800',
    border: '#FFD700',
    label:  '⚠',
    icon:   '⚠',
    rings:  false,
  },
  green: {
    bg:     '#00C853',
    glow:   '#00C853',
    border: '#69F0AE',
    label:  '✓',
    icon:   '✓',
    rings:  false,
  },
} as const;

function makeAnchorPin(anchorType: 'red' | 'amber' | 'green', isSelected = false): L.DivIcon {
  const cfg = ANCHOR_CONFIG[anchorType];
  const size = isSelected ? 52 : 44;
  const innerSize = isSelected ? 34 : 28;

  const radarRings = cfg.rings ? `
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:${size * 2.2}px;height:${size * 2.2}px;
      border-radius:50%;
      border:2px solid ${cfg.glow}40;
      animation:anchor-ring-1 2.4s ease-out infinite;
      pointer-events:none;
    "></div>
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:${size * 1.65}px;height:${size * 1.65}px;
      border-radius:50%;
      border:2px solid ${cfg.glow}55;
      animation:anchor-ring-2 2.4s ease-out infinite 0.6s;
      pointer-events:none;
    "></div>
    <div style="
      position:absolute;
      top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:${size * 1.15}px;height:${size * 1.15}px;
      border-radius:50%;
      border:1.5px solid ${cfg.glow}70;
      animation:anchor-ring-3 2.4s ease-out infinite 1.2s;
      pointer-events:none;
    "></div>
  ` : '';

  const selectedGlow = isSelected
    ? `box-shadow:0 0 0 3px white, 0 0 20px ${cfg.glow};`
    : `box-shadow:0 4px 16px ${cfg.glow}60;`;

  return L.divIcon({
    className: 'custom-icon bg-transparent border-0',
    html: `
      <div style="
        position:relative;
        width:${size + 24}px;
        height:${size + 24}px;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        ${radarRings}
        <!-- Teardrop pin -->
        <div style="
          position:relative;
          width:${size}px;
          height:${size}px;
          background:${cfg.bg};
          border:2.5px solid ${cfg.border};
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          ${selectedGlow}
          transition:all 0.2s ease;
          flex-shrink:0;
        ">
          <!-- Icon inside (counter-rotated) -->
          <div style="
            position:absolute;
            inset:0;
            display:flex;
            align-items:center;
            justify-content:center;
            transform:rotate(45deg);
            font-size:${innerSize * 0.5}px;
            font-weight:900;
            color:white;
            font-family:system-ui,sans-serif;
            line-height:1;
            padding-bottom:2px;
          ">${cfg.label}</div>
        </div>
      </div>`,
    iconSize:   [size + 24, size + 24],
    iconAnchor: [(size + 24) / 2, (size + 24) * 0.82],
    popupAnchor:[0, -(size + 8)],
  });
}

// ─── Map pan offset controller ─────────────────────────────────────────────────
// Pans the Leaflet map left by panOffset px when the ContextPanel is open,
// keeping the selected pin visible in the remaining canvas space.

function PanController({ panOffset }: { panOffset: number }) {
  const map = useMap();
  const prevOffset = useRef(0);
  useEffect(() => {
    const delta = panOffset - prevOffset.current;
    if (delta !== 0) {
      map.panBy([-delta / 2, 0], { animate: true, duration: 0.35 });
      prevOffset.current = panOffset;
    }
  }, [panOffset, map]);
  return null;
}


const getIncidentIcon = (severity: string) => {
  const c =
    severity === 'critical' ? '#ef4444' :
    severity === 'high'     ? '#f97316' :
    severity === 'medium'   ? '#f59e0b' : '#06B6D4';
  return L.divIcon({
    className: 'custom-icon bg-transparent border-0',
    html: `<div style="width:14px;height:14px;background:${c};border:2px solid white;border-radius:50%;box-shadow:0 0 8px ${c}80"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// ─── FlyToFocus ───────────────────────────────────────────────────────────────

function FlyToFocus({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prev = useRef<[number, number]>(center);
  useEffect(() => {
    if (prev.current[0] !== center[0] || prev.current[1] !== center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
      prev.current = center;
    }
  }, [center[0], center[1], zoom, map]);
  return null;
}

// ─── HeatLayer — SVG circles drawn as Leaflet layer ──────────────────────────
// We render heat points as radial gradient SVG overlays on the map.
// Since we can't use leaflet.heat without installing a new package,
// we use Circle elements with very low opacity stacked to create the heat effect.

interface HeatLayerProps {
  clusterZones: ClusterZone[];
  visible: boolean;
}

const CLUSTER_COLORS: Record<ClusterZone['severity'], { fill: string; stroke: string }> = {
  critical: { fill: '#ef4444', stroke: '#ef4444' },
  high:     { fill: '#f97316', stroke: '#f97316' },
  medium:   { fill: '#f59e0b', stroke: '#f59e0b' },
  low:      { fill: '#06B6D4', stroke: '#06B6D4' },
};

function HeatLayer({ clusterZones, visible }: HeatLayerProps) {
  if (!visible) return null;
  return (
    <>
      {clusterZones.map((zone, i) => {
        const col = CLUSTER_COLORS[zone.severity];
        const opacity = 0.08 + (zone.riskScore / 100) * 0.22;
        const strokeOpacity = 0.15 + (zone.riskScore / 100) * 0.35;
        return (
          <React.Fragment key={`heat-${zone.locationCode}-${i}`}>
            {/* Outer glow ring */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zone.radius * 2.5}
              pathOptions={{
                color: col.stroke,
                fillColor: col.fill,
                fillOpacity: opacity * 0.4,
                weight: 0,
              }}
            />
            {/* Mid ring */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zone.radius * 1.5}
              pathOptions={{
                color: col.stroke,
                fillColor: col.fill,
                fillOpacity: opacity * 0.7,
                weight: 0,
              }}
            />
            {/* Core */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: col.stroke,
                fillColor: col.fill,
                fillOpacity: opacity * 1.2,
                weight: 1.5,
                opacity: strokeOpacity,
                dashArray: zone.severity === 'critical' ? undefined : '4 4',
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─── Time-window config ───────────────────────────────────────────────────────

const TIME_WINDOWS: { key: TimeWindow; label: string }[] = [
  { key: '1h',  label: '1H' },
  { key: '24h', label: '24H' },
  { key: '7d',  label: '7D' },
  { key: '30d', label: '30D' },
  { key: 'all', label: 'All' },
];

// ─── Trend icon ───────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: ZoneRiskRow['trend'] }) {
  if (trend === 'rising')  return <TrendingUp  size={11} className="text-rose-400" />;
  if (trend === 'falling') return <TrendingDown size={11} className="text-emerald-400" />;
  return <Minus size={11} className="text-slate-400" />;
}

// ─── Risk score bar ───────────────────────────────────────────────────────────

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-rose-500' :
    score >= 40 ? 'bg-orange-500' :
    score >= 20 ? 'bg-amber-500' : 'bg-cyan-500';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', color)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-black tabular-nums text-white/60 w-6 text-right">{score}</span>
    </div>
  );
}

// ─── Zone Risk Panel ──────────────────────────────────────────────────────────

interface ZoneRiskPanelProps {
  rows: ZoneRiskRow[];
  onZoneClick: (row: ZoneRiskRow) => void;
  loading: boolean;
}

function ZoneRiskPanel({ rows, onZoneClick, loading }: ZoneRiskPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const top = rows.slice(0, 6);

  return (
    <div className="absolute bottom-10 right-6 z-[400] w-72">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-[#12141A]/90 dark:bg-[#0A0C12]/95 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/3 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={13} className="text-cyan-400" />
            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Zone Risk Index</span>
          </div>
          <div className="flex items-center gap-2">
            {rows[0] && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20 uppercase tracking-widest">
                {rows[0].locationCode} highest
              </span>
            )}
            <ChevronRight size={12} className={cn('text-white/30 transition-transform', !collapsed && 'rotate-90')} />
          </div>
        </button>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {loading || top.length === 0 ? (
                <div className="px-4 py-6 text-center text-white/30 text-[11px] font-medium">
                  {loading ? 'Computing risk scores…' : 'No incidents in this window'}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {top.map((row, i) => (
                    <button
                      key={row.locationCode}
                      onClick={() => onZoneClick(row)}
                      className="w-full px-4 py-3 text-left hover:bg-white/4 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/25 font-mono w-4">#{i + 1}</span>
                          <span className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors truncate max-w-[120px]">
                            {row.locationName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendIcon trend={row.trend} />
                          <span className="text-[9px] font-mono text-white/30">
                            {row.incidentCount} inc
                          </span>
                        </div>
                      </div>
                      <RiskBar score={row.riskScore} />
                      {row.peakDay !== '—' && (
                        <p className="text-[9px] text-white/20 mt-1 font-medium">
                          Peak: {row.peakDay} {row.peakHour}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Personnel Layer ──────────────────────────────────────────────────────────

function PersonnelLayer({ personnel, visible }: { personnel: Personnel[]; visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {personnel.map(p => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={makePersonnelIcon(p)}>
          <Popup>
            <div className="flex flex-col gap-2 min-w-[190px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-black text-white">{p.name}</span>
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: STATUS_CONFIG[p.status].dot, background: STATUS_CONFIG[p.status].dot + '20' }}
                >
                  {STATUS_CONFIG[p.status].label}
                </span>
              </div>
              {/* Role */}
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ color: ROLE_CONFIG[p.role].color, background: ROLE_CONFIG[p.role].bg }}
                >
                  {ROLE_CONFIG[p.role].label}
                </span>
                <span className="text-[10px] font-mono text-white/40">{p.zone}</span>
              </div>
              {/* Height */}
              {p.heightBand && (
                <div className="text-[10px] text-white/50 font-medium">
                  {HEIGHT_LABEL[p.heightBand]}
                </div>
              )}
              {/* Last ping */}
              <div className="flex items-center gap-1.5 text-[9px] text-white/30 mt-0.5">
                <Radio size={8} className="text-white/20" />
                Last ping: {p.lastPing}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

// ─── Personnel Manifest Panel (collapsible card, lives in left dock) ──────────

interface PersonnelManifestProps {
  personnel: Personnel[];
  visible: boolean;
  onPersonClick: (p: Personnel) => void;
}

function PersonnelManifest({ personnel, visible, onPersonClick }: PersonnelManifestProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [filter, setFilter] = useState<PersonnelStatus | 'all'>('all');

  const counts = {
    active:   personnel.filter(p => p.status === 'active').length,
    standby:  personnel.filter(p => p.status === 'standby').length,
    incident: personnel.filter(p => p.status === 'incident').length,
    offline:  personnel.filter(p => p.status === 'offline').length,
  };

  const atHeight = personnel.filter(p => p.heightBand && p.heightBand !== 'ground' && p.status !== 'offline').length;
  const filtered = filter === 'all' ? personnel : personnel.filter(p => p.status === filter);
  const incidentCount = counts.incident;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="bg-[#12141A]/95 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header / toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users size={13} className="text-emerald-400" />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Personnel</span>
              {/* Live count pills */}
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                {counts.active + counts.standby} on-site
              </span>
              {incidentCount > 0 && (
                <span className="text-[9px] font-black text-rose-400 bg-rose-500/15 border border-rose-500/25 px-1.5 py-0.5 rounded-full animate-pulse">
                  {incidentCount} alert
                </span>
              )}
            </div>
            <ChevronRight size={12} className={cn('text-white/30 transition-transform shrink-0', !collapsed && 'rotate-90')} />
          </button>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="overflow-hidden border-t border-white/5"
              >
                {/* Stat strip */}
                <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5">
                  {([
                    { key: 'active',   label: 'Active',  color: '#34d399' },
                    { key: 'standby',  label: 'Standby', color: '#f59e0b' },
                    { key: 'incident', label: 'Alert',   color: '#ef4444' },
                    { key: 'offline',  label: 'Offline', color: '#475569' },
                  ] as const).map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(f => f === key ? 'all' : key)}
                      className={cn('py-2.5 flex flex-col items-center transition-all', filter === key ? 'bg-white/5' : 'hover:bg-white/3')}
                    >
                      <span className="text-base font-black tabular-nums leading-none" style={{ color }}>{counts[key]}</span>
                      <span className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 font-bold">{label}</span>
                    </button>
                  ))}
                </div>

                {/* At-height callout */}
                {atHeight > 0 && (
                  <div className="mx-3 mt-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <HardHat size={12} className="text-amber-400 shrink-0" />
                    <span className="text-[10px] text-amber-300 font-bold">{atHeight} personnel at height</span>
                  </div>
                )}

                {/* Personnel list */}
                <div className="divide-y divide-white/4 max-h-56 overflow-y-auto mt-1.5">
                  {filtered.map(p => {
                    const rc = ROLE_CONFIG[p.role];
                    const sc = STATUS_CONFIG[p.status];
                    return (
                      <button
                        key={p.id}
                        onClick={() => onPersonClick(p)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/4 transition-colors text-left group"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black relative"
                          style={{ background: rc.bg, border: `1.5px solid ${rc.color}`, color: rc.color }}
                        >
                          {p.name.split(' ').map(n => n[0]).join('')}
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-[#12141A]" style={{ background: sc.dot }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white/85 group-hover:text-white transition-colors truncate">{p.name}</span>
                            <span className="text-[9px] font-mono text-white/25 ml-1 shrink-0">{p.zone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold" style={{ color: rc.color }}>{rc.label}</span>
                            {p.heightBand && p.heightBand !== 'ground' && (
                              <span className="text-[8px] text-amber-400/70 font-medium">· {p.heightBand === 'rope' ? '🧗 Rope' : `↑ ${p.heightBand}`}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {p.status === 'offline' ? <WifiOff size={9} className="text-slate-600" /> : <Wifi size={9} className="text-emerald-500/60" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-white/5 bg-white/2">
                  <p className="text-[9px] text-white/20 leading-relaxed">Tap a person to fly to their position.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Threat Overlay Panel (top-right controls) ────────────────────────────────

interface ThreatOverlayPanelProps {
  timeWindow: TimeWindow;
  onTimeWindow: (w: TimeWindow) => void;
  showHeat: boolean;
  onToggleHeat: () => void;
  showClusters: boolean;
  onToggleClusters: () => void;
  showPersonnel: boolean;
  onTogglePersonnel: () => void;
  personnelCount: number;
  totalFiltered: number;
  criticalCount: number;
  highCount: number;
  patterns: { label: string; count: number }[];
}

function ThreatOverlayPanel({
  timeWindow, onTimeWindow,
  showHeat, onToggleHeat,
  showClusters, onToggleClusters,
  showPersonnel, onTogglePersonnel,
  personnelCount,
  totalFiltered, criticalCount, highCount,
  patterns,
}: ThreatOverlayPanelProps) {
  const [patternsOpen, setPatternsOpen] = useState(false);

  return (
    <div className="absolute top-28 right-6 z-[400] flex flex-col gap-3 items-end">
      {/* Time filter + stat strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#12141A]/90 dark:bg-[#0A0C12]/95 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Stat strip */}
        <div className="flex items-center gap-0 divide-x divide-white/5 border-b border-white/5">
          <div className="px-4 py-2.5 flex flex-col items-center">
            <span className="text-lg font-black text-white tabular-nums leading-none">{totalFiltered}</span>
            <span className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 font-bold">Total</span>
          </div>
          <div className="px-4 py-2.5 flex flex-col items-center">
            <span className="text-lg font-black text-rose-400 tabular-nums leading-none">{criticalCount}</span>
            <span className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 font-bold">Critical</span>
          </div>
          <div className="px-4 py-2.5 flex flex-col items-center">
            <span className="text-lg font-black text-orange-400 tabular-nums leading-none">{highCount}</span>
            <span className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5 font-bold">High</span>
          </div>
        </div>

        {/* Time window selector */}
        <div className="flex items-center gap-1 p-2">
          <Clock size={11} className="text-white/25 ml-1 mr-0.5 shrink-0" />
          {TIME_WINDOWS.map(tw => (
            <button
              key={tw.key}
              onClick={() => onTimeWindow(tw.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                timeWindow === tw.key
                  ? 'bg-cyan-500 text-slate-900 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
            >
              {tw.label}
            </button>
          ))}
        </div>

        {/* Layer toggles */}
        <div className="flex flex-wrap items-center gap-1 px-3 pb-2.5 border-t border-white/5 pt-2">
          <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold mr-1 w-full">Layers</span>
          <button
            onClick={onToggleHeat}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
              showHeat
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                : 'bg-white/3 text-white/30 border-white/8 hover:text-white/50'
            )}
          >
            <Flame size={9} />
            Heat
          </button>
          <button
            onClick={onToggleClusters}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
              showClusters
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-white/3 text-white/30 border-white/8 hover:text-white/50'
            )}
          >
            <Layers size={9} />
            Clusters
          </button>
          {/* ── Personnel toggle ── */}
          <button
            onClick={onTogglePersonnel}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border relative',
              showPersonnel
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-white/3 text-white/30 border-white/8 hover:text-white/50'
            )}
          >
            <Users size={9} />
            Personnel
            {personnelCount > 0 && (
              <span className={cn(
                'absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[8px] font-black flex items-center justify-center',
                showPersonnel ? 'bg-emerald-500 text-slate-900' : 'bg-white/20 text-white/50'
              )}>
                {personnelCount}
              </span>
            )}
          </button>
          {patterns.length > 0 && (
            <button
              onClick={() => setPatternsOpen(o => !o)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border',
                patternsOpen
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                  : 'bg-white/3 text-white/30 border-white/8 hover:text-white/50'
              )}
            >
              <BarChart3 size={9} />
              Patterns
            </button>
          )}
        </div>
      </motion.div>

      {/* Pattern insight cards */}
      <AnimatePresence>
        {patternsOpen && patterns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="bg-[#12141A]/95 backdrop-blur-xl border border-violet-500/20 rounded-2xl shadow-2xl w-72 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BarChart3 size={12} className="text-violet-400" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.18em]">Pattern Intelligence</span>
              </div>
              <button onClick={() => setPatternsOpen(false)} className="text-white/20 hover:text-white/60 transition-colors">
                <X size={13} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {patterns.map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={9} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/75 font-semibold leading-snug">{p.label}</p>
                    <p className="text-[9px] text-violet-400/70 mt-0.5 font-bold">
                      {p.count} incident{p.count !== 1 ? 's' : ''} in this slot
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-violet-950/30 border-t border-violet-500/10">
              <p className="text-[9px] text-violet-400/50 leading-relaxed">
                Patterns detected from incidents with timestamps. Increase deployment in flagged zones during peak windows.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Enhanced Legend ──────────────────────────────────────────────────────────

function MapLegend({ showHeat, showClusters, showPersonnel }: { showHeat: boolean; showClusters: boolean; showPersonnel: boolean }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-[#12141A]/90 dark:bg-[#0A0C12]/95 backdrop-blur-xl border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
    >
      {/* Header / toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-white/40" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Legend</span>
        </div>
        <ChevronRight size={12} className={cn('text-white/30 transition-transform', !collapsed && 'rotate-90')} />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-2.5">
              {/* Markers */}
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 relative shrink-0">
                  <div className="absolute inset-0 bg-rose-500 rounded-full opacity-30 animate-pulse" />
                  <div className="w-2.5 h-2.5 bg-rose-500 border border-white rounded-full absolute top-0.5 left-0.5" />
                </div>
                <span className="text-[10px] text-white/50 font-medium">High-risk location</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-cyan-400 border border-white/60 rounded-full shrink-0 ml-0.5" />
                <span className="text-[10px] text-white/50 font-medium">Secure zone</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shrink-0 ml-0.5 ring-1 ring-white/30" />
                <span className="text-[10px] text-white/50 font-medium">Active incident</span>
              </div>

              {/* Personnel legend */}
              {showPersonnel && (
                <div className="border-t border-white/5 pt-2 space-y-1.5">
                  <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Personnel</p>
                  {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
                    <div key={role} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black shrink-0"
                        style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}`, color: cfg.color }}>
                        ✦
                      </div>
                      <span className="text-[9px] text-white/35">{cfg.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-white/5">
                    {[
                      { dot: '#34d399', label: 'Active' },
                      { dot: '#ef4444', label: 'Incident' },
                      { dot: '#475569', label: 'Offline' },
                    ].map(({ dot, label }) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                        <span className="text-[8px] text-white/30">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Heat / Cluster legend */}
              {(showHeat || showClusters) && (
                <div className="border-t border-white/5 pt-2 space-y-2">
                  {showHeat && (
                    <>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Heat Intensity</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #06B6D4, #f59e0b, #ef4444)' }} />
                        <span className="text-[9px] text-white/30">Low → High</span>
                      </div>
                    </>
                  )}
                  {showClusters && (
                    <>
                      <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold mt-2">Cluster Severity</p>
                      <div className="space-y-1">
                        {[
                          { color: '#ef4444', label: 'Critical zone' },
                          { color: '#f97316', label: 'High zone' },
                          { color: '#f59e0b', label: 'Medium zone' },
                          { color: '#06B6D4', label: 'Low zone' },
                        ].map(({ color, label }) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ background: color + '60' }} />
                            <span className="text-[9px] text-white/35">{label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Cluster popup ────────────────────────────────────────────────────────────

function ClusterPopupLayer({ clusterZones, visible }: { clusterZones: ClusterZone[]; visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {clusterZones.map((zone, i) => {
        const col = CLUSTER_COLORS[zone.severity];
        return (
          <Circle
            key={`cluster-popup-${zone.locationCode}-${i}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{ color: 'transparent', fillOpacity: 0, weight: 0 }}
          >
            <Popup>
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={12} style={{ color: col.fill }} />
                  <span className="text-xs font-black text-white">{zone.locationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Risk Score</span>
                  <span className="text-sm font-black" style={{ color: col.fill }}>{zone.riskScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Incidents</span>
                  <span className="text-xs text-white font-bold">{zone.count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Severity</span>
                  <span className="text-[10px] font-black uppercase" style={{ color: col.fill }}>{zone.severity}</span>
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}

// ─── Main RiskMap ─────────────────────────────────────────────────────────────

export function RiskMap({
  locations,
  riskZones,
  incidents = [],
  focus,
  onLocationSelect,
  panOffset = 0,
}: RiskMapProps) {
  const defaultCenter: [number, number] = [51.5074, -0.1278];
  const initialCenter: [number, number] = focus
    ? [focus.lat, focus.lng]
    : locations.length > 0
    ? [locations[0].lat, locations[0].lng]
    : defaultCenter;
  const initialZoom = focus?.zoom ?? 17;

  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');
  const [showHeat, setShowHeat] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showPersonnel, setShowPersonnel] = useState(false);

  // Seed personnel from locations (demo data)
  const personnel = React.useMemo(() => seedPersonnel(locations), [locations]);

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [isDusk, setIsDusk] = useState(
    document.documentElement.getAttribute('data-theme') === 'dusk'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
      setIsDusk(document.documentElement.getAttribute('data-theme') === 'dusk');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

  // ── Derived heatmap data ──
  const { heatPoints, clusterZones, zoneRiskRows, patterns, totalFiltered, criticalCount, highCount } =
    useHeatmapData(incidents, locations, timeWindow);

  // ── Fly to zone on panel click ──
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const handleZoneClick = useCallback((row: ZoneRiskRow) => {
    const loc = locations.find(l => l.code === row.locationCode);
    if (loc) setFlyTarget({ lat: loc.lat, lng: loc.lng, zoom: 19 });
  }, [locations]);

  // ── Personnel toggle ──
  const handleTogglePersonnel = useCallback(() => {
    setShowPersonnel(v => !v);
  }, []);

  // ── Fly to personnel ──
  const handlePersonClick = useCallback((p: Personnel) => {
    setFlyTarget({ lat: p.lat, lng: p.lng, zoom: 20 });
  }, []);

  return (
    <div className="absolute inset-0 z-0 animate-in fade-in duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
      {/* Dusk theme tint — overlays the map with a deep navy wash to visually distinguish from Night */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-700"
        style={{
          background: 'linear-gradient(135deg, rgba(10,40,100,0.28) 0%, rgba(0,15,50,0.22) 100%)',
          opacity: isDusk ? 1 : 0,
        }}
        data-dusk-overlay
      />
      {/* ── Map ── */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          key={tileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Focus fly-to from prop */}
        {focus && <FlyToFocus center={[focus.lat, focus.lng]} zoom={focus.zoom ?? 19} />}

        {/* Focus fly-to from panel click */}
        {flyTarget && (
          <FlyToFocus center={[flyTarget.lat, flyTarget.lng]} zoom={flyTarget.zoom} />
        )}

        {/* Pan controller — shifts map left when ContextPanel opens */}
        <PanController panOffset={panOffset} />

        {/* ── Heat / cluster overlay ── */}
        <HeatLayer clusterZones={clusterZones} visible={showHeat} />
        <ClusterPopupLayer clusterZones={clusterZones} visible={showClusters} />

        {/* ── Location markers — anchor-type aware ── */}
        {locations.map(loc => {
          // Determine primary anchor type for the pin style
          const anchorType = loc.anchorTypes?.[0];
          const icon = anchorType
            ? makeAnchorPin(anchorType)
            : getMarkerIcon(loc.risk);

          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  onLocationSelect?.(loc.code);
                  setFlyTarget({ lat: loc.lat, lng: loc.lng, zoom: 17 });
                },
              }}
            >
              <Popup>
                <div className="flex flex-col gap-1">
                  <div className="font-bold text-sm text-white mb-1">{loc.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded">
                      {loc.code}
                    </span>
                    {anchorType && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{
                          color: ANCHOR_CONFIG[anchorType].bg,
                          background: ANCHOR_CONFIG[anchorType].bg + '20',
                        }}
                      >
                        {anchorType === 'red' ? 'SOS Anchor' : anchorType === 'amber' ? 'Hazard Anchor' : 'Safe Anchor'}
                      </span>
                    )}
                  </div>
                  {loc.incidentCount > 0 && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      {loc.incidentCount} incident{loc.incidentCount !== 1 ? 's' : ''} recorded
                    </div>
                  )}
                  {onLocationSelect && (
                    <button
                      onClick={() => onLocationSelect(loc.code)}
                      className="mt-2 w-full text-[10px] font-bold text-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/20 rounded-lg py-1.5 transition-colors"
                    >
                      Open in Context Panel →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── Active incident markers ── */}
        {incidents
          .filter(inc => inc.status !== 'resolved')
          .map(inc => (
            <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={getIncidentIcon(inc.severity)}>
              <Popup>
                <div className="flex flex-col gap-1 min-w-[180px]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{inc.incidentId}</span>
                    <span className="text-[10px] font-mono text-slate-400">{inc.locationCode}</span>
                  </div>
                  <div className="text-sm font-medium text-white leading-snug line-clamp-3">{inc.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Reporter: {inc.reporter}</div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* ── Personnel dots ── */}
        <PersonnelLayer personnel={personnel} visible={showPersonnel} />

        {/* ── Legacy risk zone dashed rings ── */}
        {!showClusters && riskZones.map(zone => (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            pathOptions={{
              color: '#f43f5e',
              fillColor: '#f43f5e',
              fillOpacity: 0.04,
              weight: 1,
              dashArray: '4',
            }}
            radius={zone.radius || 25}
          />
        ))}
      </MapContainer>

      {/* ── Overlay panels ── */}

      {/* ── LEFT DOCK — bottom-left, stacked column, cards grow upward ── */}
      <div className="absolute bottom-6 left-6 z-[400] flex flex-col gap-2 w-72 items-stretch">
        {/* Personnel card — only when personnel layer is active */}
        <PersonnelManifest
          personnel={personnel}
          visible={showPersonnel}
          onPersonClick={handlePersonClick}
        />
        {/* Legend card — always visible */}
        <MapLegend showHeat={showHeat} showClusters={showClusters} showPersonnel={showPersonnel} />
      </div>

      {/* ── RIGHT DOCK — top-right controls + bottom-right zone risk ── */}
      <ThreatOverlayPanel
        timeWindow={timeWindow}
        onTimeWindow={setTimeWindow}
        showHeat={showHeat}
        onToggleHeat={() => setShowHeat(h => !h)}
        showClusters={showClusters}
        onToggleClusters={() => setShowClusters(c => !c)}
        showPersonnel={showPersonnel}
        onTogglePersonnel={handleTogglePersonnel}
        personnelCount={personnel.length}
        totalFiltered={totalFiltered}
        criticalCount={criticalCount}
        highCount={highCount}
        patterns={patterns}
      />

      <ZoneRiskPanel
        rows={zoneRiskRows}
        onZoneClick={handleZoneClick}
        loading={false}
      />

      {/* ── Popup + animation styles ── */}
      <style>{`
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: #1A1C23 !important;
          color: white !important;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .leaflet-popup-content { margin: 12px !important; }
        .leaflet-container a.leaflet-popup-close-button { color: #94a3b8 !important; }
        /* Personnel marker pulse */
        @keyframes personnel-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.6); opacity: 0; }
        }
        /* Anchor radar rings — Red SOS zones */
        @keyframes anchor-ring-1 {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
        }
        @keyframes anchor-ring-2 {
          0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
        }
        @keyframes anchor-ring-3 {
          0%   { transform: translate(-50%,-50%) scale(0.3); opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0; }
        }
        /* Make pins feel interactive */
        .custom-icon { cursor: pointer !important; }
        .custom-icon:hover div { filter: brightness(1.2); }
      `}</style>
    </div>
  );
}
