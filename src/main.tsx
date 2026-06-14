import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import './styles.css';
// PWA register (virtual module from vite-plugin-pwa)
import('virtual:pwa-register' as any)
  .then(({ registerSW }) => registerSW({ immediate: true }))
  .catch(() => {});

import { ThemeProvider } from './contexts/ThemeContext';

window.addEventListener('beforeunload', (e) => {
  const msg = "تقدروا تنزلوا الموقع كتطبيق للاستمتاع به بدون نت وتلقي الاشعارات دائما لمساعدتكم في حياتكم";
  e.preventDefault();
  e.returnValue = msg;
  return msg;
});

const router = getRouter();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);
