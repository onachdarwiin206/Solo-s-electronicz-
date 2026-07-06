import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom', 'react-dom/client'],
    },
    build: {
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core MUST be alone — nothing else goes in this chunk
            // to prevent circular deps with other vendor chunks
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            // Motion/framer — depends on react, must be separate
            if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
              return 'vendor-motion';
            }
            // Supabase — large, no React deps
            if (id.includes('node_modules/@supabase') || id.includes('node_modules/postgrest')) {
              return 'vendor-supabase';
            }
            // Charts — recharts pulls d3, keep isolated
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
              return 'vendor-charts';
            }
            // Redux toolkit used by recharts — keep with charts to avoid cross-chunk React refs
            if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/react-redux') || id.includes('node_modules/use-sync-external-store')) {
              return 'vendor-charts';
            }
            // Everything else — lottie, lucide, uuid, etc.
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          }
        }
      }
    },
    server: {
      hmr: false,
    },
  };
});
