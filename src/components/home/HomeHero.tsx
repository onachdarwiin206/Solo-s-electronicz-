import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Laptop, Gamepad2, Tv, Headphones, Watch, 
  ShieldCheck, Truck, Star, Sparkles, ShoppingBag, ArrowRight,
  ChevronRight, ArrowUpRight, Search, Zap, CheckCircle2, MapPin
} from 'lucide-react';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { cn } from '../../lib/utils';
import { OrderTracking } from '../shop/OrderTracking';

interface HomeHeroProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onCategorySelect: (category: string | null) => void;
  t: any;
}

export function HomeHero({ 
  products, 
  onAddToCart, 
  onProductClick, 
  onQuickView,
  onCategorySelect,
  t 
}: HomeHeroProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'tracking'>('features');
  const [trackingId, setTrackingId] = useState('');
  const [showLiveTrackingLogs, setShowLiveTrackingLogs] = useState(false);

  // Take first 3 featured products to show as a floating showcase card
  const showcaseProducts = products.filter(p => p.featured).slice(0, 3);
  const [currentShowcaseIdx, setCurrentShowcaseIdx] = useState(0);
  const activeShowcase = showcaseProducts[currentShowcaseIdx] || products[0];

  const handleTrackingDemo = (id: string) => {
    setTrackingId(id);
    setShowLiveTrackingLogs(true);
    // Smooth scroll to the live tracker
    setTimeout(() => {
      document.getElementById('live-logistics-radar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="space-y-36 pb-20 overflow-hidden bg-[#000000]">
      {/* Absolute background accent meshes */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/[0.04] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-[600px] h-[600px] bg-indigo-600/[0.03] blur-[180px] rounded-full pointer-events-none" />

      {/* 1. HERO SECTION (35% Apple, 25% Stripe, 20% Linear) */}
      <section className="relative pt-32 sm:pt-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-full backdrop-blur-md"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                Solo Sourcing Hub: Connected & Ready
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-semibold tracking-tight text-white leading-[1.05]">
                Premium Devices. <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-white">
                  Logistics Redefined.
                </span>
              </h1>
              <p className="max-w-xl text-base sm:text-lg text-gray-400 font-medium leading-relaxed font-sans">
                Authentic laptops, smartphones, and consoles directly sourced for Uganda. Track your order down to Lira City with military-grade dispatch precision.
              </p>
            </motion.div>

            {/* Dual CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap gap-4 pt-1"
            >
              <button
                onClick={() => {
                  document.getElementById('tech-inventory')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-white text-black font-semibold text-sm rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] flex items-center gap-2 group cursor-pointer"
              >
                Explore Catalog
                <ShoppingBag size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => {
                  document.getElementById('live-logistics-radar')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-white/[0.02] border border-white/[0.05] hover:border-white/10 hover:bg-white/[0.04] text-white font-semibold text-sm rounded-2xl active:scale-95 transition-all flex items-center gap-2 group"
              >
                Track Active Order
                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>

            {/* Trust Indicator Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pt-6 border-t border-white/[0.04] grid grid-cols-3 gap-4"
            >
              <div>
                <p className="text-xl sm:text-2xl font-semibold font-display text-white">100%</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-0.5">Verified Genuine</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-semibold font-display text-white">12-Mo</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-0.5">Assurance Cover</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-semibold font-display text-white">CoD</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-0.5">Deposit on Pickup</p>
              </div>
            </motion.div>
          </div>

          {/* Right Product Spotlight Column */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="p-8 rounded-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] shadow-[0_24px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group"
            >
              {/* Dynamic spotlight product */}
              {activeShowcase && (
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center pb-4 border-b border-white/[0.04]">
                    <span className="text-[10px] font-mono tracking-widest text-blue-400 font-bold uppercase">HOT PORTFOLIO DEPLOYMENT</span>
                    <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[8.5px] font-mono font-black uppercase tracking-wider">FEATURED</span>
                  </div>

                  {/* Product Image */}
                  <div 
                    onClick={() => onProductClick(activeShowcase)}
                    className="aspect-square bg-white/[0.01] rounded-2xl overflow-hidden border border-white/[0.04] relative group/showcase cursor-pointer"
                  >
                    <img 
                      src={activeShowcase.image} 
                      alt={activeShowcase.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/showcase:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex justify-between items-end opacity-0 group-hover/showcase:opacity-100 transition-opacity">
                      <span className="text-[10px] font-mono text-white/50">CLICK FOR THE DOSSIER</span>
                      <ArrowUpRight size={16} className="text-white" />
                    </div>
                  </div>

                  {/* Title & Technical Specs */}
                  <div className="text-left space-y-1">
                    <h3 className="text-lg font-display font-medium text-white truncate">{activeShowcase.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1 h-4">{activeShowcase.description}</p>
                    <div className="pt-2 flex justify-between items-center">
                      <p className="text-base sm:text-lg font-mono font-bold text-white">UGX {activeShowcase.price.toLocaleString()}</p>
                      
                      {/* Swipe dots */}
                      <div className="flex gap-1.5">
                        {showcaseProducts.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentShowcaseIdx(idx)}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all outline-none",
                              idx === currentShowcaseIdx ? "bg-white w-4" : "bg-white/20"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fast Action */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => onAddToCart(activeShowcase)}
                      className="w-full py-3 bg-white hover:bg-white/90 text-black font-bold text-xs rounded-xl active:scale-95 transition-all outline-none"
                    >
                      Instant Buy
                    </button>
                    <button 
                      onClick={() => onQuickView(activeShowcase)}
                      className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.06] text-white border border-white/[0.05] font-bold text-xs rounded-xl active:scale-95 transition-all outline-none"
                    >
                      Detailed View
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Subtle Logistics Status Floater */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-8 -left-12 p-4 bg-black/80 backdrop-blur-xl border border-white/[0.05] rounded-2xl hidden md:flex items-center gap-3 shadow-2xl z-20 max-w-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Truck size={14} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-semibold text-white">Lira Dispatch Active</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest">3 Cargo Fleets in Transit</p>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 2. TRUST LAYER & CORE PROMISES */}
      <section className="bg-white/[0.01] border-y border-white/[0.03] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white leading-tight">100% Genuine</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-normal font-medium">Direct factory sealed units with certifications.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white leading-tight">Secure Freight</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-normal font-medium">From Kampala Central directly to Lira hubs safely.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Star size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white leading-tight">1-Year Warranty</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-normal font-medium">Direct diagnostic desk for secure assurance replacement.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white leading-tight">Deposit Cover</h4>
              <p className="text-[10.5px] text-gray-500 mt-1 leading-normal font-medium">Cash on delivery supported for all pickup hubs.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MEASURABLE PERFORMANCE METRICS (Bento Grid Why Choose Solo) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase">MEASURABLE VALUE</span>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">The Solo Performance Standard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Bento Box 1: Sourced scale */}
          <div className="md:col-span-3 p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl relative overflow-hidden text-left flex flex-col justify-between h-64 group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] blur-2xl group-hover:bg-blue-500/[0.05] transition-all" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">UNITS DISPATCHED</span>
              <Sparkles size={16} className="text-blue-400" />
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-mono font-bold text-white tracking-tight">24,500+</p>
              <h3 className="text-base font-display font-medium text-white">Authentic Electronics Delivered</h3>
              <p className="text-xs text-gray-500 leading-normal">Every single unit verified for quality at the central Kampala desk prior to regional routing.</p>
            </div>
          </div>

          {/* Bento Box 2: Sourcing rating */}
          <div className="md:col-span-3 p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl relative overflow-hidden text-left flex flex-col justify-between h-64 group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] blur-2xl group-hover:bg-indigo-500/[0.05] transition-all" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">SATISFACTION RATING</span>
              <Star size={16} className="text-yellow-500" fill="currentColor" />
            </div>
            <div className="space-y-2">
              <p className="text-5xl font-mono font-bold text-white tracking-tight">99.4%</p>
              <h3 className="text-base font-display font-medium text-white">Trust Assurance Clear Log</h3>
              <p className="text-xs text-gray-500 leading-normal">Our customers across Northern and Central Uganda depend on Solo for consistent quality, hardware replacement, and warranty coverage.</p>
            </div>
          </div>

          {/* Bento Box 3: Logistics dispatch speed */}
          <div className="md:col-span-2 p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl relative overflow-hidden text-left flex flex-col justify-between h-64 group hover:border-white/10 transition-colors">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">DISPATCH METRIC</span>
            <div className="space-y-1">
              <p className="text-4xl font-mono font-bold text-white tracking-tight">24 Hrs</p>
              <h4 className="text-sm font-display font-medium text-white">Standard Delivery</h4>
              <p className="text-[11px] text-gray-500 leading-normal">Rapid transit for in-stock inventory straight to pickup points in Lira City.</p>
            </div>
          </div>

          {/* Bento Box 4: Verified coverage */}
          <div className="md:col-span-2 p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl relative overflow-hidden text-left flex flex-col justify-between h-64 group hover:border-white/10 transition-colors">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">COMPLIANCE CODE</span>
            <div className="space-y-1">
              <p className="text-4xl font-mono font-bold text-white tracking-tight">100%</p>
              <h4 className="text-sm font-display font-medium text-white">Brand Sealed Guarantee</h4>
              <p className="text-[11px] text-gray-500 leading-normal">Zero refurbished or counterfeit items. Only official Ugandan retail imports.</p>
            </div>
          </div>

          {/* Bento Box 5: Active customers */}
          <div className="md:col-span-2 p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl relative overflow-hidden text-left flex flex-col justify-between h-64 group hover:border-white/10 transition-colors">
            <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase">ACTIVE STATIONS</span>
            <div className="space-y-1">
              <p className="text-4xl font-mono font-bold text-white tracking-tight">5,000+</p>
              <h4 className="text-sm font-display font-medium text-white">Active Users Secure Pool</h4>
              <p className="text-[11px] text-gray-500 leading-normal">Serving engineers, students, families, and businesses with authentic tech portfolios daily.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTORS GRID (Interactive Category Explorer) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase">QUICK PORTFOLIOS</span>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">Deploy Category Segments</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRODUCT_CATEGORIES.slice(0, 10).map((cat) => (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className="p-6 bg-white/[0.01] border border-white/[0.04] rounded-3xl text-left hover:border-white/10 hover:bg-white/[0.02] active:scale-95 transition-all outline-none font-sans group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/[0.01] group-hover:bg-blue-500/[0.04] blur-xl" />
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] group-hover:border-white/10 flex items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors mb-4">
                <Smartphone size={16} />
              </div>
              <h3 className="text-sm font-display font-bold text-white tracking-tight">{cat}</h3>
              <p className="text-[9.5px] font-mono text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-1 group-hover:text-white transition-colors">
                Connect Desk <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* 5. LIVE TRACKING LOGISTICS SHOWCASE */}
      <section id="live-logistics-radar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase">REAL-TIME LOGISTICS CONTROL</span>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">Active Freight Registry</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Input a past order ID or launch a simulated diagnostic to run the full logistics cockpit.
          </p>
        </div>

        {/* Diagnostic Simulator Cards next to active tracking widget */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Quick Mock Demos */}
          <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] text-left flex flex-col justify-between space-y-6 lg:col-span-1">
            <div>
              <span className="text-[#2563eb] text-[10px] font-mono tracking-widest font-black uppercase">DIAGNOSTIC SIMULATOR</span>
              <h3 className="text-lg font-display font-bold text-white mt-2">Simulated Freight Logs</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Run simulated real-time telemetry representing active shipments crossing Uganda.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleTrackingDemo('SOLO-KAMPALA-881A')}
                className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-xl text-left hover:border-blue-500/30 transition-all font-mono group"
              >
                <div>
                  <p className="text-[10px] font-bold text-white">#SOLO-KAMPALA-881A</p>
                  <p className="text-[8.5px] text-blue-400 mt-0.5 uppercase tracking-wide">Status: TRANSIT TO LIRA</p>
                </div>
                <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={() => handleTrackingDemo('SOLO-LIRA-45C')}
                className="w-full flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] rounded-xl text-left hover:border-blue-500/30 transition-all font-mono group"
              >
                <div>
                  <p className="text-[10px] font-bold text-white">#SOLO-LIRA-45C</p>
                  <p className="text-[8.5px] text-green-400 mt-0.5 uppercase tracking-wide">Status: ARRIVED HUB</p>
                </div>
                <ChevronRight size={14} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Active Tracker Dashboard Mounting */}
          <div className="lg:col-span-3">
            <OrderTracking initialOrderId={trackingId || 'SOLO-SIMULATED-FREIGHT'} />
          </div>

        </div>
      </section>

      {/* 6. VERIFIED CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase font-black">STATION VERIFICATIONS</span>
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">Active Customer Feedback</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl text-left flex flex-col justify-between space-y-6">
            <div className="flex text-amber-500 gap-1"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
            <p className="text-sm italic font-medium font-serif text-gray-300 leading-relaxed">
              "Solo's tracking tool is awesome. I could see the exact time my MacBook Pro M3 passed the central check to dispatch for Lira. 12 month warranty was pre-printed on my WhatsApp receipt too."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-mono font-bold text-xs text-blue-400 shrink-0">
                EO
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">Emmanuel Okello <CheckCircle2 size={12} className="text-emerald-500" /></h4>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Purchased MacBook Pro M3</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl text-left flex flex-col justify-between space-y-6">
            <div className="flex text-amber-500 gap-1"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
            <p className="text-sm italic font-medium font-serif text-gray-300 leading-relaxed">
              "Buying phones in Uganda is usually stressful due to counterfeits. Solo's inventory verified as 100% genuine right out of the box. Delivery to Lira was within 24 hours. Verified importer channel is solid."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-xs text-indigo-400 shrink-0">
                JA
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">Janet Akello <CheckCircle2 size={12} className="text-emerald-500" /></h4>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Purchased Galaxy S24 Ultra</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl text-left flex flex-col justify-between space-y-6">
            <div className="flex text-amber-500 gap-1"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
            <p className="text-sm italic font-medium font-serif text-gray-300 leading-relaxed">
              "Extremely smooth procurement process. I requested a live chat on WhatsApp first, their agent cleared my spec questions instantly. Unit arrived in perfect sealed condition with brand accessories."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-white/[0.04]">
              <div className="w-10 h-10 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center font-mono font-bold text-xs text-purple-400 shrink-0">
                DO
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">Dennis Odongo <CheckCircle2 size={12} className="text-emerald-500" /></h4>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Purchased Sony WH-1000XM5</p>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
