import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import './styles.css';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

import { ThemeProvider } from './contexts/ThemeContext';

const router = getRouter();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);
