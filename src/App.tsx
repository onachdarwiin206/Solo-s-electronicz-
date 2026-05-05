import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { BackgroundSlideshow } from './components/layout/BackgroundSlideshow';
import { BottomNav } from './components/layout/BottomNav';
import { Hero } from './components/home/Hero';
import { ProductCard } from './components/shop/ProductCard';
import { Cart } from './components/shop/Cart';
import { Footer } from './components/layout/Footer';
import { OrderTracking } from './components/tracking/OrderTracking';
import { MarketingPortal } from './components/marketing/MarketingPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AccountDashboard } from './components/profile/AccountDashboard';
import { ProductDetail } from './components/shop/ProductDetail';
import { LoginModal } from './components/auth/LoginModal';
import { INITIAL_PRODUCTS } from './constants';
import { Product, CartItem, Order, UserProfile, PaymentMethod } from './types';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { doc, setDoc, serverTimestamp, collection, getDocs, updateDoc } from 'firebase/firestore';
import { Language, translations } from './translations';
import { ShieldCheck, ChevronRight, X, UserCog } from 'lucide-react';

type View = 'shop' | 'tracking' | 'marketing' | 'terms' | 'admin' | 'profile' | 'product-detail';

const WHATSAPP_NUMBER = "256793405517";

export default function App() {
  const { user, loading: authResolving, isAdmin, logout } = useAuth();
  const [view, setView] = useState<View>('shop');
  const [category, setCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [language, setLanguage] = useState<Language>('en');

  // Handle protected views and login trigger
  useEffect(() => {
    const handleOpenLogin = () => setLoginModalOpen(true);
    window.addEventListener('openLogin', handleOpenLogin);
    return () => window.removeEventListener('openLogin', handleOpenLogin);
  }, []);

  useEffect(() => {
    if (authResolving) return;
    
    // Redirect logic for specific views if needed
    if (view === 'admin' && !isAdmin && !authResolving) {
      setView('shop');
    }
  }, [view, isAdmin, authResolving]);

  useEffect(() => {
    const handleNav = (e: any) => { if (e.detail) setView(e.detail); };
    window.addEventListener('changeView', handleNav);
    return () => window.removeEventListener('changeView', handleNav);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, category]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const dbProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        if (dbProducts.length > 0) {
          setProducts(prev => {
            const combined = [...prev];
            dbProducts.forEach(dbp => {
              if (!combined.find(p => p.id === dbp.id)) combined.push(dbp);
            });
            return combined;
          });
        }
      } catch (e) {
        console.warn("Using default products fallback");
      }
    };
    fetchProducts();
  }, []);

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

  const handleCheckout = async (method: PaymentMethod, district: string, deliveryFee: number, phone: string, address: string) => {
    if (!user) { setLoginModalOpen(true); return; }
    
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = `SOLO-ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const cartSummary = cart.map(i => `- ${i.name} (x${i.quantity})`).join('\n');
    const whatsappMessage = `*New Order: ${orderId}*\n\n*Items:*\n${cartSummary}\n\n*Total:* UGX ${(subtotal + deliveryFee).toLocaleString()}\n*Delivery:* ${district}, ${address}\n*Contact:* ${phone}\n\n_Please confirm stock and delivery time._`;
    
    try {
      await setDoc(doc(db, 'orders', orderId), {
        id: orderId,
        userId: user.id,
        customerName: user.name,
        customerPhone: phone,
        items: cart,
        total: subtotal + deliveryFee,
        status: 'pending',
        deliveryAddress: address,
        createdAt: serverTimestamp()
      });
      
      if (!user.phone) await updateDoc(doc(db, 'users', user.id), { phone, address, district });

      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
      setCart([]);
      setCartOpen(false);
      setView('tracking');
    } catch (e) {
       handleFirestoreError(e, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) { setLoginModalOpen(true); return; }
    
    const userRef = doc(db, 'users', user.id);
    const isWishlisted = user.wishlist?.includes(productId);
    const newWishlist = isWishlisted 
      ? user.wishlist?.filter(id => id !== productId) 
      : [...(user.wishlist || []), productId];
    
    try {
      await updateDoc(userRef, { wishlist: newWishlist });
      // The AuthContext will pick up the change or we can refresh it
    } catch (e) {
      console.error("Wishlist sync error:", e);
    }
  };

  const toggleLike = async (productId: string) => {
    if (!user) { setLoginModalOpen(true); return; }
    
    const userRef = doc(db, 'users', user.id);
    const isLiked = user.likes?.includes(productId);
    const newLikes = isLiked 
      ? user.likes?.filter(id => id !== productId) 
      : [...(user.likes || []), productId];
    
    try {
      await updateDoc(userRef, { likes: newLikes });
    } catch (e) {
      console.error("Like sync error:", e);
    }
  };

  const t = translations[language];

  const filteredProducts = products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (authResolving) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <BackgroundSlideshow />
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-500 rounded-full animate-spin z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <Navbar 
        onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }}
        onSearch={setSearchQuery}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        onProfileClick={() => user ? setView('profile') : setLoginModalOpen(true)}
        onTrackingClick={() => setView('tracking')}
        onMarketingClick={() => setView('marketing')}
        user={user}
        currentLanguage={language}
        onLanguageChange={setLanguage}
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
            {view === 'shop' && (
              <>
                {!category && (
                  <Hero user={user} onLogin={() => setLoginModalOpen(true)} onShopNow={() => document.getElementById('tech-inventory')?.scrollIntoView({ behavior: 'smooth' })} onMarketingClick={() => setView('marketing')} t={t} />
                )}
                <section id="tech-inventory" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-end mb-12">
                     <h2 className="text-4xl font-black tracking-tighter uppercase italic">{category || 'Hardware Feed'}</h2>
                     <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredProducts.length} Results</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={addToCart} 
                        onClick={() => { setSelectedProduct(product); setView('product-detail'); }}
                        isWishlisted={user?.wishlist?.includes(product.id)}
                        onToggleWishlist={toggleWishlist}
                        isLiked={user?.likes?.includes(product.id)}
                        onToggleLike={toggleLike}
                      />
                    ))}
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
            {view === 'marketing' && <MarketingPortal />}
            {view === 'admin' && (
              <ProtectedRoute requireAdmin>
                <AdminDashboard products={products} onProductAdded={(p) => setProducts(prev => [p, ...prev])} />
              </ProtectedRoute>
            )}
            
            {view === 'profile' && user && (
              <ProtectedRoute>
                <AccountDashboard user={user} products={products} onTrackOrder={() => setView('tracking')} onViewProduct={() => setView('shop')} />
              </ProtectedRoute>
            )}
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

      <Footer t={t} onCategorySelect={(cat) => { setCategory(cat); setView('shop'); }} onAdminPanelClick={() => isAdmin ? setView('admin') : setLoginModalOpen(true)} />
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} items={cart} onUpdateQuantity={updateCartQuantity} onRemove={(id) => setCart(p => p.filter(i => i.id !== id))} onCheckout={handleCheckout} orderResult={null} t={t} />
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} onSuccess={() => {}} />

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
    </div>
  );
}
