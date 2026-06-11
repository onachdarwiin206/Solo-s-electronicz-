import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, Laptop, Headphones, Watch, ShieldCheck, 
  Truck, Star, Sparkles, ShoppingBag, ArrowRight, 
  ChevronRight, CheckCircle2, MapPin, Compass, Gamepad2, Loader2
} from 'lucide-react';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';

interface HomeHeroProps {
  products: Product[];
  filteredProducts: Product[];
  groupedMainProducts: Record<string, Product[]> | null;
  loadingProducts: boolean;
  category: string | null;
  searchQuery: string;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onCategorySelect: (category: string | null) => void;
  isItemWishlisted: (id: string) => boolean;
  onToggleWishlist: (id: string) => void;
  isItemLiked: (id: string) => boolean;
  onToggleLike: (id: string) => void;
  t: any;
}

// Deterministic helper to generate lovely, consistent ratings for display products
const getProductRating = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const ratingVal = 4.5 + (Math.abs(hash) % 5) / 10;
  return ratingVal.toFixed(1);
};

// Deterministic helper to generate delivery statements
const getProductDelivery = (category: string): string => {
  if (category.toLowerCase().includes('phone') || category.toLowerCase().includes('tablet')) {
    return 'Same-day Dispatch';
  }
  if (category.toLowerCase().includes('computer') || category.toLowerCase().includes('laptop')) {
    return '24-hour Transit';
  }
  return 'Immediate Dispatch';
};

// Formatting helper for dynamic stock text
const getProductStockText = (stock: number | undefined): string => {
  const stockNum = stock !== undefined ? stock : 15;
  if (stockNum === 0) return 'Sold Out';
  return `${stockNum} Units Left`;
};

export function HomeHero({ 
  products, 
  filteredProducts,
  groupedMainProducts,
  loadingProducts,
  category,
  searchQuery,
  onAddToCart, 
  onProductClick, 
  onQuickView,
  onCategorySelect,
  isItemWishlisted,
  onToggleWishlist,
  isItemLiked,
  onToggleLike,
  t 
}: HomeHeroProps) {
  const [trackingId, setTrackingId] = useState('');
  const [showLiveTrackingLogs, setShowLiveTrackingLogs] = useState(false);

  // Dynamically merge/derive the 6 curated showcase products directly from the actual backend/Supabase database!
  const showcaseProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // 1. Prioritize database products explicitly marked featured (from Supabase or INITIAL fallbacks)
    const featured = products.filter(p => p.featured);
    if (featured.length >= 6) {
      return featured.slice(0, 6);
    }
    
    // 2. Pad to ensure exactly 6 flagship slots are gracefully occupied in the visual portfolio
    const seenIds = new Set(featured.map(f => f.id));
    const rest = products.filter(p => !seenIds.has(p.id));
    return [...featured, ...rest].slice(0, 6);
  }, [products]);

  const handleTrackingDemo = (id: string) => {
    setTrackingId(id);
    setShowLiveTrackingLogs(true);
    setTimeout(() => {
      document.getElementById('live-logistics-radar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="space-y-24 pb-20 overflow-hidden bg-[#000000] font-sans relative">
      {/* Premium ambient radial lens flares */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-gradient-to-b from-blue-600/[0.04] via-transparent to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/[0.02] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-blue-500/[0.02] blur-[180px] rounded-full pointer-events-none" />

      {/* 1. VISUAL-FIRST E-COMMERCE STAGE */}
      <section className="relative pt-24 sm:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
              
              {/* LEFT WRITER COLUMN (30% Visual Weight of Grid) */}
              <div className="lg:col-span-4 text-left space-y-6 lg:sticky lg:top-28">
                
                {/* Sealed Indicator Alert Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-full backdrop-blur-md">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">
                    UGANDA STATION // BRAND NEW HUBS
                  </span>
                </div>

                {/* Headline: Max 6 Words */}
                <h1 className="text-3vw sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl font-display font-medium text-white tracking-tight leading-tight">
                  Premium Sealed Electronics. <br />Direct Delivery.
                </h1>

                {/* Subheadline: Max 12 Words */}
                <p className="text-xs sm:text-sm text-gray-400 leading-normal font-sans font-medium max-w-md">
                  Authentic hardware with 1-Year warranty shipped directly to Lira hubs.
                </p>

                {/* Only One Primary CTA & One Optional Secondary CTA */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-stretch xl:items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      document.getElementById('tech-inventory')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-4 bg-white hover:bg-neutral-100 text-black font-semibold text-xs font-mono tracking-widest rounded-2xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(255,255,255,0.1)] w-full cursor-pointer"
                  >
                    SHOP NOW
                    <ShoppingBag size={14} className="text-black" />
                  </button>
                </div>

                {/* Floating Trust Cards Stack - Highly styled e-commerce credentials */}
                <div className="space-y-3 pt-6">
                  
                  {/* Double combined payment security indicators (MTN Yellow / Airtel Red) */}
                  <div className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-500 uppercase font-black">LOCAL PAYMENT ESCROW:</span>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-[#FFCC00]/10 border border-[#FFCC00]/20 text-[#FFCC00] text-[8.5px] font-mono font-bold rounded-md flex items-center gap-1 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00]" /> MTN MOBILE MONEY
                      </div>
                      <span className="text-white/10 text-xs font-mono">|</span>
                      <div className="px-2 py-0.5 bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF0000] text-[8.5px] font-mono font-bold rounded-md flex items-center gap-1 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000]" /> AIRTEL MONEY
                      </div>
                    </div>
                  </div>

                  {/* Individual responsive trust badges with mini layout grids */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex flex-col justify-between text-left group hover:border-white/10 transition-colors">
                      <ShieldCheck size={16} className="text-blue-400" />
                      <p className="text-[10.5px] text-white font-bold mt-2">Authentic Products</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">1-Year Sealed Warranty</p>
                    </div>

                    <div className="p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex flex-col justify-between text-left group hover:border-white/10 transition-colors">
                      <Truck size={16} className="text-indigo-400" />
                      <p className="text-[10.5px] text-white font-bold mt-2">Fast Delivery</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">24hr Regional Transit</p>
                    </div>
                  </div>

                </div>

              </div>

              {/* RIGHT PRODUCT GRID COLUMN (70% Visual Weight of Grid) - NOW ACTING AS THE MAIN INVENTORY SECTION */}
              <section id="tech-inventory" className="lg:col-span-8 scroll-mt-24 space-y-6">
                
                {/* Visual Header above grid */}
                <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
                  <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase font-black">
                    {category 
                      ? `ACTIVE SECTOR // ${category.toUpperCase()}` 
                      : searchQuery 
                        ? `SEARCH RESULTS // "${searchQuery.toUpperCase()}"` 
                        : "PREMIUM FLAGSHIP PORTFOLIO // IMMEDIATE INVENTORY"
                    }
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 100% In-Stock
                  </span>
                </div>

                {/* Dynamic Product Grid listing */}
                {(category || searchQuery) && filteredProducts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-24 text-center bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl"
                  >
                     <div className="absolute inset-0 bg-blue-600/5 animate-pulse" />
                     <div className="relative z-10 max-w-sm mx-auto space-y-6 px-4">
                      <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                        <ShieldCheck className="text-blue-500" size={32} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Sector Offline</h3>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          No hardware was found matching your selection in this sector.
                        </p>
                      </div>
                      <button 
                        onClick={() => onCategorySelect(null)}
                        className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase italic rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer"
                      >
                        Reset Hardware Feed
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 xl:gap-5">
                    {(category || searchQuery ? filteredProducts : showcaseProducts).map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => onProductClick(item)}
                        className="group relative rounded-3xl bg-white/[0.01] border border-white/[0.04] hover:border-blue-500/30 p-4 flex flex-col justify-between h-72 transition-all duration-300 shadow-2xl overflow-hidden text-left cursor-pointer"
                      >
                        {/* Subtle glass hover glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {/* Top Row: Category Label and Rating Badge */}
                        <div className="flex justify-between items-center z-10">
                          <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-md text-[8.5px] font-mono text-gray-400 tracking-wider font-extrabold uppercase truncate max-w-[80px]">
                            {item.category.split(' & ')[0]}
                          </span>
                          <span className="flex items-center gap-0.5 text-yellow-500 text-[9.5px] font-mono font-black">
                            <Star size={10} fill="currentColor" /> {getProductRating(item.name)}
                          </span>
                        </div>

                        {/* Central Display: High-resolution picture */}
                        <div className="h-32 w-full flex items-center justify-center relative my-2 overflow-hidden bg-transparent rounded-2xl border border-white/[0.01]">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_25px_rgba(37,99,235,0.15)] transform transition-transform duration-500 group-hover:scale-105 select-none"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 pointer-events-none" />
                        </div>

                        {/* Bottom Row Detailing Name, Logistics, Currency and Actions */}
                        <div className="space-y-3 z-10">
                          <div>
                            <h3 className="text-xs sm:text-sm font-semibold font-display text-white group-hover:text-blue-400 transition-colors truncate">
                              {item.name}
                            </h3>
                            <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mt-0.5">
                              <span className="truncate">{getProductDelivery(item.category)}</span>
                              <span className="text-emerald-500 font-bold uppercase shrink-0">{getProductStockText(item.stock)}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/[0.03] gap-2">
                            <div className="text-left font-mono">
                              <span className="text-[7.5px] text-gray-500 block leading-none uppercase">UG VALUE</span>
                              <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap">
                                UGX {item.price.toLocaleString()}
                              </span>
                            </div>

                            {/* Immediate Add To Cart action trigger */}
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart(item);
                              }}
                              className="p-1 px-2.5 bg-white hover:bg-neutral-200 text-black text-[9px] font-mono font-bold rounded-lg transition-all active:scale-90 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              BUY
                              <ShoppingBag size={9} />
                            </button>
                          </div>
                        </div>

                      </motion.div>
                    ))}
                  </div>
                )}

              </section>

            </div>

          </section>

          {/* 2. INSTANT PRODUCT CATEGORY SHORTCUTS BAR */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="p-1 border-t border-b border-white/[0.04]">
              <div className="flex items-center overflow-x-auto no-scrollbar gap-2.5 py-4 bg-transparent text-left -mx-4 px-4 sm:mx-0 sm:px-0">
                {/* All Sectors Tab */}
                <button
                  onClick={() => onCategorySelect(null)}
                  className={`relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all duration-300 group cursor-pointer outline-none text-xs font-semibold tracking-wide shrink-0 border ${
                    category === null
                      ? "text-blue-400 border-blue-500/30"
                      : "bg-white/[0.01]/80 border-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  {category === null && (
                    <motion.div
                      layoutId="active-hero-tab"
                      className="absolute inset-0 bg-blue-500/10 rounded-full z-0 border border-blue-500/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Compass size={14} className={`relative z-10 ${category === null ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  <span className="relative z-10">All Sectors</span>
                </button>

                {/* Dynamic Category Tabs */}
                {PRODUCT_CATEGORIES.map((cat) => {
                  const isActive = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => onCategorySelect(cat)}
                      className={`relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all duration-300 group cursor-pointer outline-none text-xs font-semibold tracking-wide shrink-0 border ${
                        isActive
                          ? "text-blue-400 border-blue-500/30"
                          : "bg-white/[0.01]/80 border-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-hero-tab"
                          className="absolute inset-0 bg-blue-500/10 rounded-full z-0 border border-blue-500/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-center shrink-0">
                        {cat.includes('Phones') && <Smartphone size={14} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />}
                        {cat.includes('Computers') && <Laptop size={14} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />}
                        {cat.includes('TVs') && <Headphones size={14} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />}
                        {cat.includes('Gaming') && <Gamepad2 size={14} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />}
                        {(!cat.includes('Phones') && !cat.includes('Computers') && !cat.includes('TVs') && !cat.includes('Gaming')) && <Watch size={14} className={isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'} />}
                      </div>
                      <span className="relative z-10">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

      {!category && !searchQuery && (
        <>
          {/* 3. THE DYNAMIC HARDWARE INVENTORY FEED (FORMERLY #TECH-INVENTORY) */}
          <section id="hardware-catalog-sectors" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex justify-between items-end mb-6 border-b border-white/[0.04] pb-3 text-left">
               <div className="space-y-1">
                 <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase font-black">
                   HARDWARE RECON
                 </span>
                 <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-none">
                   Hardware Feed
                 </h2>
               </div>
               <div className="flex items-center gap-4">
                  {loadingProducts && <Loader2 size={16} className="animate-spin text-blue-500" />}
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {filteredProducts.length} Results
                  </span>
               </div>
            </div>

            {groupedMainProducts && !loadingProducts && (
              <div className="space-y-12">
                {Object.entries(groupedMainProducts)
                  .sort(([a], [b]) => {
                    const idxA = PRODUCT_CATEGORIES.indexOf(a as any);
                    const idxB = PRODUCT_CATEGORIES.indexOf(b as any);
                    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                  })
                  .map(([cat, catProducts]) => (
                  <motion.section 
                    key={cat} 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="space-y-6 text-left"
                  >
                    <div className="flex items-center gap-6 group">
                      <div className="flex flex-col">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-500 transition-colors leading-none">{cat}</h3>
                        <div className="flex items-center gap-2 mt-1.5 font-mono">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{catProducts.length} Units Active</span>
                        </div>
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                      <button 
                        onClick={() => onCategorySelect(cat)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-white hover:bg-blue-600/20 transition-all shadow-xl cursor-pointer"
                      >
                        View Full Sector →
                      </button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-10">
                      {catProducts.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-100px" }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => onProductClick(item)}
                          className="group relative rounded-3xl bg-white/[0.01] border border-white/[0.04] hover:border-blue-500/30 p-4 flex flex-col justify-between h-72 transition-all duration-300 shadow-2xl overflow-hidden text-left cursor-pointer"
                        >
                          {/* Subtle glass hover glow */}
                          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                          {/* Top Row: Category Label and Rating Badge */}
                          <div className="flex justify-between items-center z-10">
                            <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-md text-[8.5px] font-mono text-gray-400 tracking-wider font-extrabold uppercase truncate max-w-[80px]">
                              {item.category.split(' & ')[0]}
                            </span>
                            <span className="flex items-center gap-0.5 text-yellow-500 text-[9.5px] font-mono font-black">
                              <Star size={10} fill="currentColor" /> {getProductRating(item.name)}
                            </span>
                          </div>

                          {/* Central Display: High-resolution picture */}
                          <div className="h-32 w-full flex items-center justify-center relative my-2 overflow-hidden bg-transparent rounded-2xl border border-white/[0.01]">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_25px_rgba(37,99,235,0.15)] transform transition-transform duration-500 group-hover:scale-105 select-none"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 pointer-events-none" />
                          </div>

                          {/* Bottom Row Detailing Name, Logistics, Currency and Actions */}
                          <div className="space-y-3 z-10">
                            <div>
                              <h3 className="text-xs sm:text-sm font-semibold font-display text-white group-hover:text-blue-400 transition-colors truncate">
                                {item.name}
                              </h3>
                              <div className="flex items-center justify-between text-[9px] font-mono text-gray-500 mt-0.5">
                                <span className="truncate">{getProductDelivery(item.category)}</span>
                                <span className="text-emerald-500 font-bold uppercase shrink-0">{getProductStockText(item.stock)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.03] gap-2">
                              <div className="text-left font-mono">
                                <span className="text-[7.5px] text-gray-500 block leading-none uppercase">UG VALUE</span>
                                <span className="text-[11px] sm:text-xs font-black text-white whitespace-nowrap">
                                  UGX {item.price.toLocaleString()}
                                </span>
                              </div>

                              {/* Immediate Add To Cart action trigger */}
                              <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart(item);
                                }}
                                className="p-1 px-2.5 bg-white hover:bg-neutral-200 text-black text-[9px] font-mono font-bold rounded-lg transition-all active:scale-90 flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                BUY
                                <ShoppingBag size={9} />
                              </button>
                            </div>
                          </div>

                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                ))}

                {/* Category Quick Badges footer */}
                <div className="py-10 border-t border-white/10">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 text-center mb-4">Direct Sector Access</p>
                   <div className="flex flex-wrap justify-center gap-3">
                      {PRODUCT_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => onCategorySelect(cat)}
                          className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer"
                        >
                          {cat}
                        </button>
                      ))}
                   </div>
                </div>

              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
