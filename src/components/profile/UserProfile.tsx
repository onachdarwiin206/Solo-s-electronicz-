import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, MapPin, Package, Settings, LogOut, ShieldCheck, Clock, CheckCircle, Truck, Zap, Calendar, ArrowLeft, Info } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { safeGetLocalStorage } from '../../lib/sandboxDb';
import { Order, Product, OrderStatus } from '../../types';
import { format, addDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { OptimizedImage } from '../ui/OptimizedImage';
import { INITIAL_PRODUCTS } from '../../constants';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'likes'>('orders');
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return { label: 'Awaiting Verification', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock, progress: 20 };
      case 'confirmed': return { label: 'Order Confirmed', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: ShieldCheck, progress: 40 };
      case 'delivering': return { label: 'In Transit', color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: Truck, progress: 75 };
      case 'delivered': return { label: 'Deployment Complete', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle, progress: 100 };
      default: return { label: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: Info, progress: 0 };
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      setLoading(true);

      if (!isSupabaseConfigured) {
        // Fetch sandbox local orders for this user
        const localOrders = safeGetLocalStorage<any[]>('solo_sandbox_orders', []);
        const userOrders = localOrders.filter((o: any) => o.user_id === user.id);
        setOrders(userOrders);

        // Get product arrays
        const wlIds = user.wishlist || [];
        const lkIds = user.likes || [];
        
        const WL = INITIAL_PRODUCTS.filter(p => wlIds.includes(p.id));
        const LK = INITIAL_PRODUCTS.filter(p => lkIds.includes(p.id));
        
        setWishlistProducts(WL);
        setLikedProducts(LK);
        setLoading(false);
        return;
      }

      try {
        // Fetch Orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (ordersData) setOrders(ordersData as Order[]);

        // Fetch user profile for wishlist and likes arrays
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('wishlist, likes')
          .eq('id', user.id)
          .single();

        if (pErr && pErr.message?.includes('likes')) {
          // Fallback if likes column missing
          const { data: fallback } = await supabase
            .from('profiles')
            .select('wishlist')
            .eq('id', user.id)
            .single();
          if (fallback) {
            (profile as any) = { ...fallback, likes: [] };
          }
        }

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
              <OptimizedImage src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">{p.name}</h4>
            <p className="text-[10px] font-bold text-blue-500 font-mono">UGX {p.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  };

  const OrderStatusTracker = ({ order }: { order: Order }) => {
    const config = getStatusConfig(order.status);
    const StatusIcon = config.icon;
    const estDelivery = order.estimated_delivery || format(addDays(new Date(order.created_at), 3), 'PPP');
    
    const steps = [
      { id: 'pending', label: 'Processing', date: format(new Date(order.created_at), 'MMM dd') },
      { id: 'confirmed', label: 'Confirmed', date: format(addDays(new Date(order.created_at), 1), 'MMM dd') },
      { id: 'delivering', label: 'In Transit', date: 'Ongoing' },
      { id: 'delivered', label: 'Delivered', date: order.status === 'delivered' ? 'Complete' : 'Pending' }
    ];

    const currentStepIndex = ['pending', 'confirmed', 'delivering', 'delivered'].indexOf(order.status);

    return (
      <div className="bg-black/40 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
        
        <button 
          onClick={() => setTrackingOrder(null)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Logs
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className={cn("p-4 rounded-3xl", config.bg)}>
                <StatusIcon className={config.color} size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">{config.label}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Order ID: {order.id}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 text-right">
            <div className="flex items-center gap-3 justify-end text-blue-500 mb-1">
              <Calendar size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Estimated Deployment</p>
            </div>
            <p className="text-xl font-black text-white italic lowercase tracking-tighter">{estDelivery}</p>
          </div>
        </div>

        {/* Tracking Line */}
        <div className="relative py-12 mb-12">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2" />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${config.progress}%` }}
            className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          />
          
          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-4 group">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-4 transition-all duration-500 z-10",
                    isCompleted ? "bg-blue-600 border-blue-400 scale-125" : "bg-neutral-900 border-neutral-700"
                  )}>
                    {isCurrent && <div className="w-full h-full rounded-full animate-ping bg-blue-400/50" />}
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      isCompleted ? "text-white" : "text-gray-600"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-[8px] font-bold text-gray-500 mt-1">{step.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items Summary */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-6">Hardware Payload</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl group hover:border-white/10 transition-colors">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/5">
                  <OptimizedImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white uppercase italic tracking-tighter truncate max-w-[150px]">{item.name}</h5>
                  <p className="text-[10px] font-bold text-blue-500 font-mono">x{item.quantity} Units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
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
                {trackingOrder ? (
                  <OrderStatusTracker order={trackingOrder} />
                ) : loading ? (
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
                          <button 
                            onClick={() => setTrackingOrder(order)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 transition-all text-blue-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-500/20"
                          >
                            <Zap size={10} /> Track Deployment
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5 group-hover:border-white/10 transition-colors">
                            <OptimizedImage 
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
