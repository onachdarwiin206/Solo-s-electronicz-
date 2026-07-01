import { useState, useEffect } from 'react';
import { Product, CartItem, PaymentMethod } from '../types';
import { safeGetLocalStorage, safeSetLocalStorage, SANDBOX_SYNC_EVENT } from '../lib/sandboxDb';
import { executeCheckout } from '../services/checkoutService';

/**
 * Custom hook to manage the shopping cart state and checkout flow.
 * Centralizes all operations, implements cross-tab atomic synchronization,
 * prevents double-add race conditions, and persists state safely.
 */
export function useCart(user: any) {
  // 1. Single source of truth loaded from persistent sandbox cache
  const [cart, setCart] = useState<CartItem[]>(() => safeGetLocalStorage<CartItem[]>('solo_cart_items', []));
  const [cartOpen, setCartOpen] = useState(false);

  // 2. Cross-tab & Multi-window Synchronization
  useEffect(() => {
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.key === 'solo_cart_items') {
        const newValue = customEvent.detail.value;
        if (JSON.stringify(newValue) !== JSON.stringify(cart)) {
          setCart(newValue || []);
        }
      }
    };
    
    window.addEventListener(SANDBOX_SYNC_EVENT, handleSyncEvent);
    return () => {
      window.removeEventListener(SANDBOX_SYNC_EVENT, handleSyncEvent);
    };
  }, [cart]);

  // 3. Centralized Atomic Operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        updated = [...prev, { ...product, quantity: 1 }];
      }
      safeSetLocalStorage('solo_cart_items', updated);
      return updated;
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0);
      safeSetLocalStorage('solo_cart_items', updated);
      return updated;
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.id !== id);
      safeSetLocalStorage('solo_cart_items', updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    safeSetLocalStorage('solo_cart_items', []);
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
  ): Promise<string | undefined> => {
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
      return response.orderId;
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
