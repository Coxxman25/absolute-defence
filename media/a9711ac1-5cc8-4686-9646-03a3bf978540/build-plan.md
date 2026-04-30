# Absolute Defence OS — Build Plan

## Status: IN PROGRESS
Last updated: 2026-03-26

## Session 3 fixes (2026-03-26)
- Fixed SituationalGuide back button: added `onBack` prop, SosEntryGate passes `() => setPath('gate')`
- Fixed VoiceJournal: added `onBack` prop + ChevronLeft back button in header
- Fixed ALL SosEntryGate action buttons:
  - GPS Pin: real geolocation API, sets gpsActive (shows checkmark)
  - Silent Mode: dims screen to 6% brightness
  - Evidence: triggers native camera via hidden `<input capture="environment">`, stores blobs in evidenceItems[], shows count badge + Evidence Vault modal
  - Alert Team: sets alertSent, shows toast, prevents double-sending
  - Voice Log: navigates to VoiceJournal with onBack
  - Mark Zone: gets geolocation, sets zoneFlagged state
  - Ask ARIA: navigates to inline AriaChat screen with back button
  - Report: window.location to /?view=report

## PHASE 1: Rebrand ✅ COMPLETE
- [x] Layout.tsx — subtitle: "School OS" → "Absolute Defence OS"
- [x] Status bar: "Safeguarding System Active" → "Absolute Defence OS · Active"
- [x] Loading screen: updated
- [x] VIEW_TITLES sub: all "Greenfield Academy" → "Absolute Defence OS"
- [x] QR panel title + help text: updated
- [x] PublicReportForm header: updated

## Confirmed Changes:
- Brand name: **SafeGuard** (keep)
- Subtitle: **Absolute Defence OS** (was "School OS")
- All other branding/colours stay

## PHASE 1b: De-school Platform ✅ COMPLETE
- [x] Registry — TYPE_LABEL, CHECKLIST, modal, drawer all generalised
- [x] IncidentVault — concern tags, DSL→Safety Lead, Assign DSL→Assign Lead, upsell
- [x] KnowledgeVault — seed docs, ARIA context, upload label, banner text
- [x] IncidentDialog — concern types (10 universal), title, labels
- [x] AriaDrawer — badge, starter prompts (6), welcome copy, footer
- [x] DemoKit — locations, steps, pitch, value prop, poster footer
- [x] PublicReportForm — concern types (8 universal), success copy, privacy note

## PHASE 2: QR Guide Mode ← IN PROGRESS

### MICRO 2.1 — Route + Shell ✅ COMPLETE
- [x] Add getGuideQrUrl() helper to api.ts (amber #f59e0b colour)
- [x] Add ?view=guide branch to App.tsx (before ?view=report)
- [x] Create SituationalGuide.tsx — dark shell, sticky header, zone badge, back button, hero headline, placeholder main area, footer

### MICRO 2.2 — Situation Selector ✅ COMPLETE
- [x] SITUATIONS data array — 8 scenarios with id, label, sublabel, Icon, urgency, palette
- [x] Urgency levels: critical (red/rose) / high (orange/amber/yellow) / medium (purple)
- [x] Critical pulse ring on critical urgency cards
- [x] 2-column grid, staggered framer-motion entrance animation per card
- [x] SituationCard component — min 120px height, tap-optimised, whileTap scale
- [x] GuideView state ('selector' | 'response') — AnimatePresence slide transition
- [x] ResponseCardStub ready for Micro 2.3 to replace
- [x] Back button context-aware: in response → returns to selector; in selector → exits

### MICRO 2.3 — Response Card ✅ COMPLETE
- [x] ResponseCardStub replaced with full ResponseCard component
- [x] RESPONSE_CONTENT record — full content for all 8 situations
- [x] Tab bar: Immediate 🔥 / De-escalate 💬 / Legal ⚖️ — animated fade between tabs
- [x] IMMEDIATE: colour-keyed numbered steps
- [x] DE-ESCALATE: italicised scripted phrases + CheckCircle coaching tips
- [x] LEGAL: statute cards (amber), Reasonable Force panel, XCircle do-not list, disclaimer
- [x] Situation banner with urgency badge + pulse ring
- [x] Report CTA amber button → ?view=report&loc=CODE
- [x] "Different situation" ghost back link below CTA

### MICRO 2.4 — ARIA AI Chat Integration ✅ COMPLETE
- [x] AriaGuideDrawer.tsx — standalone component, isolated chat state
- [x] Conversation auto-created via createConversation() when drawer first opens
- [x] Context pre-fill sent on isConnected: "[label] at zone [loc]. Give me immediate guidance."
- [x] useAgentChat hook: streaming messages, isConnected, error surface
- [x] MessageBubble — user (white pill) / assistant (glass card + ARIA avatar)
- [x] TypingDots — 3-dot bounce animation during wait and empty stream states
- [x] Auto-scroll to bottom via messagesEndRef
- [x] Shimmer skeleton while createConversation() is in flight
- [x] Connection dot + Wifi/WifiOff icon in drawer header
- [x] Context banner (amber) showing situation + zone code
- [x] First user message (context pre-fill) hidden from rendered list
- [x] Input: textarea + amber Send btn, disabled until connected + context sent
- [x] Enter to send, Shift+Enter for newline
- [x] Error states: initError banner + SDK error banner
- [x] "Ask ARIA" collapsed trigger in ResponseCard — amber pulse dot, chevron
- [x] Drawer: spring slide-up, scrim tap to dismiss, handle bar, rounded-t-3xl
- [x] Conversation persists across open/close cycles

### MICRO 2.5 — Guide QR Generation in Registry + DemoKit ✅ COMPLETE
- [x] Registry drawer: two-tab QR panel — Report QR (cyan) / Guide QR (amber) with AnimatePresence slide between
- [x] Each tab shows colour-coded QR image, URL preview pill, and Download button
- [x] handleDownloadQR(type) downloads correct QR with correct filename
- [x] DemoKit: Report/Guide poster type toggle above preview hero
- [x] GuideResponsePoster component — amber theme, same structure as GuardLinkPoster, Scan/Select/Ask ARIA steps
- [x] Kit Selector highlights with correct colour per type (cyan vs amber)
- [x] Download button label and colour adapts to posterType
- [x] Print Spec and Pitch Move Callout are context-aware per poster type

### MICRO 2.6 — Polish + Mobile Optimisation ✅ COMPLETE
- [x] ProgressStepper — animated 3-node (Select → Guide → Report), amber fill + connector lines
- [x] Compact landscape stepper strip (inline chevron row) below header
- [x] isLandscape detection: resize listener, width > height && height < 500
- [x] Landscape selector: 4-col grid, compact hero inline
- [x] Landscape ResponseCard: side-by-side (content left | CTA column right 220px)
- [x] All interactive elements ≥ 48px height (tabs 44px, CTAs 52px, back 48px)
- [x] Back in header: "Situations" when on response, "Back" on selector
- [x] Back in ResponseCard: "Choose different situation" / "Situations" (landscape)
- [x] Scroll-to-top via containerRef on view change
- [x] Safe-area top padding on header (pt-safe-top)

### MICRO 2.7 — ARIA Markdown Rendering ✅ COMPLETE
- [x] renderInline() — parses **bold**, *italic*, `code` within any text segment
- [x] AriaMarkdown() — full block-level parser: H1/H2/H3, numbered lists, bullets, HR, callouts
- [x] Numbered steps: amber circle badge + white/85 text, border-b dividers between items
- [x] Bullets: amber dot (normal) / red dot + red text (Do not / Never / Avoid / Don't)
- [x] H2 headings: amber-300 uppercase tracking-widest for section titles
- [x] H3 headings: white/70 uppercase for sub-sections
- [x] HR (---): thin white/10 divider line
- [x] Bold-only line: treated as amber callout paragraph
- [x] ARIA bubble: full-width glass card, not capped at 82% like user bubble
- [x] User bubble: unchanged white pill

### BUG FIX v2 — Voice Journal still not showing (definitive fix) ✅ FIXED
Confirmed: checkHealth showed 0 runs on VJ webhook flow. Webhook was never called.
Root cause: VoiceJournal.tsx submitJournal() used raw fetch to /api/taskade/webhooks/VJ_WEBHOOK_ID/run.
The webhook fired 0 times — likely a silent network/CORS failure on the public ?view=journal page.
Fix: Replaced webhook call entirely. Now writes DIRECTLY to project API:
  POST /api/taskade/projects/8c9dA1PvSrxBsLbK/nodes with all vj fields inline.
  Same pattern as createIncidentDirect() which is proven to work.
Also fixed:
- handleSubmit: transcription for voice entries now meaningful text (not just a placeholder)
- getVoiceJournals filter: removed /text fallback (was matching root node), requires at least one @vj attribute
- Layout: immediate fetchData(true) when switching to journals tab (no 30s wait)
- Sidebar: "Sarah Jenkins" / "Designated Safeguarding Lead" → "Safety Lead" / "Absolute Defence OS"

### BUG FIX v1 — Voice Journal not showing submissions ✅ FIXED (PARTIAL - webhook still 0 runs)
Root cause (3 issues):
1. `getVoiceJournals()` filter was too strict — required both `@vjMD` AND `@vjTR` to be non-null.
   The flow writes `@vjMD` as a select field (optionId), but filter was checking raw string presence.
   Fix: permissive filter — accept any node with ANY vj attribute OR /text content.
2. `@vjMD` is a SELECT field. Taskade returns `{ optionId: "okay" }` not `"okay"`.
   Fix: `resolveSelectId()` helper unwraps both plain string and `{ optionId }` object.
3. `@vjAI` stores raw JSON string `{"flag":"monitor","summary":"..."}` from the AI action.
   The `flag` and `aiSummary` were never parsed from it — both showed as empty.
   Fix: `parseVjAi()` helper strips code fences and JSON.parses to extract flag + summary.
4. `@vjFL` was never written by the flow — so flag always fell through to 'none'.
   Fix: now derived from parsed AI result if `@vjFL` is absent.
5. AI prompt updated to be universal (not school-specific) and to return clean JSON (no code fences).

### DE-SCHOOL — Language universalisation ✅ COMPLETE
- VoiceJournalMonitor: "Student wellbeing pulse" → "Wellbeing pulse · Anonymous voice & text submissions"
- VoiceJournalMonitor: "Requires DSL review" → "Requires Safety Lead review"
- VoiceJournalMonitor: "Student entries will appear here" → "Anonymous submissions will appear here"
- VoiceJournalMonitor: ARIA context prompt — removed "school safeguarding AI", "DSL", "student"
- VoiceJournal (public form): "Greenfield Academy" → "Absolute Defence OS"
- VoiceJournal: "safe space" copy universalised
- VoiceJournal: success screen copy — "trusted adult" → "Safety Lead"
- VoiceJournal: submitting copy — "ARIA is analysing your wellbeing" → "ARIA is reviewing your submission"
- VoiceJournal: privacy note — "safeguarding team" → "Safety Lead"
- Layout: "Campus Map" nav label → "Zone Map" (title + nav item)

### DemoKit QR Fix — Journal poster added ✅ COMPLETE
- Added VoiceJournalPoster component (violet theme) linking to ?view=journal&loc=CODE
- Added getJournalQrUrl import to DemoKit.tsx
- Added third tab "Journal / Violet" to poster type toggle (Report | Journal | Guide)
- Download handler updated for all 3 types
- Kit Selector highlight colour, CheckCircle, download button all updated for violet
- Pitch callout updated with violet journal demo moment copy
- Cyan Report poster still links to ?view=report (incident reports)
- Violet Journal poster links to ?view=journal (voice + mood wellbeing)
- Amber Guide poster links to ?view=guide (staff situational response)

## PHASE 3: SOS Entry Gate ✅ COMPLETE
Files created/modified:
- EmergencyScreen.tsx — full red 999 screen, silent background log, tap-to-call, 101/112/55 secondary numbers
- SosEntryGate.tsx — binary I AM IN DANGER NOW / I FEEL UNSAFE entry gate
- App.tsx — ?view=guide now routes through SosEntryGate; ?view=sos goes directly to EmergencyScreen
- IncidentVault.tsx — SOS alert banner for SOS-AUTO reporter incidents at the top of the vault

## PHASE 4: Smart Routing + Acknowledgement Chain ✅ COMPLETE
Files created/modified:
- src/hooks/useAcknowledgementChain.ts — localStorage-persisted countdown hook, tier1/tier2/breach logic, auto-logs compliance events to incidents project
- src/components/AcknowledgementTimer.tsx — animated countdown ring, tier labels, escalation chain visualisation, acknowledge button
- src/components/IncidentVault.tsx — full rewrite: sorted by urgency, expandable cards, chain timer shown on expand, compliance breach banner, SOS banner retained
- src/components/Layout.tsx — sidebar badge now shows only critical/high pending count
## PHASE 5: Live Threat Heatmap ✅ COMPLETE
Files created/modified:
- src/hooks/useHeatmapData.ts — recency-weighted risk scores, cluster zones, heat points, temporal pattern detection, trend analysis
- src/components/RiskMap.tsx — full rewrite: HeatLayer (3-ring SVG gradient circles), ClusterPopupLayer, ThreatOverlayPanel (time filter + layer toggles + stat strip + pattern cards), ZoneRiskPanel (ranked zone table with risk bars + trend icons + peak time), MapLegend (context-aware)
Time windows: 1H / 24H / 7D / 30D / All
Layers: Heat toggle / Cluster toggle / Pattern Intelligence panel
Zone Risk: ranked list, animated bar, click-to-fly, trend icon, peak day/hour
## UX POLISH PASS ✅ COMPLETE
### Micro 1 — Hardcoded strings fixed
- IncidentNotification.tsx: buildContext() no longer says "Greenfield Academy" or "DSL AI assistant"
- Now uses inc.location_name / inc.locationCode dynamically, says "Safety Lead AI"

### Micro 2 — Header fully replaced
- Old: h-24 dead title card showing "Absolute Defence OS" subtitle as main h2
- New: h-20 live status header with:
  - Current view title as prominent h2 (Zone Map, Case Vault, etc)
  - Reactive status dot: rose=critical, amber=high/refreshing, emerald=clear
  - Live count pills: Critical / High / Flagged journals — clickable to jump to correct view
  - All views' pt-16/pt-24 offsets fixed to match new h-20 header → pt-20 on parent container

### Micro 3 — ARIA ambient floating chip
- Fixed bottom-right of all non-map views, z-150
- Shows unread count badge (critical incidents + flagged journals) with rose pulse
- Sub-label: "{n} needs review" vs "Intelligence ready"
- Disappears when ARIA drawer is open

### Micro 4 — ARIA nav item redesigned
- Removed from plain NavItem component
- Now a distinct cyan-branded button: bg-[#06B6D4]/10 border, ARIA label + "Defence Intelligence" sublabel
- Live green status dot, ChevronRight, tooltip in collapsed mode
- ChevronDown import replaced with ChevronRight

### Micro 5 — Ask ARIA button in Voice Journal cards
- Upgraded from plain dark button to cyan ARIA-branded chip with Zap icon
- Consistent with ambient chip and nav button aesthetic

### Micro 6 — Loading state upgraded
- Replaced border-spinner with cinematic Zap icon in spinning ring container
- "Absolute Defence OS / Initialising systems…" copy

## PHASE 5c: Map Panel Layout Fix ✅ COMPLETE
- Legend and Personnel cards were overlapping (both bottom-left/top-left clashing)
- MICRO A: MapLegend converted to collapsible pill card (starts collapsed, ChevronRight toggle)
- MICRO B: PersonnelManifest converted from floating absolute top-28 left-6 to collapsible card component (no absolute positioning, internal collapsed state)
- MICRO C: Both cards placed in unified LEFT DOCK — `absolute bottom-6 left-6 z-[400] flex flex-col gap-2 w-72` — Personnel on top of Legend, stacked column
- showManifest state removed; handleTogglePersonnel simplified
- Right side unchanged: ThreatOverlayPanel (top-right) + ZoneRiskPanel (bottom-right) — no overlap possible
- Result: 4 panels in 2 clean docks. All start collapsed. No overlaps.

## PHASE 5b: Personnel Overlay Layer ✅ COMPLETE
Files modified:
- src/components/RiskMap.tsx — Personnel types, seedPersonnel(), ROLE_CONFIG, STATUS_CONFIG, HEIGHT_LABEL, makePersonnelIcon(), PersonnelLayer, PersonnelManifest panel, ThreatOverlayPanel updated with showPersonnel toggle + badge count, MapLegend updated with personnel legend entries, main RiskMap wired with handleTogglePersonnel + handlePersonClick + flyTarget

## LAYOUT FIX — Header overlap ✅ FIXED
Root cause: Views container used `absolute inset-0 pt-20` — child components also used `absolute inset-0` which is relative to the SAME parent, ignoring pt-20. Content started at top:0 behind the header.
Fix: Changed Layout views wrapper from `absolute inset-0 pt-20 flex flex-col pointer-events-none` to `flex-1 min-h-0 relative`. The header (h-20, shrink-0) + flex-col on `main` means everything flows naturally below the header.
Also fixed all child components (IncidentVault, Registry, VoiceJournalMonitor, KnowledgeVault, DemoKit) from `absolute inset-0` to `h-full w-full`.

## MARQUEE TICKER — Alert strip ✅ ADDED
Added a `shrink-0 h-8` marquee ticker strip in Layout.tsx between the header and views container.
- Only shown when SOS alerts OR critical pending incidents exist
- Left badge: "LIVE ALERTS" pill with pulse dot
- Scrolling text: SOS alert details + critical count message (triplicated for seamless CSS loop)
- CSS keyframe: `marquee-scroll` in index.css, 40s linear infinite, -33.333% translateX
- Right fade gradient overlay for clean edge
- Removed the static compliance breach banner and SOS banner from inside IncidentVault (replaced by marquee)

## PHASE 6: Compliance Engine
## PHASE 7: ARIA Threat Intelligence Memory
## PHASE 8: Predictive Risk Scoring
## PHASE 9: Witness Mode
## PHASE 10: Responder Network
## PHASE 11: Client Command Portal

## Key IDs
- Space: imzbji1tu8w9i07u
- ARIA agent: 01KKEXZW6EKAZEE8MJGQ1G1E2W
- Projects: Incidents=KrZETG98Wr9aeP1W, Locations=kiWEfPzuy3H1oziw, RiskZones=3DLWyYtiJMBnKwtB, VoiceJournals=8c9dA1PvSrxBsLbK
- Flows: Log-Incident=01KKEXZW6D0C4FPCWFQEH4QERN, VoiceJournal=01KKF270VZDG196J15B54KCZ40
