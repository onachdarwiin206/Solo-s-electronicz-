import { Product, CartItem, UserProfile } from '../types/index';

export type View = 'shop' | 'product-detail' | 'admin' | 'marketing' | 'auth' | 'reset-password' | 'terms';
export type Language = 'en' | 'lg' | 'sw' | 'lgo' | 'it' | 'es' | 'de' | 'nyn';

export interface AppState {
  view: View;
  category: string | null;
  searchQuery: string;
  cart: CartItem[];
  selectedProduct: Product | null;
  quickViewProduct: Product | null;
  wishlist: string[];
  likes: string[];
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isAdminModalOpen: boolean;
  showTerms: boolean;
  language: Language;
  loadingProducts: boolean;
  isRecovering: boolean;

  // Additional fields to maintain full compatibility with existing hooks/components
  products: Product[];
  user: UserProfile | null;
  isAdmin: boolean;
  authResolving: boolean;
  
  // Aliases for compatibility
  cartOpen: boolean;
  wishlistOpen: boolean;
}

export type AppAction =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_CATEGORY'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; delta: number } }
  | { type: 'UPDATE_CART_QTY'; payload: { id: string; delta: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART_OPEN' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_SELECTED_PRODUCT'; payload: Product | null }
  | { type: 'SET_QUICK_VIEW_PRODUCT'; payload: Product | null }
  | { type: 'TOGGLE_WISHLIST_OPEN' }
  | { type: 'SET_WISHLIST_OPEN'; payload: boolean }
  | { type: 'SET_ADMIN_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_SHOW_TERMS'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_LOADING_PRODUCTS'; payload: boolean }
  | { type: 'SET_IS_RECOVERING'; payload: boolean }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_WISHLIST'; payload: string[] }
  | { type: 'SET_LIKES'; payload: string[] }
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_IS_ADMIN'; payload: boolean }
  | { type: 'SET_AUTH_RESOLVING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { user: UserProfile | null; isAdmin: boolean; isRecovering: boolean; authResolving: boolean } }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> };

export const initialState: AppState = {
  view: 'shop',
  category: null,
  searchQuery: '',
  cart: [],
  selectedProduct: null,
  quickViewProduct: null,
  wishlist: [],
  likes: [],
  isCartOpen: false,
  isWishlistOpen: false,
  isAdminModalOpen: false,
  showTerms: false,
  language: 'en',
  loadingProducts: true,
  isRecovering: false,
  products: [],
  user: null,
  isAdmin: false,
  authResolving: true,
  cartOpen: false,
  wishlistOpen: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  console.log(`[AppState Reducer] Action: ${action.type}`, action);

  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload };

    case 'SET_CATEGORY':
      return { ...state, category: action.payload };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'ADD_TO_CART': {
      const product = action.payload;
      if (!product || !product.id || typeof product.price !== 'number' || product.price < 0) {
        console.warn('[appReducer] ADD_TO_CART ignored: Invalid product data', product);
        return state;
      }
      const existing = state.cart.find(item => item.id === product.id);
      let updatedCart: CartItem[];
      if (existing) {
        updatedCart = state.cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedCart = [...state.cart, { ...product, quantity: 1 }];
      }
      return { ...state, cart: updatedCart };
    }

    case 'UPDATE_CART_QUANTITY':
    case 'UPDATE_CART_QTY': {
      const { id, delta } = action.payload;
      if (!id) return state;
      const updatedCart = state.cart
        .map(item =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0);
      return { ...state, cart: updatedCart };
    }

    case 'REMOVE_FROM_CART': {
      const id = action.payload;
      if (!id) return state;
      const updatedCart = state.cart.filter(item => item.id !== id);
      return { ...state, cart: updatedCart };
    }

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'TOGGLE_CART_OPEN': {
      const nextVal = !state.isCartOpen;
      return { ...state, isCartOpen: nextVal, cartOpen: nextVal };
    }

    case 'SET_CART_OPEN':
      return { ...state, isCartOpen: action.payload, cartOpen: action.payload };

    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProduct: action.payload };

    case 'SET_QUICK_VIEW_PRODUCT':
      return { ...state, quickViewProduct: action.payload };

    case 'TOGGLE_WISHLIST_OPEN': {
      const nextVal = !state.isWishlistOpen;
      return { ...state, isWishlistOpen: nextVal, wishlistOpen: nextVal };
    }

    case 'SET_WISHLIST_OPEN':
      return { ...state, isWishlistOpen: action.payload, wishlistOpen: action.payload };

    case 'SET_ADMIN_MODAL_OPEN':
      return { ...state, isAdminModalOpen: action.payload };

    case 'SET_SHOW_TERMS':
      return { ...state, showTerms: action.payload };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_LOADING_PRODUCTS':
      return { ...state, loadingProducts: action.payload };

    case 'SET_IS_RECOVERING':
      return { ...state, isRecovering: action.payload };

    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };

    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };

    case 'SET_LIKES':
      return { ...state, likes: action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_IS_ADMIN':
      return { ...state, isAdmin: action.payload };

    case 'SET_AUTH_RESOLVING':
      return { ...state, authResolving: action.payload };

    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        isAdmin: action.payload.isAdmin,
        isRecovering: action.payload.isRecovering,
        authResolving: action.payload.authResolving,
      };

    case 'UPDATE_USER_PROFILE': {
      if (!state.user) return state;
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    }

    case 'SET_CART':
      return { ...state, cart: action.payload };

    case 'RESTORE_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}
