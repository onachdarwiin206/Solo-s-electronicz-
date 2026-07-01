import { useContext } from 'react';
import { AppStateContext, AppDispatchContext } from '../store/appContext';

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppContextProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppContextProvider');
  }
  return context;
}
