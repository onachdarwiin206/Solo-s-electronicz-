import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, MapPin, Package, Settings, LogOut, ShieldCheck, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../lib/supabase';
import { Order, Product } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'likes'>('orders');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch Orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (ordersData) setOrders(ordersData as Order[]);

        // Fetch user profile for wishlist and likes arrays
        const { data: profile } = await supabase
          .from('profiles')
          .select('wishlist, likes')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.wishlist?.length > 0) {
            const { data: wishlist } = await supabase
              .from('products')
              .select('*')
              .in('id', profile.wishlist);
            if (wishlist) setWishlistProducts(wishlist);
          } else {
            setWishlistProducts([]);
          }

          if (profile.likes?.length > 0) {
            const { data: likes } = await supabase
              .from('products')
              .select('*')
              .in('id', profile.likes);
            if (likes) setLikedProducts(likes);
          } else {
            setLikedProducts([]);
          }
        }
      } catch (e) {
        console.error("Profile data fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user]);

  if (!user) return null;

  const renderProductGrid = (products: Product[], emptyTitle: string, emptyMsg: string) => {
    if (products.length === 0) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-20 text-center">
          <Package className="text-gray-700 mx-auto mb-6" size={64} />
          <h4 className="text-xl font-black text-gray-600 uppercase italic tracking-tighter">{emptyTitle}</h4>
          <p className="text-gray-700 text-xs font-bold uppercase mt-2 tracking-widest">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div 
            key={p.id} 
            className="group cursor-pointer"
            onClick={() => window.dispatchEvent(new CustomEvent('openProduct', { detail: p }))}
          >
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/20 border border-white/5 mb-4 relative">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">{p.name}</h4>
            <p className="text-[10px] font-bold text-blue-500 font-mono">UGX {p.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-20 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 rounded-[3rem] p-10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
            
            <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-blue-500/20">
              <User className="text-blue-500" size={40} />
            </div>
            
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
              {user.name || 'User'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">
              <ShieldCheck size={14} className="text-emerald-500" />
              Verified Profile
            </div>

            <div className="space-y-4 text-left">
              <div className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                <Mail className="text-gray-500" size={18} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Email</p>
                  <p className="text-sm font-bold text-gray-300 truncate">{user.email}</p>
                </div>
              </div>
              
              {user.role === 'admin' && (
                <div className="flex items-center gap-4 p-4 bg-red-600/10 rounded-2xl border border-red-600/20">
                  <Settings className="text-red-500" size={18} />
                  <div>
                    <p className="text-[10px] uppercase font-black text-red-500 tracking-widest">Access Layer</p>
                    <p className="text-sm font-bold text-red-400">Admin Clearance</p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => logout()}
              className="w-full mt-10 py-5 bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border border-white/5 hover:border-red-500/20"
            >
              <LogOut size={16} /> Terminate Session
            </button>
          </motion.div>
        </div>

        {/* Main Content: Orders */}
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex gap-4">
              {[
                { id: 'orders', label: 'Supplies', count: orders.length },
                { id: 'wishlist', label: 'Wishlist', count: wishlistProducts.length },
                { id: 'likes', label: 'Likes', count: likedProducts.length }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="relative group"
                >
                  <div className={cn(
                    "px-6 py-3 rounded-2xl transition-all border font-black uppercase tracking-widest text-[10px]",
                    activeTab === tab.id 
                      ? "bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/20" 
                      : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10"
                  )}>
                    {tab.label}
                    <span className="ml-2 opacity-50 font-mono">[{tab.count}]</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-white/5 rounded-[2.5rem] border border-white/10 animate-pulse" />
                  ))
                ) : orders.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-[3rem] p-20 text-center">
                    <Package className="text-gray-700 mx-auto mb-6" size={64} />
                    <h4 className="text-xl font-black text-gray-600 uppercase italic tracking-tighter">No Supply Logs Detected</h4>
                    <p className="text-gray-700 text-xs font-bold uppercase mt-2 tracking-widest">Browse the shop to initialize your history.</p>
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }))}
                      className="mt-10 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all"
                    >
                      Enter Shop
                    </button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 group hover:bg-white/[0.07] transition-all"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-full text-white uppercase tracking-widest">
                              {order.id}
                            </span>
                            <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px]">
                              <Clock size={12} />
                              {format(new Date(order.created_at), 'PPP')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-600" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{order.district}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white italic tracking-tighter mb-1">
                            UGX {order.total.toLocaleString()}
                          </p>
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            order.status === 'delivered' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          )}>
                            {order.status === 'delivered' && <CheckCircle size={10} />}
                            {order.status}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" 
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2rem] border border-white/10 animate-pulse" />)}
                </div>
              ) : renderProductGrid(wishlistProducts, "Wishlist Depleted", "Save products while browsing to build your secure wish-feed.")
            )}

            {activeTab === 'likes' && (
              loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => <div key={i} className="aspect-[4/5] bg-white/5 rounded-[2rem] border border-white/10 animate-pulse" />)}
                </div>
              ) : renderProductGrid(likedProducts, "Zero Pulse", "Like products to store your preferred hardware benchmarks here.")
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
