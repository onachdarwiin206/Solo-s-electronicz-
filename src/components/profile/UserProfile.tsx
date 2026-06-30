import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, MapPin, Package, Settings, LogOut, ShieldCheck, Clock, CheckCircle, Truck, Zap, Calendar, ArrowLeft, Info, Download } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { supabase, isSupabaseConfigured, resolveUserProfile } from '../../lib/supabase';
import { safeGetLocalStorage } from '../../lib/sandboxDb';
import { Order, Product, OrderStatus } from '../../types';
import { format, addDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { OptimizedImage } from '../ui/OptimizedImage';
import { INITIAL_PRODUCTS } from '../../constants';
import { jsPDF } from 'jspdf';

// PDF Generation Helper for Orders
const downloadReceiptPDF = (order: Order) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const primaryColor = [15, 23, 42];    // Slate 900
  const accentColor = [59, 130, 246];   // Blue 500
  const lightBg = [248, 250, 252];       // Slate 50
  const borderGray = [226, 232, 240];    // Slate 200
  const textDark = [15, 23, 42];        // Slate 900
  const textLight = [100, 116, 139];     // Slate 500

  // 1. Header Block with Slate Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 45, 'F');

  // Brand Name & Subtext
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('EMMA ELECTRONICS', 15, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Premium Hardware & Digital Electronics Feed', 15, 27);
  doc.text('Lira Town, Uganda | Support: +256 700 000000', 15, 32);

  // Digital Receipt Right Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DIGITAL RECEIPT', 142, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Order ID: #${order.id.toUpperCase().slice(0, 12)}`, 142, 27);
  
  let formattedDate = 'N/A';
  try {
    formattedDate = format(new Date(order.created_at), 'PPP');
  } catch (e) {
    formattedDate = new Date(order.created_at).toLocaleDateString();
  }
  doc.text(`Created: ${formattedDate}`, 142, 32);

  // 2. Billing & Delivery Panels (Two columns)
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(15, 53, 85, 38, 'F');
  doc.rect(110, 53, 85, 38, 'F');

  // Set line color & width for subtle boxes
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.2);
  doc.rect(15, 53, 85, 38, 'S');
  doc.rect(110, 53, 85, 38, 'S');

  // Panel 1 Content: Recipient info
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DELIVERY DESTINATION', 20, 60);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(order.customer_name || 'Anonymous User', 20, 66);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Tel: ${order.customer_phone || 'N/A'}`, 20, 72);
  doc.text(`District: ${order.district || 'Lira/Uganda'}`, 20, 77);
  
  // Wrap and print long addresses
  const addrText = order.delivery_address || 'Emma Local Delivery Hub';
  const splitAddr = doc.splitTextToSize(addrText, 75);
  doc.text(splitAddr, 20, 82);

  // Panel 2 Content: Supply summary metadata
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ORDER SUMMARY', 115, 60);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Status: ${order.status.toUpperCase()}`, 115, 66);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const payMethod = order.payment_method === 'momo' ? 'Mobile Money (MTN/Airtel)' : 'Cash on Delivery (COD)';
  doc.text(`Method: ${payMethod}`, 115, 72);
  doc.text(`Estimated Delivery: ${order.estimated_delivery || '1-2 Days (Immediate Feed)'}`, 115, 77);
  doc.text(`Receipt Code: E-RC-${order.id.slice(0, 6).toUpperCase()}`, 115, 82);

  // 3. Main Items Table
  let yPos = 100;
  
  // Header row background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(15, yPos, 180, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item Description / Component Name', 18, yPos + 5.5);
  doc.text('Qty', 130, yPos + 5.5);
  doc.text('Unit Price', 145, yPos + 5.5);
  doc.text('Subtotal', 172, yPos + 5.5);

  // List products
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  order.items.forEach((item) => {
    yPos += 10;
    
    // Grid horizontal gridline
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.line(15, yPos + 8, 195, yPos + 8);

    // Render items safely
    const itemLabel = item.name.length > 60 ? `${item.name.slice(0, 57)}...` : item.name;
    doc.text(itemLabel, 18, yPos + 4);
    doc.text(String(item.quantity), 130, yPos + 4);
    doc.text(`UGX ${item.price.toLocaleString()}`, 145, yPos + 4);
    doc.text(`UGX ${(item.price * item.quantity).toLocaleString()}`, 172, yPos + 4);
  });

  // 4. Breakdown Totals Block
  yPos += 18;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.4);
  doc.line(120, yPos, 195, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Items Subtotal:', 122, yPos);
  doc.text(`UGX ${order.total.toLocaleString()}`, 165, yPos);

  yPos += 5;
  doc.text('Lira Dispatch Delivery:', 122, yPos);
  doc.text('UGX 0 (Free Sync)', 165, yPos);

  yPos += 7;
  // Accent background block for grand total
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(120, yPos - 4.5, 75, 7.5, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL:', 123, yPos + 1);
  doc.text(`UGX ${order.total.toLocaleString()}`, 155, yPos + 1);

  // 5. Receipt Bottom Footer Notice
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(15, pageHeight - 25, 195, pageHeight - 25);

  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('This is an official hardware supply log receipt and is validated client-side in the Lira Grid.', 105, pageHeight - 17, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for your trust and business with Emma Electronics!', 105, pageHeight - 11, { align: 'center' });

  // Save the generated PDF
  doc.save(`Emma_Electronics_Receipt_${order.id.slice(0, 8).toUpperCase()}.pdf`);
};

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

        // Centrally resolve high-fidelity, medium-fidelity or default profile
        const profileToUse = await resolveUserProfile(user.id);

        if (profileToUse) {
          if (profileToUse.wishlist?.length > 0) {
            const { data: wishlist } = await supabase
              .from('products')
              .select('*')
              .in('id', profileToUse.wishlist);
            if (wishlist) setWishlistProducts(wishlist);
          } else {
            setWishlistProducts([]);
          }

          if (profileToUse.likes?.length > 0) {
            const { data: likes } = await supabase
              .from('products')
              .select('*')
              .in('id', profileToUse.likes);
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
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/20 border border-white/5 mb-4 relative flex items-center justify-center">
              <OptimizedImage src={p.image} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" />
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

                      {/* Item Image Grid */}
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mb-6">
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

                      {/* Items Detail List */}
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">Component / Hardware Supply Breakdown</p>
                        <div className="space-y-1.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-xs text-zinc-300">
                              <span className="font-sans leading-tight pr-4">
                                {item.name} <span className="text-blue-400 font-mono text-[10px] ml-1">x{item.quantity}</span>
                              </span>
                              <span className="text-zinc-400 font-mono text-[11px] shrink-0">
                                UGX {(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions Area: Digital Invoice Download */}
                      <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                          Digital Receipt Code: <span className="text-zinc-400">E-RC-{order.id.slice(0, 6).toUpperCase()}</span>
                        </div>
                        <button
                          onClick={() => downloadReceiptPDF(order)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-98 cursor-pointer shadow-lg shadow-blue-600/10"
                        >
                          <Download size={13} />
                          Download PDF Receipt
                        </button>
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
