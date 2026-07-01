import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { BackgroundSlideshow } from './components/layout/BackgroundSlideshow';
import { BottomNav } from './components/layout/BottomNav';
import { Cart } from './components/shop/Cart';
import { CategoryBar } from './components/shop/CategoryBar';
import { HomeHero } from './components/home/HomeHero';
import { Footer } from './components/layout/Footer';
import { AndroidInstallPrompt } from './components/layout/AndroidInstallPrompt';
import { WhatsAppFloat } from './components/ui/WhatsAppFloat';
import { isSupabaseConfigured } from './lib/supabase';
import { Product } from './types';
import { useAuth } from './AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { translations, Language } from './translations';
import { X, UserCog, Loader2, AlertCircle } from 'lucide-react';

const MarketingPortal = lazy(() => import('./components/marketing/MarketingPortal'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const ProductDetail = lazy(() => import('./components/shop/ProductDetail'));
const QuickViewModal = lazy(() => import('./components/shop/QuickViewModal'));
import AdminLoginModal from './components/auth/LoginModal';
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
import { ToastContainer } from './components/ui/Toast';
import { WishlistDrawer } from './components/shop/WishlistDrawer';

// Custom Refactored Hooks
import { useToasts } from './hooks/useToasts';
import { useCart } from './hooks/useCart';
import { useProducts } from './hooks/useProducts';
import { useWishlistAndLikes } from './hooks/useWishlistAndLikes';
import { useAppNavigation } from './hooks/useAppNavigation';

/**
 * App Component - Refactored Main Orchestrator.
 * Handles routing, layout composition, and coordinates clean custom state hooks.
 */
export default function App() {
  const { 
    user, 
    isAdmin, 
    isRecovering, 
    loading: authResolving, 
    toggleWishlist: authToggleWishlist, 
    toggleLike: authToggleLike 
  } = useAuth();

  // Basic layout/UI states kept local to avoid excessive prop drilling
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Hook-managed state & operations
  const { toasts, addToast, removeToast } = useToasts();
  const { 
    cart, 
    cartOpen, 
    setCartOpen, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    handleCheckout, 
    cartCount 
  } = useCart(user);

  const { products, loadingProducts, fetchProducts } = useProducts();

  const { 
    wishlistProducts, 
    isItemWishlisted, 
    isItemLiked, 
    handleToggleWishlist, 
    handleToggleLike 
  } = useWishlistAndLikes(
    user,
    products,
    authToggleWishlist,
    authToggleLike,
    addToast,
    setWishlistOpen
  );

  const { view, setView } = useAppNavigation({
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
  });

  const t = translations[language];

  // Dynamic products filtering & grouping memoization
  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const q = searchQuery?.toLowerCase() ?? '';
    return (
      matchesCategory && (
        (p.name?.toLowerCase() ?? '').includes(q) || 
        (p.description?.toLowerCase() ?? '').includes(q)
      )
    );
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

  // Subscribe to external admin open triggers (e.g. from footer triggers)
  useEffect(() => {
    const handleOpenAdmin = () => setIsAdminModalOpen(true);
    window.addEventListener('openAdmin', handleOpenAdmin);
    return () => {
      window.removeEventListener('openAdmin', handleOpenAdmin);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <AndroidInstallPrompt />
      <WhatsAppFloat user={user} />
      
      {authResolving ? (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin z-10" />
          <p className="mt-4 text-white font-black tracking-widest uppercase italic animate-pulse">Syncing Hardware Feed...</p>
        </div>
      ) : (
        <>
          <Navbar 
            onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }}
            onSearch={setSearchQuery}
            cartCount={cartCount}
            wishlistCount={wishlistProducts.length}
            onCartClick={() => setCartOpen(true)}
            onWishlistClick={() => setWishlistOpen(true)}
            onMarketingClick={() => setView('marketing')}
            isAdmin={isAdmin}
            currentLanguage={language}
            onLanguageChange={setLanguage}
            onAuthClick={() => setView('auth')}
            t={t}
          />

          {!isSupabaseConfigured && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 py-3 px-4 text-center text-[11px] font-mono tracking-wide relative z-40">
              <span className="font-extrabold uppercase bg-amber-500 text-black px-1.5 py-0.5 rounded mr-2 text-[9px]">VERCEL DATABASE CONFIG</span>
              To display your <strong className="font-semibold text-amber-400">28 Supabase Products</strong> on Vercel, go to your <strong className="font-semibold text-amber-400">Vercel Project Dashboard ➜ Settings ➜ Environment Variables</strong>, add <code className="bg-black/40 px-1.5 py-0.5 rounded text-white font-black font-mono">VITE_SUPABASE_URL</code> and <code className="bg-black/40 px-1.5 py-0.5 rounded text-white font-black font-mono">VITE_SUPABASE_ANON_KEY</code>, then <strong>Redeploy</strong> your project.
            </div>
          )}

          <BottomNav 
            activeView={view} 
            onViewChange={(v) => {
              if (v === 'cart') {
                setCartOpen(true);
              } else if (v === 'search') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.dispatchEvent(new CustomEvent('toggleSearch'));
              } else if (v === 'profile') {
                // Profile view is deactivated per user request
                return;
              } else {
                setView(v);
                setCategory(null);
              }
            }}
            cartCount={cartCount}
          />

          <main className="pb-24 md:pb-0">
            <AnimatePresence mode="wait">
              <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Suspense fallback={<div className="flex items-center justify-center py-40"><Loader2 className="animate-spin text-blue-500" size={48} /></div>}>
                  {view === 'shop' && (
                    <>
                      <div className="z-40">
                         <CategoryBar onCategorySelect={(cat) => setCategory(cat)} selectedCategory={category} />
                      </div>

                      {products.length > 0 ? (
                        <HomeHero 
                          products={products}
                          filteredProducts={filteredProducts}
                          groupedMainProducts={groupedMainProducts}
                          loadingProducts={loadingProducts}
                          category={category}
                          searchQuery={searchQuery}
                          onAddToCart={addToCart}
                          onProductClick={(p) => { setSelectedProduct(p); setView('product-detail'); }}
                          onQuickView={(p) => setQuickViewProduct(p)}
                          onCategorySelect={(cat) => setCategory(cat)}
                          isItemWishlisted={isItemWishlisted}
                          onToggleWishlist={handleToggleWishlist}
                          isItemLiked={isItemLiked}
                          onToggleLike={handleToggleLike}
                          onSearch={setSearchQuery}
                          t={t}
                        />
                      ) : loadingProducts ? (
                        <div className="py-40 flex flex-col items-center justify-center min-h-[50vh]">
                          <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                          <p className="text-xs font-mono tracking-widest uppercase text-zinc-400 animate-pulse">Syncing Hardware Feed...</p>
                        </div>
                      ) : (
                        <div className="max-w-md mx-auto px-4 py-32 text-center min-h-[50vh] flex flex-col items-center justify-center">
                          <div className="bg-[#07070c]/5 border border-white/[0.06] rounded-[2.5rem] p-10 space-y-6">
                            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                              <AlertCircle size={28} />
                            </div>
                            <div className="space-y-2">
                              <h2 className="text-lg font-bold font-sans tracking-tight text-white uppercase">Sourcing Database Off-Grid</h2>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">
                                Our live hardware grid is currently undergoing server updates or your browser cache has been cleared. Tap below to reload the catalog.
                              </p>
                            </div>
                            <button 
                              onClick={() => fetchProducts()} 
                              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-black uppercase tracking-widest p-3.5 rounded-2xl transition-all active:scale-98 shadow-lg shadow-blue-600/20 cursor-pointer"
                            >
                              Sync Hardware Catalog
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {view === 'product-detail' && selectedProduct && (
                    <ProductDetail 
                      product={selectedProduct} 
                      products={products}
                      onBack={() => window.history.back()} 
                      onAddToCart={addToCart}
                      isWishlisted={isItemWishlisted(selectedProduct.id)}
                      onToggleWishlist={handleToggleWishlist}
                      isLiked={isItemLiked(selectedProduct.id)}
                      onToggleLike={handleToggleLike}
                      onProductClick={(p) => setSelectedProduct(p)}
                    />
                  )}

                  {view === 'marketing' && <MarketingPortal products={products} />}
                  {view === 'auth' && (
                    <div className="max-w-md mx-auto px-4 py-20 text-center">
                      <div className="bg-foreground/5 border border-white/[0.06] rounded-[2rem] p-8 space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
                          <X size={20} />
                        </div>
                        <h2 className="text-lg font-bold font-mono tracking-tight text-white uppercase">Profile Feature Deactivated</h2>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Authentication, log-in capabilities, and user profiles have been permanently deactivated per user request.
                        </p>
                        <button onClick={() => setView('shop')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase tracking-widest p-3 rounded-2xl transition-colors">
                          Return to Shop
                        </button>
                      </div>
                    </div>
                  )}
                  {view === 'reset-password' && <div className="max-w-md mx-auto px-4"><ResetPassword onSuccess={() => setView('shop')} /></div>}
                  {view === 'admin' && (
                    <ProtectedRoute requireAdmin>
                      <AdminDashboard products={products} onRefresh={fetchProducts} />
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

          <Footer 
            t={t} 
            onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }} 
            onAdminPanelClick={() => isAdmin ? setView('admin') : setIsAdminModalOpen(true)} 
          />
          <Cart 
            isOpen={cartOpen} 
            onClose={() => setCartOpen(false)} 
            items={cart} 
            onUpdateQuantity={updateCartQuantity} 
            onRemove={removeFromCart} 
            onCheckout={(method, district, fee, phone, address, name) => 
              handleCheckout(method, district, fee, phone, address, name, products)
            } 
            orderResult={null} 
            t={t} 
          />
          
          <WishlistDrawer 
            isOpen={wishlistOpen} 
            onClose={() => setWishlistOpen(false)} 
            items={wishlistProducts} 
            onRemove={handleToggleWishlist} 
            onAddToCart={addToCart} 
            onProductClick={(p) => { setSelectedProduct(p); setView('product-detail'); }} 
          />

          <ToastContainer toasts={toasts} onDismiss={removeToast} />
          
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
                    <div className="space-y-6 text-gray-400 text-sm"><p>All hardware comes with a 12-month Emma Assurance guarantee. We facilitate repairs and replacements directly with brand importers in Lira City.</p></div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
