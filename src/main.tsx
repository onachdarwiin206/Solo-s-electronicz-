import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { AppStateProvider } from './context/AppStateContext';
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

// Register Service Worker for mobile and Android PWA installation with update tracking & seamless reload
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);

        // Detect updates to the service worker
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[PWA] New version discovered! Preparing seamless update...');
                  // Dispatch update available event for active UI notification
                  window.dispatchEvent(new CustomEvent('pwaUpdateAvailable'));
                } else {
                  console.log('[PWA] App shell pre-cached successfully. Ready for offline use!');
                  window.dispatchEvent(new CustomEvent('pwaCached'));
                }
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });

    // Handle seamless reload when the active service worker controller changes
    let isRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!isRefreshing) {
        isRefreshing = true;
        console.log('[PWA] Controller changed. Triggering hot refresh for seamless reload.');
        // Show seamless reload transition and refresh
        window.dispatchEvent(new CustomEvent('pwaRefreshing'));
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Small visual grace period for seamless UX
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStateProvider>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </AppStateProvider>
  </StrictMode>,
);
