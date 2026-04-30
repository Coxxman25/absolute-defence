import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Send, CheckCircle2, AlertTriangle, MapPin,
  Navigation, Loader2, WifiOff, RefreshCw, Lock, Heart,
  Mic, Square, Play, Pause, RotateCcw
} from 'lucide-react';
import { WEBHOOK_ID } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

// Public webhook — no auth token required, safe to call from anonymous devices
async function submitViaWebhook(payload: {
  locationCode: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  reporter: string;
  description: string;
}): Promise<void> {
  const res = await fetch(`/api/taskade/webhooks/${WEBHOOK_ID}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webhook failed ${res.status}: ${text}`);
  }
}

type Step = 'form' | 'submitting' | 'success' | 'error';

// ── Geo status bar ────────────────────────────────────────────────────────────
// IMPORTANT: onRequest must be wired to a button's onClick so it runs inside
// a user gesture — this is required for Android Chrome to show the permission dialog.
function GeoStatusBar({
  status,
  address,
  lat,
  lng,
  accuracy,
  error,
  onRequest,
}: {
  status: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  onRequest: () => void;
}) {
  // Idle — show a prominent tap-to-share button
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={onRequest}
        className="w-full flex items-center gap-3 bg-neutral-900 border border-neutral-700 hover:border-[#06B6D4]/50 active:border-[#06B6D4] rounded-2xl px-4 py-3.5 mb-6 text-left transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center shrink-0 group-hover:bg-[#06B6D4]/20 transition-colors">
          <Navigation size={14} className="text-[#06B6D4]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white">Tap to share your location</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Helps pinpoint your report on the safety map</p>
        </div>
        <div className="text-[10px] font-bold text-[#06B6D4] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
          Allow
        </div>
      </button>
    );
  }

  if (status === 'requesting') {
    return (
      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5 mb-6">
        <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-900 flex items-center justify-center shrink-0">
          <Navigation size={14} className="text-cyan-400 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Waiting for location…</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Tap "Allow" when your browser asks</p>
        </div>
      </div>
    );
  }

  if (status === 'reverse-geocoding') {
    return (
      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3.5 mb-6">
        <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-900 flex items-center justify-center shrink-0">
          <Loader2 size={14} className="text-cyan-400 animate-spin" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Identifying your location…</p>
          {lat != null && lng != null && (
            <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
          )}
        </div>
      </div>
    );
  }

  if (status === 'ready' && address) {
    return (
      <div className="bg-neutral-900 border border-emerald-900/60 rounded-2xl px-4 py-3.5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={14} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Location Captured</p>
              {accuracy != null && (
                <span className="text-[9px] text-neutral-600 font-mono">±{Math.round(accuracy)}m</span>
              )}
            </div>
            <p className="text-sm font-semibold text-white leading-snug">{address}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'denied' || status === 'error') {
    return (
      <div className="bg-neutral-900 border border-amber-900/60 rounded-2xl px-4 py-3.5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-950 border border-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <WifiOff size={14} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-300 mb-0.5">
              {status === 'denied' ? 'Location Blocked' : 'Location Unavailable'}
            </p>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              {status === 'denied'
                ? 'Please enable location in your browser settings, then tap below to try again.'
                : 'Could not get GPS. Your report will still be submitted — tap below to retry.'}
            </p>
            <button
              type="button"
              onClick={onRequest}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#06B6D4] hover:text-cyan-300 mt-2.5 transition-colors active:scale-95"
            >
              <RefreshCw size={10} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Concern Category options ──────────────────────────────────────────────────
const CONCERN_TYPES = [
  { value: 'physical_threat', label: 'Physical Threat',   desc: 'Someone threatening or intimidating you or others', color: 'border-rose-700 bg-rose-950/40 text-rose-300' },
  { value: 'physical_harm',   label: 'Assault / Fight',   desc: 'Physical aggression, fighting, or attack',          color: 'border-red-600 bg-red-950/60 text-red-200' },
  { value: 'verbal_abuse',    label: 'Verbal Abuse',      desc: 'Harassment, threats, or sustained verbal aggression',color: 'border-amber-700 bg-amber-950/40 text-amber-300' },
  { value: 'weapons',         label: 'Weapon Sighted',    desc: 'Suspected or visible weapon on the premises',        color: 'border-red-500 bg-red-950/70 text-red-100' },
  { value: 'substance',       label: 'Drugs / Alcohol',   desc: 'Suspected substance misuse on or near site',        color: 'border-orange-700 bg-orange-950/40 text-orange-300' },
  { value: 'self_harm',       label: 'Welfare Concern',   desc: 'Concern about someone\'s safety or wellbeing',      color: 'border-pink-700 bg-pink-950/40 text-pink-300' },
  { value: 'cyber',           label: 'Cyber / Online',    desc: 'Online harassment, threats, or harmful content',    color: 'border-blue-700 bg-blue-950/40 text-blue-300' },
  { value: 'other',           label: 'Other Concern',     desc: 'Anything else that feels unsafe or concerning',     color: 'border-neutral-600 bg-neutral-800/40 text-neutral-300' },
];

const URGENCY_OPTIONS = [
  { value: 'low',      label: 'Not urgent',  desc: 'Can wait — no immediate risk' },
  { value: 'medium',   label: 'Soon',        desc: 'Should be looked at today' },
  { value: 'high',     label: 'Urgent',      desc: 'Needs attention right away' },
  { value: 'critical', label: 'Emergency',   desc: 'Someone is in danger now' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export function PublicReportForm() {
  const [step, setStep] = useState<Step>('form');
  const [description, setDescription] = useState('');
  const [concernType, setConcernType] = useState('bullying');
  const [urgency, setUrgency] = useState('medium');
  const [wantsFollowUp, setWantsFollowUp] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [useVoice, setUseVoice] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioPlayRef = useRef<HTMLAudioElement>(null);
  const recorder = useAudioRecorder(120);

  const [qrLocationCode, setQrLocationCode] = useState('');
  const [qrLocationName, setQrLocationName] = useState('');

  // GPS — NOT auto-requested on mount.
  // Must be triggered by a user tap (onClick) for Android Chrome to show the permission dialog.
  // autoRequest=false is intentional and critical for cross-platform compatibility.
  const geo = useGeolocation(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loc = params.get('loc');
    if (loc) {
      setQrLocationCode(loc);
      setQrLocationName(loc.replace(/-/g, ' ').replace(/_/g, ' '));
    }
  }, []);

  const hasContent = useVoice ? !!recorder.audioUrl : !!description.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) return;
    setStep('submitting');

    try {
      // Use real GPS if captured; use 0,0 as sentinel for "no location" (not London)
      const lat = geo.lat ?? 0;
      const lng = geo.lng ?? 0;

      let locationCode = qrLocationCode;
      if (!locationCode) locationCode = 'UNKNOWN';

      const incidentId = `SG-${Date.now()}`;

      const descriptionText = useVoice
        ? `[${concernType.toUpperCase()}] [VOICE_RECORDING] Duration: ${Math.floor(recorder.duration / 60)}:${String(recorder.duration % 60).padStart(2, '0')} | Audio concern submitted for review`
        : `[${concernType.toUpperCase()}] ${description}`;

      await submitViaWebhook({
        locationCode,
        severity: urgency,
        status: 'pending',
        latitude: lat,
        longitude: lng,
        reporter: 'Anonymous Student Report',
        description: descriptionText,
      });

      setSubmittedId(incidentId);
      setStep('success');
    } catch (err) {
      console.error('Submission failed', err);
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/60 backdrop-blur-sm sticky top-0 bg-[#0A0A0A]/90 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
            <ShieldCheck size={15} className="text-[#06B6D4]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">SafeGuard</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">Absolute Defence OS · Anonymous Report</p>
          </div>
        </div>

        {/* Anonymous badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-950/60 border-emerald-800 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
          <Lock size={9} />
          Anonymous
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
          {step === 'success' && (
            <div className="text-center py-10 animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-950/50">
                <Heart size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Thank You</h2>
              {submittedId && (
                <p className="text-[10px] font-mono text-neutral-600 mb-4">Ref: {submittedId}</p>
              )}
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                Your report has been received. A trained Safety Lead will review it in confidence. You don't have to do anything else.
              </p>

              {qrLocationName && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3 text-left">
                  <MapPin size={14} className="text-[#06B6D4] shrink-0" />
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Reported from</p>
                    <p className="text-xs font-semibold text-white capitalize">{qrLocationName}</p>
                  </div>
                </div>
              )}

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left space-y-2.5">
                {[
                  'Report logged to the Absolute Defence OS',
                  'Safety Lead notified immediately',
                  'ARIA risk triage analysis triggered',
                  'Your identity is fully protected',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-neutral-700 mt-6 leading-relaxed">
                You can close this page safely. If you or someone else is in immediate danger, call 999.
              </p>
            </div>
          )}

          {/* ── ERROR ────────────────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={36} className="text-rose-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                Your report could not be submitted. Please try again, or speak to a trusted adult directly.
              </p>
              <button
                onClick={() => setStep('form')}
                className="px-6 py-3 bg-white text-neutral-900 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ── FORM ─────────────────────────────────────────────────────────── */}
          {(step === 'form' || step === 'submitting') && (
            <div className="animate-in fade-in duration-300 space-y-6">

              {/* Safe space header */}
              <div className="bg-[#06B6D4]/[0.06] border border-[#06B6D4]/20 rounded-2xl px-4 py-4">
                <p className="text-xs font-bold text-[#06B6D4] mb-1">You are safe here.</p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  This report is completely anonymous. No one can see who you are. A trained Safety Lead will read your report privately and in confidence.
                </p>
              </div>

              {/* QR location label */}
              {qrLocationName && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <MapPin size={14} className="text-neutral-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Reporting from</p>
                    <p className="text-sm font-semibold text-white capitalize">{qrLocationName}</p>
                  </div>
                </div>
              )}

              {/* ── GPS location capture ── */}
              <GeoStatusBar
                status={geo.status}
                address={geo.address}
                lat={geo.lat}
                lng={geo.lng}
                accuracy={geo.accuracy}
                error={geo.error}
                onRequest={geo.request}
              />

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Concern type */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                    What type of concern is this?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONCERN_TYPES.map(opt => (
                      <label
                        key={opt.value}
                        className={cn(
                          'p-3 rounded-xl border cursor-pointer transition-all',
                          concernType === opt.value
                            ? opt.color
                            : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                        )}
                      >
                        <input
                          type="radio"
                          name="concernType"
                          value={opt.value}
                          checked={concernType === opt.value}
                          onChange={() => setConcernType(opt.value)}
                          className="sr-only"
                        />
                        <p className={cn(
                          'text-xs font-bold mb-0.5',
                          concernType === opt.value ? '' : 'text-neutral-300'
                        )}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-neutral-500 leading-tight">{opt.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Description — Voice or Text */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Tell us what happened
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseVoice(v => !v)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all',
                        useVoice
                          ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]'
                          : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'
                      )}
                    >
                      <Mic size={10} />
                      {useVoice ? 'Using voice' : 'Use voice'}
                    </button>
                  </div>

                  {useVoice ? (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                      {!recorder.audioUrl ? (
                        <>
                          <div className="flex items-center justify-center gap-4">
                            <button
                              type="button"
                              onClick={recorder.isRecording ? () => recorder.stop() : () => recorder.start()}
                              className={cn(
                                'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg',
                                recorder.isRecording
                                  ? 'bg-rose-500 shadow-rose-500/30 animate-pulse'
                                  : 'bg-[#06B6D4] shadow-[#06B6D4]/20 hover:scale-105 active:scale-95'
                              )}
                            >
                              {recorder.isRecording ? <Square size={18} fill="white" className="text-white" /> : <Mic size={20} className="text-white" />}
                            </button>
                          </div>
                          <p className="text-center text-[10px] text-neutral-500">
                            {recorder.isRecording
                              ? `Recording… ${Math.floor(recorder.duration / 60)}:${String(recorder.duration % 60).padStart(2, '0')}`
                              : 'Tap to record your message'}
                          </p>
                          {recorder.error && (
                            <p className="text-[10px] text-rose-400 text-center">{recorder.error}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-4">
                            <button type="button" onClick={() => {
                              if (audioPlayRef.current) {
                                if (isAudioPlaying) { audioPlayRef.current.pause(); setIsAudioPlaying(false); }
                                else { audioPlayRef.current.play(); setIsAudioPlaying(true); }
                              }
                            }} className="w-10 h-10 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 flex items-center justify-center">
                              {isAudioPlaying ? <Pause size={16} className="text-[#06B6D4]" /> : <Play size={16} className="text-[#06B6D4] ml-0.5" />}
                            </button>
                            <span className="text-sm font-mono text-neutral-400">
                              {Math.floor(recorder.duration / 60)}:{String(recorder.duration % 60).padStart(2, '0')}
                            </span>
                            <button type="button" onClick={() => { recorder.reset(); setIsAudioPlaying(false); }} className="text-neutral-600 hover:text-neutral-400">
                              <RotateCcw size={14} />
                            </button>
                          </div>
                          <audio ref={audioPlayRef} src={recorder.audioUrl} onEnded={() => setIsAudioPlaying(false)} className="hidden" />
                          <p className="text-center text-[10px] text-emerald-500 font-semibold">✓ Recording saved</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Share as much or as little as you feel comfortable with. You don't need to include your name or anyone else's."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 resize-none transition-colors leading-relaxed"
                    />
                  )}
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">
                    How urgent does this feel?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {URGENCY_OPTIONS.map(opt => {
                      const urgencyColors: Record<string, string> = {
                        low:      'border-sky-700 bg-sky-950/40 text-sky-300',
                        medium:   'border-amber-700 bg-amber-950/40 text-amber-300',
                        high:     'border-rose-700 bg-rose-950/40 text-rose-300',
                        critical: 'border-red-500 bg-red-950/60 text-red-200',
                      };
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            'p-3 rounded-xl border cursor-pointer transition-all',
                            urgency === opt.value
                              ? urgencyColors[opt.value]
                              : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                          )}
                        >
                          <input
                            type="radio"
                            name="urgency"
                            value={opt.value}
                            checked={urgency === opt.value}
                            onChange={() => setUrgency(opt.value)}
                            className="sr-only"
                          />
                          <p className={cn(
                            'text-xs font-bold mb-0.5',
                            urgency === opt.value ? '' : 'text-neutral-300'
                          )}>
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-neutral-500 leading-tight">{opt.desc}</p>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Follow up consent */}
                <label className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors',
                  wantsFollowUp
                    ? 'border-[#06B6D4]/40 bg-[#06B6D4]/[0.06]'
                    : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                )}>
                  <input
                    type="checkbox"
                    checked={wantsFollowUp}
                    onChange={e => setWantsFollowUp(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0',
                    wantsFollowUp ? 'bg-[#06B6D4] border-[#06B6D4]' : 'border-neutral-600'
                  )}>
                    {wantsFollowUp && <CheckCircle2 size={10} className="text-[#0A0A0A]" />}
                  </div>
                  <div>
                    <p className={cn('text-sm font-semibold', wantsFollowUp ? 'text-[#06B6D4]' : 'text-neutral-400')}>
                      I'd like someone to check in with me
                    </p>
                    <p className="text-[10px] text-neutral-600">Speak to a trusted adult privately — still your choice</p>
                  </div>
                </label>

                {/* Privacy note */}
                <div className="flex items-start gap-2.5">
                  <Lock size={11} className="text-neutral-700 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-neutral-700 leading-relaxed">
                    This report is completely anonymous. No personal data is collected or stored. Your report goes only to the organisation's designated Safety Lead.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={step === 'submitting' || !hasContent}
                  className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#06B6D4] text-[#0A0A0A] text-sm font-bold rounded-xl hover:bg-[#22D3EE] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#06B6D4]/20"
                >
                  {step === 'submitting' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending your report…
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Report Anonymously
                    </>
                  )}
                </button>

                {/* Emergency note */}
                <p className="text-[11px] text-neutral-700 text-center leading-relaxed">
                  If you or someone else is in immediate danger — call <span className="text-white font-bold">999</span>
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
