import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { AppProvider } from './lib/app-context.tsx';

import './lib/leaflet-setup';

// ── Typefaces (PRD Spec) ─────────────────────────────────────────────────────
// Primary: Sora (300–700) — clean, modern, tactical
// Evidence/Data: JetBrains Mono — timestamps, GPS, case IDs, zone codes
const fontLink = document.createElement('link');
fontLink.href = [
  'https://fonts.googleapis.com/css2?',
  'family=Sora:wght@300;400;500;600;700;800&',
  'family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&',
  'family=JetBrains+Mono:wght@400;500;700&',
  'display=swap',
].join('');
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
