import { useState, useEffect } from 'react';

export type View = 'shop' | 'marketing' | 'terms' | 'admin' | 'product-detail' | 'reset-password' | 'auth';

interface NavigationParams {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  quickViewProduct: any;
  setQuickViewProduct: (product: any) => void;
  showTerms: boolean;
  setShowTerms: (show: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  category: string | null;
  setCategory: (cat: string | null) => void;
  user: any;
  isAdmin: boolean;
  authResolving: boolean;
  isRecovering: boolean;
}

/**
 * Custom hook to orchestrate application routing, popstate navigation overlays,
 * history synchronization, and security-based redirections.
 */
export function useAppNavigation({
  cartOpen,
  setCartOpen,
  quickViewProduct,
  setQuickViewProduct,
  showTerms,
  setShowTerms,
  isAdminModalOpen,
  setIsAdminModalOpen,
  category,
  setCategory,
  user,
  isAdmin,
  authResolving,
  isRecovering
}: NavigationParams) {
  const [view, setView] = useState<View>('shop');
  const prevUserRef = typeof window !== 'undefined' ? { current: null as any } : { current: null };
  const prevIsAdminRef = typeof window !== 'undefined' ? { current: false } : { current: false };

  // Auth Redirection & Protection Logic
  useEffect(() => {
    if (authResolving) return;

    const loggedInTransition = !prevUserRef.current && !!user;
    const adminTransition = !prevIsAdminRef.current && isAdmin;
    const isRedirectPending = sessionStorage.getItem('auth_redirect_pending') === 'true';
    
    // 1. Redirection Logic (Triggered on login)
    if (loggedInTransition || adminTransition || isRedirectPending) {
      if (isAdmin && (isRedirectPending || view === 'shop' || view === 'marketing')) {
        console.info("[Auth] Role: Admin. Navigating to Command Center.");
        setView('admin');
        setIsAdminModalOpen(false);
        sessionStorage.removeItem('auth_redirect_pending');
      } else if (user && (isRedirectPending || view === 'shop' || view === 'marketing' || view === 'product-detail')) {
        console.info("[Auth] Role: Customer. Redirect to Shop.");
        setView('shop');
        setIsAdminModalOpen(false);
        sessionStorage.removeItem('auth_redirect_pending');
      }
    }

    // 2. Protection Logic (Triggered on view changes or logged-out state)
    // Only auto-open modal if user explicitly navigated to a protected zone
    if (view === 'admin' && !isAdmin && !authResolving) {
      setView('shop');
      setIsAdminModalOpen(true);
    }

    prevUserRef.current = user;
    prevIsAdminRef.current = isAdmin;
  }, [user, isAdmin, authResolving, view, setIsAdminModalOpen]);

  useEffect(() => {
    if (isRecovering && view !== 'reset-password') {
      setView('reset-password');
    }
  }, [isRecovering, view]);

  // Browser Navigation & History API Management
  useEffect(() => {
    // Initialize history state on first load if not present
    if (!window.history.state) {
      window.history.replaceState({ view: 'shop' }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. Handle Overlays (Close them if open)
      if (cartOpen) { setCartOpen(false); }
      if (quickViewProduct) { setQuickViewProduct(null); }
      if (showTerms) { setShowTerms(false); }
      if (isAdminModalOpen) { setIsAdminModalOpen(false); }
      
      // 2. Handle Filtered Categories within Shop
      if (category && view === 'shop') {
        setCategory(null);
      }

      // 3. Update View State if provided in history
      if (event.state?.view && event.state.view !== view) {
        setView(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [cartOpen, quickViewProduct, showTerms, isAdminModalOpen, category, view, setCartOpen, setQuickViewProduct, setShowTerms, setIsAdminModalOpen, setCategory]);

  // Sync View state forward to History
  useEffect(() => {
    const currentState = window.history.state;
    if (currentState && currentState.view !== view && !currentState.overlay) {
      window.history.pushState({ view }, '', '');
    }
  }, [view]);

  // Push "Overlay" state to History when modals open to allow "Back" to close them
  useEffect(() => {
    const isAnyOverlayOpen = cartOpen || !!quickViewProduct || showTerms || isAdminModalOpen || (!!category && view === 'shop');
    const currentState = window.history.state;
    
    if (isAnyOverlayOpen && !currentState?.overlay) {
      window.history.pushState({ view, overlay: true }, '', '');
    }
  }, [cartOpen, quickViewProduct, showTerms, isAdminModalOpen, category, view]);

  useEffect(() => {
    const handleNav = (e: any) => { if (e.detail) setView(e.detail); };
    window.addEventListener('changeView', handleNav);
    return () => window.removeEventListener('changeView', handleNav);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, category]);

  return {
    view,
    setView
  };
}
