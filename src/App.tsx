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
import { LoginModal } from './components/auth/LoginModal';
import { INITIAL_PRODUCTS } from './constants';
import { Product, CartItem, Order, UserProfile, PaymentMethod } from './types';
import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/error-handler';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Language, translations } from './translations';
import { ShieldCheck, ChevronRight, X, UserCog, Globe, ArrowLeft, LayoutGrid } from 'lucide-react';

type View = 'shop' | 'tracking' | 'marketing' | 'terms' | 'admin' | 'profile';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [view, setView] = useState<View>('shop');
  const [category, setCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, category]);

  useEffect(() => {
    // Attempt to load products from Firestore on mount
    const fetchProducts = async () => {
      const path = 'products';
      try {
        const snap = await getDocs(collection(db, path));
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
        console.log("Could not load Firestore products (expected if empty or network issues)");
        // Don't throw for initial products load as we have defaults
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const fetchUserWithRetry = async () => {
          const path = `users/${fbUser.uid}`;
          try {
            const userRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userRef);
            
            let userData: UserProfile;
            if (userDoc.exists()) {
              userData = userDoc.data() as UserProfile;
              // Sync name from FB if missing or different
              const fbName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Guest User';
              if (!userData.name || (fbUser.displayName && userData.name !== fbUser.displayName)) {
                await updateDoc(userRef, { name: fbName });
                userData.name = fbName;
              }
              // Ensure admin role for specific email
              if (fbUser.email === 'onachdarwiin@gmail.com' && userData.role !== 'admin') {
                userData.role = 'admin';
                await updateDoc(userRef, { role: 'admin' });
              }
              // Sync phone from Google if missing in profile but present in Google provider
              if (!userData.phone && fbUser.phoneNumber) {
                await updateDoc(userRef, { phone: fbUser.phoneNumber });
                userData.phone = fbUser.phoneNumber;
              }
              if (fbUser.email === 'onachdarwiin@gmail.com' && view !== 'admin') {
                 setView('admin');
              }
            } else {
              userData = {
                id: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Guest User',
                email: fbUser.email || '',
                phone: fbUser.phoneNumber || '',
                role: fbUser.email === 'onachdarwiin@gmail.com' ? 'admin' : 'customer',
                wishlist: [],
                createdAt: serverTimestamp(),
              };
              await setDoc(userRef, userData);
            }
            setUser(userData);
            retryCount = 0; // Reset on success
          } catch (e: any) {
            console.warn(`Firestore auth fetch attempt ${retryCount + 1} failed:`, e.message);
            if ((e.message?.includes('offline') || e.code === 'unavailable') && retryCount < maxRetries) {
              retryCount++;
              setTimeout(fetchUserWithRetry, 2000 * retryCount);
            } else {
              handleFirestoreError(e, OperationType.GET, path);
            }
          }
        };

        fetchUserWithRetry();
      } else {
        setUser(null);
        retryCount = 0;
      }
    }, (error) => {
      console.error("Auth State Error:", error);
    });
    return unsub;
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setOrderResult(null);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleProfileClick = () => {
    if (!user) {
      setLoginModalOpen(true);
    } else {
      setView('profile');
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      handleProfileClick();
      return;
    }

    const isWishlisted = user.wishlist?.includes(productId);
    const userRef = doc(db, 'users', user.id);
    const path = `users/${user.id}`;

    try {
      if (isWishlisted) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(productId)
        });
        setUser(prev => prev ? { ...prev, wishlist: prev.wishlist?.filter(id => id !== productId) } : null);
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(productId)
        });
        setUser(prev => prev ? { ...prev, wishlist: [...(prev.wishlist || []), productId] } : null);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const handleToggleLike = async (productId: string) => {
    if (!user) {
      handleProfileClick();
      return;
    }

    const isLiked = user.likes?.includes(productId);
    const userRef = doc(db, 'users', user.id);
    const prodRef = doc(db, 'products', productId);
    const userPath = `users/${user.id}`;

    try {
      if (isLiked) {
        await updateDoc(userRef, {
          likes: arrayRemove(productId)
        });
        await updateDoc(prodRef, {
          likesCount: Math.max(0, (products.find(p => p.id === productId)?.likesCount || 1) - 1)
        });
        setUser(prev => prev ? { ...prev, likes: prev.likes?.filter(id => id !== productId) } : null);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, likesCount: Math.max(0, (p.likesCount || 0) - 1) } : p));
      } else {
        await updateDoc(userRef, {
          likes: arrayUnion(productId)
        });
        await updateDoc(prodRef, {
          likesCount: (products.find(p => p.id === productId)?.likesCount || 0) + 1
        });
        setUser(prev => prev ? { ...prev, likes: [...(prev.likes || []), productId] } : null);
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, userPath);
    }
  };

  const handleCheckout = async (method: PaymentMethod, district: string, deliveryFee: number, phone: string, address: string) => {
    if (!user) {
      handleProfileClick();
      return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrder: Order = {
      id: `SOLO-ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: user.id,
      customerName: user.name,
      customerPhone: phone,
      items: [...cart],
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: subtotal + deliveryFee,
      status: 'Pending',
      paymentMethod: method,
      district: district,
      deliveryAddress: address,
      receiptId: `SOLO-RC-${Date.now()}`,
      createdAt: new Date(),
    };
    
    // Attempt to save order to Firestore with robust error handling
    const orderPath = `orders/${newOrder.id}`;
    try {
      await setDoc(doc(db, 'orders', newOrder.id), {
        ...newOrder,
        createdAt: serverTimestamp(),
      });
      
      // Update inventory (simplified stock management)
      for (const item of cart) {
        const prodRef = doc(db, 'products', item.id);
        try {
          await updateDoc(prodRef, {
            stock: Math.max(0, (item.stock || 0) - item.quantity)
          });
        } catch (err) {
          console.warn(`Could not update stock for product ${item.id}`);
        }
      }

      // Sync user profile with phone and address if they don't have it
      if (!user.phone || !user.address) {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, {
           phone: phone,
           address: address,
           district: district
        });
        setUser(prev => prev ? { ...prev, phone, address, district } : null);
      }
      
      setOrderResult(newOrder);
      setCart([]);
    } catch (e) {
       handleFirestoreError(e, OperationType.WRITE, orderPath);
    }
  };

  const t = translations[language];

  const filteredProducts = products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      <BackgroundSlideshow />
      <Navbar 
        onCategorySelect={(cat) => {
          setCategory(cat);
          setSearchQuery('');
          setView('shop');
        }}
        onSearch={setSearchQuery}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
        onProfileClick={handleProfileClick}
        onTrackingClick={() => setView('tracking')}
        onMarketingClick={() => setView('marketing')}
        user={user}
        currentLanguage={language}
        onLanguageChange={setLanguage}
        t={t}
      />

      <BottomNav 
        activeView={view} 
        onViewChange={(v) => {
          setView(v);
          setCategory(null);
        }}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
      />

      <main>
        {view === 'shop' && (
          <>
            {!category && (
              <Hero 
                user={user} 
                onLogin={() => handleProfileClick()} 
                onShopNow={() => {
                  const shopSection = document.getElementById('tech-inventory');
                  shopSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                onMarketingClick={() => setView('marketing')}
                t={t} 
              />
            )}
            <section id="tech-inventory" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {category && (
                      <button 
                        onClick={() => setCategory(null)}
                        className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all group"
                        title="Return to Featured"
                      >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                      </button>
                    )}
                    <h2 className="text-4xl font-black tracking-tighter">
                      {category ? category.toUpperCase() : 'FEATURED TECH'}
                    </h2>
                  </div>
                  <p className="text-gray-400 font-medium">Discover our collection of premium engineering assets.</p>
                </div>
                <div className="flex gap-3">
                  {category && (
                    <button 
                      onClick={() => setCategory(null)}
                      className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-600/20 transition-all flex items-center gap-2"
                    >
                      <LayoutGrid size={14} />
                      Return to All Devices
                    </button>
                  )}
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
                    {filteredProducts.length} Results
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart}
                    isWishlisted={user?.wishlist?.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    isLiked={user?.likes?.includes(product.id)}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>

              {filteredProducts.length > 6 && (
                <div className="mt-16 flex justify-center">
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-3"
                  >
                    <ArrowLeft className="rotate-90" size={16} />
                    Return to Top / Refresh Feed
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {view === 'tracking' && <OrderTracking />}
        {view === 'marketing' && <MarketingPortal />}
        {view === 'admin' && (
          <AdminDashboard 
            products={products} 
            onProductAdded={(p) => setProducts(prev => [p, ...prev])} 
          />
        )}
        {view === 'profile' && user && (
          <AccountDashboard 
            user={user} 
            products={products}
            onTrackOrder={(id) => {
               // In a real app, we'd set tracking ID state, here we just switch view
               setView('tracking');
            }}
            onViewProduct={(id) => {
               setCategory(null);
               setSearchQuery('');
               setView('shop');
               // Smooth scroll to product or filter
            }}
          />
        )}

        {/* Admin Access Panel */}
        {user?.role === 'admin' && view !== 'admin' && (
          <div className="fixed bottom-32 left-8 z-[90]">
            <button 
              onClick={() => setView('admin')}
              className="bg-red-600/80 backdrop-blur-md p-4 rounded-full text-white shadow-2xl hover:bg-red-500 transition-all border border-red-400/50 flex items-center gap-3 pr-6"
            >
              <UserCog size={24} />
              <span className="text-sm font-black uppercase tracking-widest">Admin Control</span>
            </button>
          </div>
        )}

        {/* Global Policy Bar */}
        <div className="bg-white/5 backdrop-blur-md border-y border-white/10 py-12">
           <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-6">
                <ShieldCheck size={48} className="text-blue-500" />
                <div>
                   <h3 className="text-xl font-bold">COMMITMENT TO QUALITY</h3>
                   <p className="text-gray-500 text-sm">Every device is verified by Solo's engineering team.</p>
                </div>
             </div>
             <button 
               onClick={() => setShowTerms(true)}
               className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all flex items-center gap-2 text-sm font-bold"
             >
                Read Terms & Privacy <ChevronRight size={16} />
             </button>
           </div>
        </div>
      </main>

      <Footer 
        t={t} 
        onCategorySelect={(cat) => {
          setCategory(cat);
          setSearchQuery('');
          setView('shop');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAdminPanelClick={() => {
          if (user?.role === 'admin') setView('admin');
          else handleProfileClick();
        }}
      />
      <Cart 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        orderResult={orderResult}
        t={t}
      />

      {/* Login Modal */}
      <LoginModal 
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-gray-900 border border-white/10 p-8 rounded-[3rem] max-w-2xl w-full max-h-[80vh] overflow-y-auto relative no-scrollbar"
             >
                <button 
                  onClick={() => setShowTerms(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
                <h2 className="text-3xl font-black mb-8 pr-12">TERMS & PRIVACY POLICY</h2>
                <div className="space-y-6 text-gray-400 text-sm leading-relaxed">
                   <section>
                      <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">01. Service Guarantee</h4>
                      <p>Solo's Phones & Electronics provides a 24-month limited warranty on all hardware devices purchased through this platform.</p>
                   </section>
                   <section>
                      <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">02. Digital Receipts</h4>
                      <p>All transactions generate an immutable digital receipt. These are valid for tax documentation and warranty claims.</p>
                   </section>
                   <section>
                      <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">03. Data Handling</h4>
                      <p>We do not share your delivery address with third-party marketers. Your data is encrypted and handled by our secure server systems.</p>
                   </section>
                   <section>
                      <h4 className="text-white font-bold mb-2 uppercase tracking-widest text-xs">04. Delivery Policy</h4>
                      <p>Our delivery system ensures real-time tracking. Solo is responsible for any items damaged during transit if reported within 24 hours.</p>
                   </section>
                </div>
                <button 
                  onClick={() => setShowTerms(false)}
                  className="w-full mt-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all"
                >
                  I UNDERSTAND
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
