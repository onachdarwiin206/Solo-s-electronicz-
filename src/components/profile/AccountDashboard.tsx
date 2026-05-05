import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Heart, History, User, ChevronRight, ShoppingBag, Star, Clock, Bookmark, ArrowLeft } from 'lucide-react';
import { UserProfile, Order, Product } from '../../types';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
import { format } from 'date-fns';

interface AccountDashboardProps {
  user: UserProfile;
  products: Product[];
  onTrackOrder: (orderId: string) => void;
  onViewProduct: (productId: string) => void;
}

export function AccountDashboard({ user, products, onTrackOrder, onViewProduct }: AccountDashboardProps) {
  const { logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'likes'>('orders');

  useEffect(() => {
    const fetchOrders = async () => {
      const path = 'orders';
      try {
        const q = query(
          collection(db, path),
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, path);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user.id]);

  const wishlistProducts = products.filter(p => user.wishlist?.includes(p.id));
  const likedProducts = products.filter(p => user.likes?.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }))}
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Return to Shop
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <div className="p-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem]">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-black text-white mb-6 uppercase shadow-2xl shadow-blue-500/20">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-1">{user.name}</h2>
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest leading-relaxed break-all">{user.email}</p>
            {user.phone && (
              <p className="text-blue-500 font-mono text-[10px] uppercase tracking-widest mt-1">Verified: {user.phone}</p>
            )}
            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Package size={20} />
                <span className="font-bold text-sm">Order History</span>
              </button>
              <button 
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'wishlist' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Bookmark size={20} />
                <span className="font-bold text-sm">Wishlist</span>
              </button>
              <button 
                onClick={() => setActiveTab('likes')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'likes' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Heart size={20} />
                <span className="font-bold text-sm">Liked Items</span>
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              {user.role === 'admin' && (
                <button 
                  onClick={() => {
                    const event = new CustomEvent('changeView', { detail: 'admin' });
                    window.dispatchEvent(event);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest"
                >
                  <Star size={20} />
                  Management Console
                </button>
              )}
              <button 
                onClick={() => {
                  logout();
                  window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }));
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
              >
                <Package size={20} />
                Sign Out
              </button>
            </div>
          </div>

          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Account Status</h3>
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                 <History className="text-green-500" size={18} />
               </div>
               <div>
                  <p className="text-white font-bold text-xs">Customer Since</p>
                  <p className="text-gray-500 text-[10px]">{format(new Date(user.createdAt?.seconds * 1000 || Date.now()), 'MMMM yyyy')}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' ? (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Purchases</h2>
                    <p className="text-gray-500 font-mono text-[10px] tracking-widest mt-2">Historical Transaction Records</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-blue-500">{orders.length}</span>
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Total Orders</p>
                  </div>
                </div>

                {loading ? (
                   <div className="py-20 flex justify-center">
                      <div className="w-8 h-8 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
                   </div>
                ) : orders.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-white/20 transition-all group">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                                <ShoppingBag size={24} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{order.id}</p>
                                <p className="text-white font-black text-lg">{format(new Date(order.createdAt?.seconds * 1000 || order.createdAt), 'MMM dd, yyyy')}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                  order.status === 'delivered' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount</p>
                                <p className="text-white font-mono font-bold">UGX {order.total.toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={() => onTrackOrder(order.id)}
                                className="w-10 h-10 bg-white/5 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-all"
                              >
                                <ChevronRight size={20} />
                              </button>
                           </div>
                        </div>
                        <div className="flex gap-4 pt-6 overflow-x-auto no-scrollbar">
                           {order.items.map((item, idx) => (
                             <div key={idx} className="shrink-0 w-16 h-16 rounded-xl bg-black/40 border border-white/10 overflow-hidden">
                                <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={item.name} />
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No orders found yet</p>
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="mt-6 text-blue-500 font-black text-xs uppercase tracking-tighter hover:text-white transition-colors"
                    >
                      Start Shopping &rarr;
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'wishlist' ? (
              <motion.div 
                key="wishlist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-12">
                   <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Inventory Saved</h2>
                   <p className="text-gray-500 font-mono text-[10px] tracking-widest mt-2 uppercase">Curated Technology Selection</p>
                </div>

                {wishlistProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlistProducts.map(product => (
                      <div key={product.id} className="relative group bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
                         <div className="aspect-video overflow-hidden relative">
                            <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                         </div>
                         <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                               <h4 className="text-xl font-black text-white tracking-tighter truncate leading-tight uppercase">{product.name}</h4>
                               <span className="text-blue-500 font-mono font-bold text-xs">UGX {product.price.toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={() => onViewProduct(product.id)}
                              className="w-full py-4 bg-white/5 hover:bg-white text-gray-300 hover:text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/10 hover:border-white"
                            >
                              Explore Detail
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <Bookmark size={40} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Your wishlist is empty</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="likes"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-12">
                   <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Appreciated Tech</h2>
                   <p className="text-gray-500 font-mono text-[10px] tracking-widest mt-2 uppercase">Products you've acknowledged</p>
                </div>

                {likedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {likedProducts.map(product => (
                      <div key={product.id} className="relative group bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-pink-500/30 transition-all duration-500 shadow-2xl">
                         <div className="aspect-video overflow-hidden relative">
                            <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                         </div>
                         <div className="p-8">
                            <div className="flex justify-between items-start mb-4">
                               <h4 className="text-xl font-black text-white tracking-tighter truncate leading-tight uppercase">{product.name}</h4>
                               <span className="text-pink-500 font-mono font-bold text-xs">UGX {product.price.toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={() => onViewProduct(product.id)}
                              className="w-full py-4 bg-white/5 hover:bg-white text-gray-300 hover:text-black font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/10 hover:border-white"
                            >
                              Explore Detail
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                    <Heart size={40} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">You haven't liked anything yet</p>
                  </div>
                )}
              </motion.div>
            )
}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
