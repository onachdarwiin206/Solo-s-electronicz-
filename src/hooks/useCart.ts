import { useEffect } from 'react';
import { Product, CartItem, PaymentMethod } from '../types';
import { safeSetLocalStorage, SANDBOX_SYNC_EVENT } from '../lib/sandboxDb';
import { executeCheckout } from '../services/checkoutService';
import { useAppState, useAppDispatch } from '../context/AppStateContext';

/**
 * Custom hook to manage the shopping cart state and checkout flow.
 * Centralizes all operations, implements cross-tab atomic synchronization,
 * prevents double-add race conditions, and persists state safely.
 */
export function useCart(user: any) {
  const state = useAppState();
  const dispatch = useAppDispatch();

  const cart = state.cart;
  const cartOpen = state.cartOpen;

  const setCartOpen = (open: boolean) => {
    dispatch({ type: 'SET_CART_OPEN', payload: open });
  };

  // 2. Cross-tab & Multi-window Synchronization
  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.key === 'solo_cart_items') {
        const newValue = customEvent.detail.value;
        if (JSON.stringify(newValue) !== JSON.stringify(cart)) {
          dispatch({ type: 'SET_CART', payload: newValue || [] });
        }
      }
    };
    
    window.addEventListener(SANDBOX_SYNC_EVENT, handleSyncEvent);
    return () => {
      window.removeEventListener(SANDBOX_SYNC_EVENT, handleSyncEvent);
    };
  }, [cart, dispatch]);

  // 3. Centralized Atomic Operations
  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    dispatch({ type: 'UPDATE_CART_QTY', payload: { id, delta } });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const setCart = (newCart: CartItem[]) => {
    dispatch({ type: 'SET_CART', payload: newCart });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // 4. Delegated Checkout Flow with Secure Sourcing & Validation
  const handleCheckout = async (
    method: PaymentMethod,
    district: string,
    deliveryFee: number,
    phone: string,
    address: string,
    customerName: string,
    masterProducts: Product[]
  ): Promise<any> => {
    const response = await executeCheckout({
      cart,
      user,
      method,
      district,
      deliveryFee,
      phone,
      address,
      customerName,
      masterProducts
    });

    if (response.success && response.orderId) {
      clearCart();
      return response;
    } else {
      throw new Error(response.error || "Order creation failure.");
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    setCart,
    cartOpen,
    setCartOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    handleCheckout,
    cartCount,
  };
}
