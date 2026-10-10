import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { App } from './App';
import { resolveAppLocale, setAppLocale } from '../i18n';
import type { AppLocale } from '../types';

// UI 부팅 시점에 로케일 확정 (이후 모든 showToast 문구에 적용)
function resolveBootLocale(): AppLocale {
  try {
    const stored = localStorage.getItem('flooow_locale');
    if (stored) return stored as AppLocale;
  } catch (_) {}
  return resolveAppLocale(typeof navigator !== 'undefined' ? navigator.language : undefined);
}
setAppLocale(resolveBootLocale());

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

const root = createRoot(container);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);
