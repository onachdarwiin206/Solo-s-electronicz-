import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Star, 
  Search, 
  Plus, 
  Database, 
  Cpu, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MapPin,
  ArrowRight,
  X,
  Smartphone as PhoneIcon,
  CircleDot
} from 'lucide-react';

interface HeroProps {
  onShopNow: () => void;
  onMarketingClick: () => void;
  t: any;
}

export function Hero({ onShopNow, onMarketingClick, t }: HeroProps) {
  const [showTracker, setShowTracker] = useState(false);
  const [typedOrderId, setTypedOrderId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Floating particles dynamic coordinates
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    // Generate particles
    const items = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 8,
      size: 2 + Math.random() * 4,
    }));
    setParticles(items);

    // Fetch user local orders for instant auto-complete tracking
    try {
      const ordersStr = localStorage.getItem('solo_sandbox_orders');
      if (ordersStr) {
        const parsed = JSON.parse(ordersStr);
        if (Array.isArray(parsed)) {
          setLocalOrders(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleTrackSearch = (id: string) => {
    const cleanId = id.trim().toUpperCase();
    if (!cleanId) {
      setErrorMessage('Please enter an Order ID or Sample Tracker code.');
      setTrackingResult(null);
      return;
    }

    setErrorMessage('');

    // Check sample tracker
    if (cleanId === 'SOLO-SAMPLE-UG' || cleanId === 'SOLO-SAMPLE' || cleanId === 'SAMPLE') {
      const sampleOrder = {
        id: 'SOLO-SAMPLE-UG',
        customer_name: 'John Mukasa',
        district: 'Kampala',
        total: 2450000,
        status: 'delivering',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        delivery_address: 'Plot 4, Kampala Road, City Centre',
        estimated_delivery: 'Today at 5:30 PM',
        items: [
          { name: 'iPhone 15 Pro Max (256GB - Grade A)', quantity: 1, price: 4100000 },
          { name: 'Oraimo FreePods 4 Active ANC', quantity: 1, price: 150000 }
        ],
        tracking_logs: [
          { status: 'pending', message: 'Hardware payment received via Mobile Money', timestamp: '10:15 AM' },
          { status: 'confirmed', message: 'Verified by Solo Storekeeper. Inventory allocated.', timestamp: '11:00 AM' },
          { status: 'delivering', message: 'Dispatched from Kampala Hub via SafeBoda express courier', timestamp: '12:30 PM' },
        ]
      };
      setTrackingResult(sampleOrder);
      return;
    }

    // Check actual local orders
    const found = localOrders.find(o => o.id?.toUpperCase() === cleanId || o.receipt_id?.toUpperCase() === cleanId);
    if (found) {
      // Build mock logs if they are missing
      const baseLogs = found.tracking_logs || [];
      if (baseLogs.length === 0) {
        baseLogs.push({ status: 'pending', message: 'Order created in high-performance terminal.', timestamp: 'Just now' });
        if (found.status !== 'pending') {
          baseLogs.push({ status: 'confirmed', message: 'Secure payload verified and processed.', timestamp: '10 mins ago' });
        }
        if (found.status === 'delivering' || found.status === 'delivered') {
          baseLogs.push({ status: 'delivering', message: 'Dispatched for active regional deployment.', timestamp: 'Ongoing' });
        }
        if (found.status === 'delivered') {
          baseLogs.push({ status: 'delivered', message: 'Delivered securely. Signature captured.', timestamp: 'Completed' });
        }
      }
      setTrackingResult({
        ...found,
        tracking_logs: baseLogs
      });
    } else {
      setErrorMessage(`Order ID "${cleanId}" not found. Try the live demo using the "SOLO-SAMPLE-UG" code!`);
      setTrackingResult(null);
    }
  };

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#050508]">
      
      {/* 1. Futuristic Grid & Neon Blur Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#11111a_1px,transparent_1px),linear-gradient(to_bottom,#11111a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.06),transparent_50%),radial-gradient(circle_at_80%_60%,rgba(139,92,246,0.06),transparent_50%)] pointer-events-none" />
      
      {/* 2. Soft Floating Particle Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: '105vh', x: `${p.left}vw`, opacity: 0 }}
            animate={{ y: '-10vh', opacity: [0, 0.6, 0.6, 0] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
            style={{ width: p.size, height: p.size }}
            className="absolute rounded-full bg-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* 3. Left Column: Strong Copywriting, State indicators, and Multi-CTAs */}
        <div className="lg:col-span-7 flex flex-col pt-4">
          
          {/* Action-Oriented Core Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter sm:leading-[1.15] mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
              {t.hero_title}
            </span>
          </h1>

          {/* Benefit-driven Subheadline */}
          <p className="text-sm sm:text-base text-gray-400 font-normal leading-relaxed mb-8 max-w-xl">
            {t.hero_subtitle}
          </p>

          {/* Main CTA Button Structure */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <button 
              onClick={onShopNow}
              id="hero-primary-cta"
              className="w-full sm:w-auto px-10 py-4.5 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.45)] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
            >
              <span>{t.shop_now || "Explore Inventory"}</span>
              <ChevronRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* Trust Elements / Grid Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5 pt-8">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-wider font-mono">100% Genuine</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Verified Hardware Only</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-wider font-mono">Same-Day Delivery</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Kampala & Districts</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5">
                <Smartphone size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-wider font-mono">Secure Payments</p>
                <p className="text-[9px] text-gray-400 mt-0.5">MoMo & Airtel Money</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5">
                <Star size={14} className="fill-blue-500 stroke-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-wider font-mono">4.9/5 Rating</p>
                <p className="text-[9px] text-gray-400 mt-0.5">1,240+ Verified Reviews</p>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Right Column: Premium Interactive 3D Bento Canvas Showcase */}
        <div className="lg:col-span-12 xl:col-span-5 lg:block h-full relative">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative flex items-center justify-center p-4 bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 rounded-[3rem] backdrop-blur-xl shadow-2xl overflow-hidden min-h-[460px]"
          >
            {/* Soft inner glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Interactive Vector Hardware Icons Array stacked elegantly */}
            <div className="relative w-full py-12 flex flex-col items-center gap-8 justify-center select-none">
              
              {/* Device showcase cards container */}
              <div className="relative flex items-center justify-center w-64 h-64">
                
                {/* 1. Main Laptop element */}
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute z-10 w-48 h-32 bg-neutral-900 border border-white/20 rounded-xl p-3 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start border-b border-white/10 pb-1">
                    <Laptop size={20} className="text-blue-500" />
                    <span className="text-[7.5px] font-mono font-black text-gray-500 bg-white/5 px-1 py-0.5 rounded">CORE PRO i9</span>
                  </div>
                  <div className="w-full h-12 bg-black/60 rounded-lg overflow-hidden p-1.5 flex flex-col justify-between">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    </div>
                    <p className="text-[6px] font-mono text-gray-400 truncate">UGX 6,400,000</p>
                  </div>
                  <div className="w-full h-1 bg-white/40 rounded-full mt-1 shrink-0" />
                </motion.div>

                {/* 2. Overlapping Flagship Smartphone */}
                <motion.div 
                  animate={{ y: [-4, 6, -4], x: [-3, 3, -3] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute z-20 left-4 top-8 w-24 h-44 bg-neutral-950 border border-white/30 rounded-[1.75rem] p-2 shadow-2xl flex flex-col justify-between"
                >
                  <div className="w-12 h-3 bg-black rounded-full mx-auto flex items-center justify-center mb-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                  </div>
                  <div className="flex-1 w-full bg-gradient-to-b from-blue-950 to-neutral-900 rounded-2xl p-1.5 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[5px] font-bold text-gray-500">SOLO MoMo</span>
                      <ShieldCheck size={8} className="text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[7px] font-bold text-white truncate">iPhone 15 Pro</p>
                      <p className="text-[5.5px] text-blue-400 font-mono">UGX 4.1M</p>
                    </div>
                  </div>
                  <div className="h-1" />
                </motion.div>

                {/* 3. Earbuds Case Card */}
                <motion.div 
                  animate={{ y: [8, -4, 8], x: [4, -4, 4] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute z-20 -right-8 bottom-4 w-28 h-20 bg-neutral-900 border border-white/20 rounded-2xl p-3 shadow-2xl flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Headphones size={14} className="text-indigo-400" />
                    <span className="text-[7px] font-bold text-emerald-400">92% BTY</span>
                  </div>
                  <p className="text-[8px] font-black text-white uppercase italic truncate">Pods Ultra ANC</p>
                  <div className="flex items-center gap-1.5 text-[7px] font-mono text-gray-400 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span>Connected</span>
                  </div>
                </motion.div>

              </div>

              {/* 5. Floating UI Data Telemetry Badges (Overlays) */}
              
              {/* Telemetry F1: Order Status GPS Tracking info */}
              <div className="w-11/12 max-w-[320px] bg-black/60 border border-white/15 rounded-2xl p-3 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg">
                <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-500 shrink-0">
                  <Truck size={18} className="animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono font-black text-blue-500">ORDER TRACKING</span>
                    <span className="text-[7.5px] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded">LIVE STAGE</span>
                  </div>
                  <p className="text-[10.5px] font-black text-white uppercase italic truncate">Moto Hub Lira City</p>
                  <p className="text-[8.5px] text-gray-400 truncate">Estimated Arrival Time: <span className="text-white font-mono">5:30 PM Today</span></p>
                </div>
              </div>

              {/* Telemetry F2: Stats indicator */}
              <div className="flex gap-3 justify-center w-full">
                <div className="bg-white/5 border border-white/5 rounded-xl px-5 py-2.5 text-center backdrop-blur-md">
                  <p className="text-xs font-black text-white italic tracking-tight font-mono">10,000+</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-blue-500">Sold</p>
                </div>
              </div>

            </div>

          </motion.div>
        </div>

      </div>

      {/* 6. High-Fidelity Logistics Control Order Tracker Overlay Panel */}
      <AnimatePresence>
        {showTracker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0b0c10] border border-white/15 rounded-[3rem] p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-[0_0_50px_rgba(59,130,246,0.15)]"
            >
              
              {/* Top Bar */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">LOGISTICS RADAR</h3>
                  <p className="text-[9px] font-mono font-black text-blue-500 uppercase tracking-widest">Real-time Node Telemetry</p>
                </div>
                <button 
                  onClick={() => {
                    setShowTracker(false);
                    setTrackingResult(null);
                    setErrorMessage('');
                  }}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Quick Lookup Field */}
              <div className="relative mb-6">
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 focus-within:border-blue-500/50 transition-colors">
                  <input 
                    type="text"
                    value={typedOrderId}
                    onChange={(e) => setTypedOrderId(e.target.value)}
                    placeholder="Enter Order ID (e.g., SOLO-SAMPLE-UG)"
                    className="bg-transparent border-none outline-none text-white text-xs px-4 py-3.5 flex-1 font-mono uppercase tracking-widest min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTrackSearch(typedOrderId);
                    }}
                  />
                  <button 
                    onClick={() => handleTrackSearch(typedOrderId)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Search size={14} />
                    <span>Lock On</span>
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-red-400 text-[10px] font-bold uppercase mt-2 font-mono flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errorMessage}</span>
                  </p>
                )}
              </div>

              {/* Local orders list selector for user convenience */}
              {localOrders.length > 0 && !trackingResult && (
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-3">YOUR ACTIVE SECURE SESSIONS</p>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto no-scrollbar">
                    {localOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setTypedOrderId(order.id);
                          handleTrackSearch(order.id);
                        }}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-blue-500/20 rounded-xl transition-all text-left text-xs text-white"
                      >
                        <div className="font-mono font-bold tracking-wider">{order.id}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-mono">UGX {order.total?.toLocaleString()}</span>
                          <span className="text-[8.5px] uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-black">{order.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Demo Assist Prompt */}
              {!trackingResult && localOrders.length === 0 && (
                <div className="p-4 bg-blue-950/20 border border-blue-500/15 rounded-2xl mb-6">
                  <p className="text-[10.5px] text-blue-300 leading-relaxed font-normal">
                    💡 <span className="font-bold text-white">Interactive Demonstration</span>: Copy and paste <span className="font-mono bg-blue-900/30 text-white font-bold px-1.5 py-0.5 rounded border border-blue-400/20">SOLO-SAMPLE-UG</span> in the box above to preview the real-time logistics mapping engine!
                  </p>
                </div>
              )}

              {/* Live Tracking Result Showcase Graph */}
              {trackingResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  
                  {/* Summary Card */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[9px] font-mono font-black text-blue-500">PAYLOAD IDENTIFIER</span>
                      <h4 className="text-lg font-black font-mono text-white tracking-wider">{trackingResult.id}</h4>
                      <p className="text-[9.5px] text-gray-400 mt-0.5">Recipient: <span className="text-white font-bold">{trackingResult.customer_name}</span></p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl text-right sm:self-center">
                      <span className="text-[8.5px] font-black uppercase text-gray-500 block">EST. DEPLOYMENT</span>
                      <span className="text-xs font-mono font-black text-white">{trackingResult.estimated_delivery || "Calculating..."}</span>
                    </div>
                  </div>

                  {/* Shipment Progress Timeline Grid */}
                  <div className="space-y-4">
                    <p className="text-[9.5px] font-mono font-black text-gray-500 uppercase tracking-widest">Chronological Logistics Milestones</p>
                    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                      
                      {trackingResult.tracking_logs?.map((step: any, idx: number) => {
                        const isLast = idx === trackingResult.tracking_logs.length - 1;
                        return (
                          <div key={idx} className="relative">
                            
                            {/* Circle Node */}
                            <div className={`absolute -left-6 top-1.5 w-4.5 h-4.5 rounded-full border-2 border-[#0b0c10] flex items-center justify-center ${
                              isLast ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'
                            }`}>
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>

                            {/* Node Metadata content */}
                            <div>
                              <div className="flex gap-2 items-center">
                                <span className={`text-[10px] font-mono font-black uppercase tracking-wider ${
                                  isLast ? 'text-blue-400' : 'text-emerald-400'
                                }`}>
                                  {step.status}
                                </span>
                                <span className="text-[9px] font-mono text-gray-500">{step.timestamp}</span>
                              </div>
                              <p className="text-xs text-white leading-relaxed mt-0.5">{step.message}</p>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  </div>

                  {/* Device Payload List */}
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest mb-3">Manifest Payload Logs</p>
                    <div className="space-y-2">
                      {trackingResult.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-300 font-bold truncate max-w-[240px]">{item.name}</span>
                          <span className="text-blue-400 font-mono font-bold shrink-0">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
