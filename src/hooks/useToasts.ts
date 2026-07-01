import { useState } from 'react';
import { ToastData } from '../components/ui/Toast';

/**
 * Custom hook to manage toast notifications across the application.
 * Handles adding, removing, and timing of toast alerts.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toasts,
    addToast,
    removeToast,
  };
}
