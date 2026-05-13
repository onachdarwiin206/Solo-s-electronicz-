import { useState, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { BackgroundSlideshow } from './components/layout/BackgroundSlideshow';
import { BottomNav } from './components/layout/BottomNav';
import { Hero } from './components/home/Hero';
import { ProductCard } from './components/shop/ProductCard';
import { Cart } from './components/shop/Cart';
import { Footer } from './components/layout/Footer';
import { INITIAL_PRODUCTS } from './constants';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Product, CartItem, PaymentMethod } from './types';
import { useAuth } from './AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { translations, Language } from './translations';
import { ShieldCheck, ChevronRight, X, UserCog, Loader2 } from 'lucide-react';

const OrderTracking = lazy(() => import('./components/tracking/OrderTracking'));
const MarketingPortal = lazy(() => import('./components/marketing/MarketingPortal'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ProductDetail = lazy(() => import('./components/shop/ProductDetail'));
const QuickViewModal = lazy(() => import('./components/shop/QuickViewModal'));
const AdminLoginModal = lazy(() => import('./components/auth/LoginModal'));
const UserAuthModal = lazy(() => import('./components/auth/UserAuthModal'));
const UserProfile = lazy(() => import('./components/profile/UserProfile'));

type View = 'shop' | 'tracking' | 'marketing' | 'terms' | 'admin' | 'profile' | 'product-detail';

const WHATSAPP_NUMBER = "256793405517";

export default function App() {
  const { user, isAdmin, loading: authResolving } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [view, setView] = useState<View>('shop');
  const prevUserRef = useRef<any>(null);
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
          console.error("[Supabase] Query error:", error.message || error);
        }
        setProducts(INITIAL_PRODUCTS);
      } else if (data && data.length > 0) {
        setProducts(data as Product[]);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        console.error("[Supabase] Connection Failure: Check if project URL is correct.");
      } else {
        console.error("[Supabase] Dynamic error:", err);
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
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('openAdmin', handleOpenAdmin);
    window.addEventListener('openLogin', handleOpenAdmin);
    window.addEventListener('openAuth', handleOpenAuth);
    return () => {
      window.removeEventListener('openAdmin', handleOpenAdmin);
      window.removeEventListener('openLogin', handleOpenAdmin);
      window.removeEventListener('openAuth', handleOpenAuth);
    };
  }, []);

  useEffect(() => {
    if (authResolving) return;

    const justLoggedIn = !prevUserRef.current && user;
    prevUserRef.current = user;

    if (justLoggedIn) {
      if (isAdmin) {
        setView('admin');
      } else {
        setView('tracking');
      }
      setIsAuthModalOpen(false);
      setIsAdminModalOpen(false);
    }

    if (view === 'admin' && !isAdmin) {
      setView('shop');
    }
    
    if ((view === 'tracking' || view === 'profile') && !user) {
      setIsAuthModalOpen(true);
    }
  }, [user, isAdmin, authResolving, view]);

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
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [products, category, searchQuery]);

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
    const orderId = `SOLO-ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

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
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('orders').insert(orderData);
      if (error) {
        if (error.code === '42P01' || error.message?.includes('not found')) {
          console.warn("[Supabase] Orders table mission. Persistence unavailable.");
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
      console.error("[Supabase] Order error:", e.message);
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const toggleLike = (productId: string) => {
    setLikes(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      
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
            onTrackingClick={() => setView('tracking')}
            onMarketingClick={() => setView('marketing')}
            isAdmin={isAdmin}
            currentLanguage={language}
            onLanguageChange={setLanguage}
            onAuthClick={() => setIsAuthModalOpen(true)}
            t={t}
          />

          <BottomNav 
            activeView={view} 
            onViewChange={(v) => { setView(v); setCategory(null); }}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          />

          <main className="pb-24 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Suspense fallback={<div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
                  {view === 'shop' && (
                    <>
                      {!category && (
                        <Hero onShopNow={() => document.getElementById('tech-inventory')?.scrollIntoView({ behavior: 'smooth' })} onMarketingClick={() => setView('marketing')} t={t} />
                      )}
                      <section id="tech-inventory" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-end mb-12">
                           <h2 className="text-4xl font-black tracking-tighter uppercase italic">{category || 'Hardware Feed'}</h2>
                           <div className="flex items-center gap-4">
                              {loadingProducts && <Loader2 size={16} className="animate-spin text-blue-500" />}
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredProducts.length} Results</span>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                isWishlisted={wishlist.includes(product.id)}
                                onToggleWishlist={toggleWishlist}
                                isLiked={likes.includes(product.id)}
                                onToggleLike={toggleLike}
                              />
                            ))
                          )}
                        </div>
                      </section>
                    </>
                  )}

                  {view === 'product-detail' && selectedProduct && (
                    <ProductDetail product={selectedProduct} onBack={() => setView('shop')} onAddToCart={addToCart} />
                  )}

                  {view === 'tracking' && (
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  )}
                  {view === 'profile' && (
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  )}
                  {view === 'marketing' && <MarketingPortal />}
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

            <div className="bg-white/5 backdrop-blur-md border-y border-white/10 py-12">
               <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6"><ShieldCheck size={48} className="text-blue-500" /><div><h3 className="text-xl font-bold uppercase italic">Quality Assured</h3><p className="text-gray-500 text-sm">Every asset is verified by our engineering desk.</p></div></div>
                  <button onClick={() => setShowTerms(true)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all flex items-center gap-2 text-sm font-bold">Terms & Security <ChevronRight size={16} /></button>
               </div>
            </div>
          </main>

          <Footer t={t} onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }} onAdminPanelClick={() => isAdmin ? setView('admin') : setIsAdminModalOpen(true)} />
          <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} items={cart} onUpdateQuantity={updateCartQuantity} onRemove={(id) => setCart(p => p.filter(i => i.id !== id))} onCheckout={handleCheckout} orderResult={null} t={t} />
          
          <Suspense fallback={null}>
            <AdminLoginModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
            <UserAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
