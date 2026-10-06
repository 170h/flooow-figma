import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { App } from './App';
import { resolveAppLocale, setAppLocale } from '../i18n';

// UI 부팅 시점에 로케일 확정 (이후 모든 showToast 문구에 적용)
setAppLocale(resolveAppLocale(typeof navigator !== 'undefined' ? navigator.language : undefined));

const container = document.getElementById('root');
if (!container) throw new Error('#root not found');

const root = createRoot(container);
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);
