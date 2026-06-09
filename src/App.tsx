import { useState, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { BackgroundSlideshow } from './components/layout/BackgroundSlideshow';
import { BottomNav } from './components/layout/BottomNav';
import { Hero } from './components/home/Hero';
import { ProductCard } from './components/shop/ProductCard';
import { Cart } from './components/shop/Cart';
import { CategoryBar } from './components/shop/CategoryBar';
import { FlashSales } from './components/shop/FlashSales';
import { Footer } from './components/layout/Footer';
import { AndroidInstallPrompt } from './components/layout/AndroidInstallPrompt';
import { WhatsAppFloat } from './components/ui/WhatsAppFloat';
import { INITIAL_PRODUCTS, PRODUCT_CATEGORIES } from './constants';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Product, CartItem, PaymentMethod } from './types';
import { format, addDays } from 'date-fns';
import { useAuth } from './AuthContext';
import { generateDeterministicOrderId, safeGetLocalStorage, safeSetLocalStorage } from './lib/sandboxDb';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { translations, Language } from './translations';
import { ShieldCheck, ChevronRight, X, UserCog, Loader2, Home } from 'lucide-react';

// OrderTracking removed
const MarketingPortal = lazy(() => import('./components/marketing/MarketingPortal'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ProductDetail = lazy(() => import('./components/shop/ProductDetail'));
const QuickViewModal = lazy(() => import('./components/shop/QuickViewModal'));
import AdminLoginModal from './components/auth/LoginModal';
const UserProfile = lazy(() => import('./components/profile/UserProfile'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const AuthPage = lazy(() => import('./components/auth/AuthPage'));

type View = 'shop' | 'marketing' | 'terms' | 'admin' | 'product-detail' | 'reset-password' | 'auth';

const WHATSAPP_NUMBER = "256793405517";

export default function App() {
  const { user, isAdmin, isRecovering, loading: authResolving, toggleWishlist: authToggleWishlist, toggleLike: authToggleLike } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const [view, setView] = useState<View>('shop');
  const prevUserRef = useRef<any>(null);
  const prevIsAdminRef = useRef<boolean>(false);
  const modalWasOpenRef = useRef<boolean>(false);
  const [category, setCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
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

  const fetchProducts = async () => {
    if (!isSupabaseConfigured) {
      setProducts(INITIAL_PRODUCTS);
      setLoadingProducts(false);
      return;
    }
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01' || error.hint?.includes('not found')) {
          console.warn("[Supabase] 'products' table missing. Using hardware feed fallback.");
        } else {
          console.warn("[Supabase] Query warning:", error.message || error);
        }
        setProducts(INITIAL_PRODUCTS);
      } else if (data && data.length > 0) {
        setProducts(data as Product[]);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        console.warn("[Supabase] Connection Failure: Check if project URL is correct.");
      } else {
        console.warn("[Supabase] Dynamic warning (handled):", err);
      }
      setProducts(INITIAL_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    let channel: any = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase.channel('products_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchProducts())
          .subscribe();
      } catch (e) {
        console.warn("[Realtime] Subscription failed.", e);
      }
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handleOpenAdmin = () => setIsAdminModalOpen(true);
    const handleOpenAuth = () => setView('auth');
    window.addEventListener('openAdmin', handleOpenAdmin);
    window.addEventListener('openAuth', handleOpenAuth);
    return () => {
      window.removeEventListener('openAdmin', handleOpenAdmin);
      window.removeEventListener('openAuth', handleOpenAuth);
    };
  }, []);
  
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
  }, [user, isAdmin, authResolving, view]);

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
      let handled = false;

      // 1. Handle Overlays (Close them if open)
      if (cartOpen) { setCartOpen(false); handled = true; }
      if (quickViewProduct) { setQuickViewProduct(null); handled = true; }
      if (showTerms) { setShowTerms(false); handled = true; }
      if (isAdminModalOpen) { setIsAdminModalOpen(false); handled = true; }
      
      // 2. Handle Filtered Categories within Shop
      if (category && view === 'shop') {
        setCategory(null);
        handled = true;
      }

      // 3. Update View State if provided in history
      if (event.state?.view && event.state.view !== view) {
        setView(event.state.view);
        handled = true;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [cartOpen, quickViewProduct, showTerms, isAdminModalOpen, category, view]);

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

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('likes', JSON.stringify(likes));
  }, [likes]);

  const t = translations[language];

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const q = searchQuery?.toLowerCase() ?? '';
    const matchesSearch = (
      (p.name?.toLowerCase() ?? '').includes(q) || 
      (p.description?.toLowerCase() ?? '').includes(q)
    );
    return matchesCategory && matchesSearch;
  }), [products, category, searchQuery]);

  const groupedMainProducts = useMemo(() => {
    if (category || searchQuery) return null;
    return products.reduce((acc, product) => {
      const cat = product.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products, category, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(i => i.quantity > 0));
  };

  const handleCheckout = async (method: PaymentMethod, district: string, deliveryFee: number, phone: string, address: string, customerName: string) => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + deliveryFee;
    const orderId = generateDeterministicOrderId(phone, district);
    const createdAt = new Date().toISOString();
    const estDelivery = format(addDays(new Date(createdAt), 3), 'PPP');

    const orderData = {
      id: orderId,
      user_id: user?.id || null,
      customer_name: customerName,
      customer_phone: phone,
      items: cart,
      total: total,
      status: 'pending',
      delivery_address: address,
      district,
      payment_method: method,
      created_at: createdAt,
      estimated_delivery: estDelivery,
      tracking_logs: [
        { status: 'pending', message: 'Order initialized in the hardware pool.', timestamp: createdAt }
      ]
    };

    if (!isSupabaseConfigured) {
      const sandboxOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
      sandboxOrders.push(orderData);
      safeSetLocalStorage('solo_sandbox_orders', sandboxOrders);
      console.log("[Sandbox] Order recorded locally via safe database layer:", orderData);
      
      const cartSummary = cart.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
      
      const receiptTemplate = `
🧾 *SOLO ELECTRONICS - DIGITAL RECEIPT (SANDBOX)*
---------------------------------------
*Order ID:* ${orderId}
*Date:* ${new Date().toLocaleDateString()}
*Customer:* ${customerName}

*ITEMS:*
${cartSummary}

---------------------------------------
*Subtotal:* UGX ${subtotal.toLocaleString()}
*Delivery:* UGX ${deliveryFee.toLocaleString()}
*TOTAL:* UGX ${total.toLocaleString()}

*DELIVERY TO:*
${district}, ${address}
*PHONE:* ${phone}

_Thank you for choosing Solo Electronics!_
_Your order is now being processed._
`.trim();
      
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receiptTemplate)}`;
      window.open(whatsappUrl, '_blank');
      
      setCart([]);
      return orderId;
    }

    try {
      let { error } = await supabase.from('orders').insert(orderData);
      
      // Fallback for missing columns (if user hasn't run the latest migration script)
      if (error && (error.message?.includes('estimated_delivery') || error.message?.includes('tracking_logs') || error.code === 'PGRST204')) {
        console.warn("[Supabase] Extended order columns missing. Falling back to legacy schema.");
        const { 
          id, user_id, customer_name, customer_phone, items, total, 
          status, delivery_address, district, payment_method, created_at 
        } = orderData;
        const legacyData = { 
          id, user_id, customer_name, customer_phone, items, total, 
          status, delivery_address, district, payment_method, created_at 
        };
        const { error: retryError } = await supabase.from('orders').insert(legacyData);
        error = retryError;
      }

      if (error) {
        if (error.code === '42P01' || error.message?.includes('not found')) {
          console.warn("[Supabase] Orders table missing. Persistence unavailable.");
        } else {
          throw error;
        }
      }
      
      const cartSummary = cart.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
      
      const receiptTemplate = `
🧾 *SOLO ELECTRONICS - DIGITAL RECEIPT*
---------------------------------------
*Order ID:* ${orderId}
*Date:* ${new Date().toLocaleDateString()}
*Customer:* ${customerName}

*ITEMS:*
${cartSummary}

---------------------------------------
*Subtotal:* UGX ${subtotal.toLocaleString()}
*Delivery:* UGX ${deliveryFee.toLocaleString()}
*TOTAL:* UGX ${total.toLocaleString()}

*DELIVERY TO:*
${district}, ${address}
*PHONE:* ${phone}

_Thank you for choosing Solo Electronics!_
_Your order is now being processed._
      `.trim();
      
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(receiptTemplate)}`;
      window.open(whatsappUrl, '_blank');
      
      setCart([]);
      return orderId;
    } catch (e: any) {
      console.warn("[Supabase] Order warning:", e.message);
      alert("Command Failure: Your purchase signature could not be committed to the hardware pool. Please contact Solo Support.");
      return null;
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (user && user.id !== 'legacy-admin') {
      await authToggleWishlist(productId);
    } else {
      setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    }
  };

  const handleToggleLike = async (productId: string) => {
    if (user && user.id !== 'legacy-admin') {
      await authToggleLike(productId);
    } else {
      setLikes(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    }
  };

  // Helper to check if item is wishlisted/liked (handles both local and auth state)
  const isItemWishlisted = (id: string) => {
    if (user && user.id !== 'legacy-admin') return user.wishlist?.includes(id) || false;
    return wishlist.includes(id);
  };

  const isItemLiked = (id: string) => {
    if (user && user.id !== 'legacy-admin') return user.likes?.includes(id) || false;
    return likes.includes(id);
  };

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <AndroidInstallPrompt />
      <WhatsAppFloat user={user} />
      
      {authResolving ? (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin z-10" />
          <p className="mt-4 text-white font-black tracking-widest uppercase italic animate-pulse">Syncing Hardware Feed...</p>
        </div>
      ) : (
        <>
          <Navbar 
            onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }}
            onSearch={setSearchQuery}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
            wishlistCount={wishlist.length}
            onCartClick={() => setCartOpen(true)}
            onTrackingClick={() => {}}
            onMarketingClick={() => setView('marketing')}
            isAdmin={isAdmin}
            currentLanguage={language}
            onLanguageChange={setLanguage}
            onAuthClick={() => setView('auth')}
            t={t}
          />

          <BottomNav 
            activeView={view} 
            onViewChange={(v) => {
              if (v === 'cart') {
                setCartOpen(true);
              } else if (v === 'search') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.dispatchEvent(new CustomEvent('toggleSearch'));
              } else if (v === 'profile') {
                setView('auth');
              } else {
                setView(v);
                setCategory(null);
              }
            }}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          />

          <main className="pb-24 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Suspense fallback={<div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
                  {view === 'shop' && (
                    <>
                      {!category && !searchQuery && (
                        <Hero onShopNow={() => document.getElementById('tech-inventory')?.scrollIntoView({ behavior: 'smooth' })} onMarketingClick={() => setView('marketing')} t={t} />
                      )}
                      
                      <div className="z-40">
                         <CategoryBar onCategorySelect={(cat) => setCategory(cat)} selectedCategory={category} />
                      </div>

                      <section id="tech-inventory" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Deactivated for now: 
                        {!category && !searchQuery && products.length > 0 && (
                          <FlashSales 
                            products={products} 
                            onAddToCart={addToCart} 
                            onProductClick={(p) => { setSelectedProduct(p); setView('product-detail'); }} 
                            onQuickView={(p) => setQuickViewProduct(p)}
                          />
                        )}
                        */}

                        <div className="flex justify-between items-end mb-12">
                           <h2 className="text-4xl font-black tracking-tighter uppercase italic">{category || 'Hardware Feed'}</h2>
                           <div className="flex items-center gap-4">
                              {loadingProducts && <Loader2 size={16} className="animate-spin text-blue-500" />}
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredProducts.length} Results</span>
                           </div>
                        </div>

                        {filteredProducts.length === 0 && !loadingProducts ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-40 text-center bg-white/5 border border-white/10 rounded-[4rem] relative overflow-hidden backdrop-blur-xl"
                          >
                             <div className="absolute inset-0 bg-blue-600/5 animate-pulse" />
                             <div className="relative z-10 max-w-md mx-auto space-y-8 px-6">
                              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                                <ShieldCheck className="text-blue-500" size={48} />
                              </div>
                              <div className="space-y-3">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Sector Offline</h3>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                  The hardware pool is currently empty for this specific sector. Our sourcing engineers are working on replenishment.
                                </p>
                              </div>
                              <button 
                                onClick={() => { setCategory(null); setSearchQuery(''); }}
                                className="w-full py-5 bg-blue-600 text-white font-black text-sm uppercase italic rounded-3xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all hover:bg-blue-500"
                              >
                                Reboot Hardware Feed
                              </button>
                            </div>
                          </motion.div>
                        ) : groupedMainProducts && !loadingProducts ? (
                          <div className="space-y-32">
                            {Object.entries(groupedMainProducts)
                              .sort(([a], [b]) => {
                                const idxA = PRODUCT_CATEGORIES.indexOf(a as any);
                                const idxB = PRODUCT_CATEGORIES.indexOf(b as any);
                                if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                                if (idxA === -1) return 1;
                                if (idxB === -1) return -1;
                                return idxA - idxB;
                              })
                              .map(([cat, catProducts]) => (
                              <motion.section 
                                key={cat} 
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                className="space-y-12"
                              >
                                <div className="flex items-center gap-6 group">
                                  <div className="flex flex-col">
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-foreground group-hover:text-blue-500 transition-colors">{cat}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{catProducts.length} Units Active</span>
                                    </div>
                                  </div>
                                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                                  <button 
                                    onClick={() => setCategory(cat)}
                                    className="px-6 py-3 bg-foreground/5 border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-foreground hover:bg-blue-600/20 transition-all shadow-xl"
                                  >
                                    View Full Sector →
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-10">
                                  {catProducts.slice(0, 3).map(product => (
                                    <ProductCard 
                                      key={product.id} 
                                      product={product} 
                                      onAddToCart={addToCart} 
                                      onClick={() => { setSelectedProduct(product); setView('product-detail'); }}
                                      onQuickView={(p) => setQuickViewProduct(p)}
                                      isWishlisted={isItemWishlisted(product.id)}
                                      onToggleWishlist={handleToggleWishlist}
                                      isLiked={isItemLiked(product.id)}
                                      onToggleLike={handleToggleLike}
                                    />
                                  ))}
                                </div>
                              </motion.section>
                            ))}

                            {/* Recently Viewed Section */}
                            {(() => {
                              const stored = typeof window !== 'undefined' ? localStorage.getItem('recently_viewed') : null;
                              const recentlyViewedIds = stored ? JSON.parse(stored) : [];
                              const recentlyViewedProducts = products.filter(p => recentlyViewedIds.includes(p.id))
                                .sort((a, b) => recentlyViewedIds.indexOf(a.id) - recentlyViewedIds.indexOf(b.id));

                              if (recentlyViewedProducts.length === 0) return null;

                              return (
                                <motion.section 
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  viewport={{ once: true }}
                                  className="pt-20 border-t border-border space-y-12"
                                >
                                  <div className="flex items-center gap-6 group">
                                    <div className="flex flex-col">
                                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Recently Deployed</h3>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your interaction history</span>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-blue-500/10 to-transparent" />
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                    {recentlyViewedProducts.map(product => (
                                      <div 
                                        key={product.id} 
                                        onClick={() => { setSelectedProduct(product); setView('product-detail'); }}
                                        className="cursor-pointer group/rv"
                                      >
                                        <div className="aspect-square bg-foreground/5 rounded-2xl overflow-hidden border border-border group-hover/rv:border-blue-500/30 transition-all mb-3 relative">
                                           <img src={product.image} alt="" className="w-full h-full object-cover group-hover/rv:scale-110 transition-all duration-700" />
                                           <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover/rv:opacity-100 transition-opacity" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/rv:text-foreground truncate">{product.name}</h4>
                                        <p className="text-[9px] font-mono text-blue-500/80">UGX {product.price.toLocaleString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.section>
                              );
                            })()}
                            
                            {/* Category Quick Badges footer */}
                            <div className="py-20 border-t border-border">
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center mb-10">Direct Sector Access</p>
                               <div className="flex flex-wrap justify-center gap-4">
                                  {PRODUCT_CATEGORIES.map(cat => (
                                    <button
                                      key={cat}
                                      onClick={() => setCategory(cat)}
                                      className="px-8 py-4 bg-foreground/5 border border-border rounded-3xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-blue-500/50 hover:bg-foreground/10 transition-all"
                                    >
                                      {cat}
                                    </button>
                                  ))}
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-8">
                            {loadingProducts ? (
                              [...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl h-[450px] animate-pulse overflow-hidden">
                                   <div className="aspect-square bg-white/5" />
                                   <div className="p-6 space-y-4">
                                      <div className="h-6 bg-white/5 rounded-full w-3/4" />
                                      <div className="h-4 bg-white/5 rounded-full w-1/4" />
                                      <div className="h-12 bg-white/5 rounded-2xl w-full" />
                                   </div>
                                </div>
                              ))
                            ) : (
                              filteredProducts.map(product => (
                                <ProductCard 
                                  key={product.id} 
                                  product={product} 
                                  onAddToCart={addToCart} 
                                  onClick={() => { setSelectedProduct(product); setView('product-detail'); }}
                                  onQuickView={(p) => setQuickViewProduct(p)}
                                  isWishlisted={isItemWishlisted(product.id)}
                                  onToggleWishlist={handleToggleWishlist}
                                  isLiked={isItemLiked(product.id)}
                                  onToggleLike={handleToggleLike}
                                />
                              ))
                            )}
                          </div>
                        )}
                      </section>
                    </>
                  )}

                  {view === 'product-detail' && selectedProduct && (
                    <ProductDetail 
                      product={selectedProduct} 
                      onBack={() => window.history.back()} 
                      onAddToCart={addToCart}
                      isWishlisted={isItemWishlisted(selectedProduct.id)}
                      onToggleWishlist={handleToggleWishlist}
                      isLiked={isItemLiked(selectedProduct.id)}
                      onToggleLike={handleToggleLike}
                    />
                  )}

                  {view === 'marketing' && <MarketingPortal />}
                  {view === 'auth' && <AuthPage onSuccess={() => setView(user?.role === 'admin' ? 'admin' : 'shop')} />}
                  {view === 'reset-password' && <div className="max-w-md mx-auto px-4"><ResetPassword onSuccess={() => setView('shop')} /></div>}
                  {view === 'admin' && (
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard products={products} />
                    </ProtectedRoute>
                  )}
                </Suspense>
              </motion.div>
            </AnimatePresence>

            {isAdmin && view !== 'admin' && (
              <div className="fixed bottom-32 left-8 z-[90]">
                <button onClick={() => setView('admin')} className="bg-red-600 p-4 rounded-full text-white shadow-2xl flex items-center gap-3 pr-6"><UserCog size={24} /><span className="text-sm font-black uppercase tracking-widest">Admin Control</span></button>
              </div>
            )}
          </main>

          <Footer t={t} onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }} onAdminPanelClick={() => isAdmin ? setView('admin') : setIsAdminModalOpen(true)} />
          <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} items={cart} onUpdateQuantity={updateCartQuantity} onRemove={(id) => setCart(p => p.filter(i => i.id !== id))} onCheckout={handleCheckout} orderResult={null} t={t} />
          
          <AdminLoginModal 
            isOpen={isAdminModalOpen} 
            onClose={() => setIsAdminModalOpen(false)} 
            onSuccess={() => { setView('admin'); setIsAdminModalOpen(false); }}
          />
          <Suspense fallback={null}>
            <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={addToCart} />
          </Suspense>

          <AnimatePresence>
            {showTerms && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
                 <div className="bg-gray-900 border border-white/10 p-8 rounded-[3rem] max-w-2xl w-full relative">
                    <button onClick={() => setShowTerms(false)} className="absolute top-8 right-8"><X size={24} /></button>
                    <h2 className="text-3xl font-black mb-8 italic uppercase">Warranty & Service</h2>
                    <div className="space-y-6 text-gray-400 text-sm"><p>All hardware comes with a 12-month Solo Assurance guarantee. We facilitate repairs and replacements directly with brand importers in Lira/Kampala.</p></div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
