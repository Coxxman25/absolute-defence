# SafeGuard Genesis App — Progress

## Current State
- School safeguarding platform with: anonymous QR reporting, campus map, case vault, ARIA AI agent, knowledge vault, demo kit
- Projects: Locations-Registry, Enhanced-Incidents, Risk-Zones
- Automations: Log-Incident-Webhook, SLA-Escalation, Spatial-Cluster-Detection
- Agent: ARIA (safeguarding AI assistant)

## Current Task: Voice Journal Feature
User wants:
1. Audio input on the public report form (remove typing friction)
2. Student Wellbeing Pulse tied to voice — students record how they feel
3. Voice journals tracked on back-end system by DSL
4. This serves dual purpose: wellbeing monitoring + concern capture

### Plan
1. Create a Voice Journals project (stores transcriptions, mood, timestamps, flags)
2. Create a webhook automation to receive voice journal submissions
3. Add AI analysis automation (transcribe sentiment, flag concerns)
4. Build the public Voice Journal page (record, mood select, submit)
5. Build the DSL-facing Voice Journal monitor in the main app
6. Connect to ARIA agent knowledge

### Status: IN PROGRESS
- [x] Voice Journals project created: 8c9dA1PvSrxBsLbK
- [x] Voice Journal Intake webhook workflow created: 01KKF270VZDG196J15B54KCZ40
- [x] AI sentiment analysis action configured
- [x] Task create action with all custom fields mapped
- [x] ARIA connected to Voice Journals project
- [x] Build public Voice Journal page (VoiceJournal.tsx)
- [x] Build DSL-facing Voice Journal Monitor (VoiceJournalMonitor.tsx)
- [x] Add to Layout navigation (AudioLines icon, journals view)
- [x] Update api.ts with voice journal endpoints
- [x] Update App.tsx for ?view=journal route
- [x] Add audio recording to PublicReportForm (voice toggle)
- [x] Add Voice Journal QR link to DemoQR
- [x] Created useAudioRecorder hook
