import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { supabase } from './lib/supabase';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
