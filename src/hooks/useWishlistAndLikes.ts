import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';

/**
 * Custom hook to manage wishlist and liked products.
 * Seamlessly coordinates local browser storage fallback with remote authenticated account states.
 */
export function useWishlistAndLikes(
  user: any,
  products: Product[],
  authToggleWishlist: (id: string) => Promise<any>,
  authToggleLike: (id: string) => Promise<any>,
  addToast: (toast: any) => void,
  setWishlistOpen: (open: boolean) => void
) {
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch {
      return [];
    }
  });

  const [likes, setLikes] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('likes') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('[Storage] Wishlist write blocked:', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('likes', JSON.stringify(likes));
    } catch (e) {
      console.warn('[Storage] Likes write blocked:', e);
    }
  }, [likes]);

  const wishlistProducts = useMemo(() => {
    const ids = user && user.id !== 'legacy-admin' ? (user.wishlist || []) : wishlist;
    return products.filter(p => ids.includes(p.id));
  }, [user, wishlist, products]);

  const isItemWishlisted = (id: string) => {
    if (user && user.id !== 'legacy-admin') return user.wishlist?.includes(id) || false;
    return wishlist.includes(id);
  };

  const isItemLiked = (id: string) => {
    if (user && user.id !== 'legacy-admin') return user.likes?.includes(id) || false;
    return likes.includes(id);
  };

  const handleToggleWishlist = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    const isAdding = !isItemWishlisted(productId);

    if (user && user.id !== 'legacy-admin') {
      await authToggleWishlist(productId);
    } else {
      setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    }

    if (isAdding && product) {
      addToast({
        productId: product.id,
        productName: product.name,
        productImage: (product.images && product.images.length > 0) ? product.images[0] : product.image,
        message: "Added to your saved hardware items.",
        actionText: "Open Wishlist",
        onAction: () => setWishlistOpen(true)
      });
    }
  };

  const handleToggleLike = async (productId: string) => {
    if (user && user.id !== 'legacy-admin') {
      await authToggleLike(productId);
    } else {
      setLikes(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    }
  };

  return {
    wishlist,
    likes,
    wishlistProducts,
    isItemWishlisted,
    isItemLiked,
    handleToggleWishlist,
    handleToggleLike,
  };
}
