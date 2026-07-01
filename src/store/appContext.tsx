import React, { createContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { AppState, AppAction, appReducer, initialState } from './appReducer';
import { safeGetLocalStorage, safeSetLocalStorage } from '../lib/sandboxDb';
import { secureGetItem, secureSetItem } from '../services/syncService';

export const AppStateContext = createContext<AppState | undefined>(undefined);
export const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isMounted = useRef(false);

  // 1. On Mount: Restore state from localStorage safely
  useEffect(() => {
    try {
      const restoredCart = safeGetLocalStorage('solo_cart_items', initialState.cart);
      const restoredWishlist = secureGetItem('wishlist', initialState.wishlist);
      const restoredLikes = secureGetItem('likes', initialState.likes);
      const restoredLanguage = localStorage.getItem('language') as any || initialState.language;
      const restoredView = localStorage.getItem('view') as any || initialState.view;

      dispatch({
        type: 'RESTORE_STATE',
        payload: {
          cart: restoredCart,
          wishlist: restoredWishlist,
          likes: restoredLikes,
          language: restoredLanguage,
          view: restoredView,
        }
      });
    } catch (err) {
      console.error('[AppContextProvider] Failed to restore state gracefully:', err);
    }
    isMounted.current = true;
  }, []);

  // 2. Persist state to localStorage after every relevant state change
  useEffect(() => {
    if (!isMounted.current) return;

    try {
      safeSetLocalStorage('solo_cart_items', state.cart);
    } catch (err) {
      console.error('[AppContextProvider] Failed to persist cart state:', err);
    }
  }, [state.cart]);

  useEffect(() => {
    if (!isMounted.current) return;

    try {
      secureSetItem('wishlist', state.wishlist);
    } catch (err) {
      console.error('[AppContextProvider] Failed to persist wishlist state:', err);
    }
  }, [state.wishlist]);

  useEffect(() => {
    if (!isMounted.current) return;

    try {
      secureSetItem('likes', state.likes);
    } catch (err) {
      console.error('[AppContextProvider] Failed to persist likes state:', err);
    }
  }, [state.likes]);

  useEffect(() => {
    if (!isMounted.current) return;

    try {
      localStorage.setItem('language', state.language);
    } catch (err) {
      console.error('[AppContextProvider] Failed to persist language state:', err);
    }
  }, [state.language]);

  useEffect(() => {
    if (!isMounted.current) return;

    try {
      localStorage.setItem('view', state.view);
    } catch (err) {
      console.error('[AppContextProvider] Failed to persist view state:', err);
    }
  }, [state.view]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
