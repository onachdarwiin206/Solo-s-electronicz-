import { useEffect, useMemo } from 'react';
import { Product } from '../types';
import { secureSetItem } from '../services/syncService';
import { useAppState, useAppDispatch } from '../context/AppStateContext';

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
  const state = useAppState();
  const dispatch = useAppDispatch();

  const wishlist = state.wishlist;
  const likes = state.likes;

  const setWishlist = (newWishlist: string[] | ((prev: string[]) => string[])) => {
    const nextVal = typeof newWishlist === 'function' ? newWishlist(wishlist) : newWishlist;
    dispatch({ type: 'SET_WISHLIST', payload: nextVal });
  };

  const setLikes = (newLikes: string[] | ((prev: string[]) => string[])) => {
    const nextVal = typeof newLikes === 'function' ? newLikes(likes) : newLikes;
    dispatch({ type: 'SET_LIKES', payload: nextVal });
  };

  useEffect(() => {
    secureSetItem('wishlist', wishlist);
  }, [wishlist]);

  useEffect(() => {
    secureSetItem('likes', likes);
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
