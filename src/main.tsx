import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { supabase } from './lib/supabase';
import { initializeSandboxSchema } from './lib/sandboxDb';
import './index.css';

// Suppress benign Vite HMR and WebSocket proxy errors that happen due to sandboxed environment routing
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event?.reason || '');
    const reasonMsg = event?.reason?.message || '';
    if (
      reasonMsg.includes('WebSocket') ||
      reasonMsg.includes('websocket') ||
      reasonMsg.includes('closed without opened') ||
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

// Boot the self-healing layout storage schema
initializeSandboxSchema();

// Register Service Worker for mobile and Android PWA installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
