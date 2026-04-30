import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/home/Hero';
import { ProductCard } from './components/shop/ProductCard';
import { Cart } from './components/shop/Cart';
import { Footer } from './components/layout/Footer';
import { OrderTracking } from './components/tracking/OrderTracking';
import { MarketingPortal } from './components/marketing/MarketingPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SoloBot } from './components/home/SoloBot';
import { INITIAL_PRODUCTS } from './constants';
import { Product, CartItem, Order, UserProfile } from './types';
import { auth, db, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { ShieldCheck, ChevronRight, X, UserCog } from 'lucide-react';

type View = 'shop' | 'tracking' | 'marketing' | 'terms' | 'admin';

export default function App() {
  const [view, setView] = useState<View>('shop');
  const [category, setCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  useEffect(() => {
    // Attempt to load products from Firestore on mount
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
        console.log("Could not load Firestore products (expected if empty or network issues)");
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          const newUser: UserProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || 'Guest User',
            email: fbUser.email || '',
            role: 'customer',
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', fbUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
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
      signInWithPopup(auth, googleProvider);
    } else {
      signOut(auth);
    }
  };

  const handleCheckout = (method: any) => {
    if (!user) {
      signInWithPopup(auth, googleProvider);
      return;
    }
    
    // Auto-promote first user to admin for testing purposes in this environment
    if (user.role === 'customer' && user.email === 'onachdarwiin@gmail.com') {
      const updatedUser = { ...user, role: 'admin' as const };
      setDoc(doc(db, 'users', user.id), updatedUser);
      setUser(updatedUser);
    }
    
    const newOrder: Order = {
      id: `SOLO-ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userId: user.id,
      customerName: user.name,
      items: [...cart],
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'processing',
      paymentMethod: method,
      deliveryAddress: 'Default User Address Street, Tech District',
      receiptId: `SOLO-RC-${Date.now()}`,
      createdAt: new Date(),
    };
    
    setOrderResult(newOrder);
    setCart([]);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
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
      />

      <main>
        {view === 'shop' && (
          <>
            {!category && <Hero user={user} onLogin={() => handleProfileClick()} />}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter mb-2">
                    {category ? category.toUpperCase() : 'FEATURED TECH'}
                  </h2>
                  <p className="text-gray-400 font-medium">Discover our collection of premium engineering assets.</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
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
                  />
                ))}
              </div>
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

      <Footer />
      <SoloBot 
        user={user} 
        onLogin={() => handleProfileClick()} 
        onViewTerms={() => setShowTerms(true)}
        onTrackOrder={() => setView('tracking')}
      />

      <Cart 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        orderResult={orderResult}
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
