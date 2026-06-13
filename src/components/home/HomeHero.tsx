import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Laptop, Headphones, Watch, ShieldCheck, 
  Truck, Star, Sparkles, ShoppingBag, ArrowRight, 
  ChevronRight, CheckCircle2, MapPin, Compass, Gamepad2, Loader2,
  Tv, Wifi, Camera, Cpu, Tag, Usb, Heart, Clock, AlertCircle, Sparkle
} from 'lucide-react';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { cn } from '../../lib/utils';

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

// Deterministic ratings
const getProductRating = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const ratingVal = 4.6 + (Math.abs(hash) % 4) / 10;
  return ratingVal.toFixed(1);
};

// Deterministic delivery
const getProductDelivery = (category: string): string => {
  if (category.toLowerCase().includes('phone') || category.toLowerCase().includes('tablet')) {
    return 'Same-Day Dispatch';
  }
  if (category.toLowerCase().includes('computer') || category.toLowerCase().includes('laptop')) {
    return '24hr Handover';
  }
  return 'Immediate Dispatch';
};

const getProductStockText = (stock: number | undefined): string => {
  const stockNum = stock !== undefined ? stock : 12;
  if (stockNum === 0) return 'Sold Out';
  return `${stockNum} Units Available`;
};

const getCategoryIcon = (cat: string) => {
  const norm = cat.toLowerCase();
  if (norm.includes('phone') || norm.includes('tablet')) return <Smartphone size={13} className="text-zinc-400 shrink-0" />;
  if (norm.includes('computer') || norm.includes('laptop')) return <Laptop size={13} className="text-zinc-400 shrink-0" />;
  if (norm.includes('gaming') || norm.includes('console')) return <Gamepad2 size={13} className="text-zinc-400 shrink-0" />;
  if (norm.includes('tv') || norm.includes('audio')) return <Headphones size={13} className="text-zinc-400 shrink-0" />;
  return <Sparkles size={13} className="text-zinc-400 shrink-0" />;
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
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recently_viewed');
      if (stored) {
        setRecentlyViewedIds(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const recentlyViewedProducts = useMemo(() => {
    if (!recentlyViewedIds.length || !products.length) return [];
    return recentlyViewedIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => !!p);
  }, [recentlyViewedIds, products]);

  // Premium flagship items for Apple-style presentation carousel on the right side
  const premiumShowcase = useMemo(() => {
    if (!products.length) return [];
    // Prioritize high-end smartphones, computers, watches
    const score = (p: Product) => {
      const name = p.name.toLowerCase();
      if (name.includes('iphone') || name.includes('macbook') || name.includes('watch') || name.includes('ultra') || name.includes('pro')) return 10;
      if (p.featured) return 5;
      return 1;
    };
    return [...products].sort((a, b) => score(b) - score(a)).slice(0, 4);
  }, [products]);

  // Auto-rotate the featured right showcase product
  useEffect(() => {
    if (premiumShowcase.length < 2) return;
    const interval = setInterval(() => {
      setActiveShowcaseIdx(prev => (prev + 1) % premiumShowcase.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [premiumShowcase]);

  const activeShowcaseProduct = premiumShowcase[activeShowcaseIdx];

  return (
    <div className="space-y-20 pb-32 bg-[#000000] text-white overflow-hidden relative">
      {/* Cinematic ambient radial flares - Apple style luxury lens */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-blue-500/[0.04] via-transparent to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[15%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/[0.015] blur-[200px] rounded-full pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-sky-500/[0.015] blur-[220px] rounded-full pointer-events-none" />

      {/* 1. HERO ARCHITECTURAL STAGE */}
      <section className="relative pt-20 md:pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT WRITER COLUMN (Occupies 35% on large screens) */}
          <div className="lg:col-span-5 text-left space-y-8">
            {/* Apple-style minimalist indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-zinc-900/40 border border-zinc-800/60 rounded-full backdrop-blur-xl">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                Lira Central Hub • In Stock
              </span>
            </div>

            {/* Headline: Maximum 6 words */}
            <h1 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-display font-medium tracking-tight text-white leading-[1.08]">
              Premium Sealed Electronics.<br />
              Delivered Direct.
            </h1>

            {/* Subheadline: Maximum 12 words */}
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-sans font-medium max-w-md">
              Authentic devices with physical 1-year guarantee shipped straight to Lira hubs.
            </p>

            {/* One primary CTA only */}
            <div className="flex pt-2">
              <button
                onClick={() => {
                  document.getElementById('tech-portfolio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-8 py-4 bg-white hover:bg-neutral-100 text-black font-semibold text-xs font-mono tracking-widest rounded-full active:scale-95 transition-all text-center flex items-center justify-center gap-3.5 shadow-2xl cursor-pointer"
              >
                DISCOVER THE PORTFOLIO
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-black" />
              </button>
            </div>

            {/* Compact Mobile Money Badges */}
            <div className="pt-4 border-t border-zinc-900/60 flex items-center gap-3">
              <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 uppercase">Local Escrow Active:</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 bg-[#FFCC00]/5 border border-[#FFCC00]/20 text-[#FFCC00] text-[8px] font-mono font-bold rounded-lg uppercase">MTN MoMo</span>
                <span className="px-2 py-1 bg-[#E60000]/5 border border-[#E60000]/20 text-[#E60000] text-[8px] font-mono font-bold rounded-lg uppercase">Airtel Money</span>
              </div>
            </div>
          </div>

          {/* RIGHT PRODUCT SHOWCASE (Occupies 65% - 70-80% visual attention) */}
          <div className="lg:col-span-7 relative h-[450px] sm:h-[520px] flex items-center justify-center">
            
            {/* Ambient Background Glow behind product */}
            <div className="absolute inset-0 bg-radial-gradient from-blue-600/[0.05] to-transparent blur-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
              {activeShowcaseProduct && (
                <motion.div
                  key={activeShowcaseProduct.id}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -15 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onProductClick(activeShowcaseProduct)}
                  className="relative w-full max-w-sm aspect-square bg-[#0c0c0f]/80 border border-zinc-900 rounded-[3rem] p-8 flex flex-col items-center justify-between shadow-[0_25px_60px_rgba(0,0,0,0.8)] cursor-pointer group focus:outline-none"
                >
                  {/* Subtle inner glass highlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[3rem] pointer-events-none" />

                  {/* Top Flagship row */}
                  <div className="w-full flex justify-between items-center z-10">
                    <span className="px-3 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                      {activeShowcaseProduct.category}
                    </span>
                    <span className="flex items-center gap-0.5 text-yellow-500 text-[10px] font-mono font-black">
                      <Star size={11} fill="currentColor" /> {getProductRating(activeShowcaseProduct.name)}
                    </span>
                  </div>

                  {/* Huge floating central product visual (Highly responsive and interactive) */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                    className="relative w-[75%] h-[60%] flex items-center justify-center my-4"
                  >
                    <img 
                      src={activeShowcaseProduct.image} 
                      alt={activeShowcaseProduct.name} 
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_45px_rgba(37,99,235,0.22)] select-none transform group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>

                  {/* Showcase Product Details */}
                  <div className="w-full text-center space-y-1.5 z-10">
                    <h3 className="text-base sm:text-lg font-display font-medium text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                      {activeShowcaseProduct.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-mono text-zinc-400">
                      UGX {activeShowcaseProduct.price.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SUBTLE FLOATING INFO CARDS (Absolutely positioned, floating around the center product) */}
            {/* 1. Fast Delivery */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.2 }}
              className="absolute -top-4 -left-2 sm:-left-6 p-3.5 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/70 rounded-2xl flex items-center gap-3 shadow-xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Truck size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[10.5px] font-bold text-white leading-none">Fast Delivery</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 whitespace-nowrap">24hr Region Transit</p>
              </div>
            </motion.div>

            {/* 2. Real-Time Tracking */}
            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-1/2 -left-6 sm:-left-12 p-3.5 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/70 rounded-2xl flex items-center gap-3 shadow-xl pointer-events-none select-none max-w-[180px]"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Wifi size={14} className="animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="text-[10.5px] font-bold text-white leading-none">Real-Time Tracking</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 whitespace-nowrap">Central Logistics Log</p>
              </div>
            </motion.div>

            {/* 3. MTN MoMo Escrow Setup */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 1.4 }}
              className="absolute top-[40%] -right-6 sm:-right-8 p-3.5 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/70 rounded-2xl flex items-center gap-3 shadow-xl pointer-events-none select-none max-w-[180px]"
            >
              <div className="w-8 h-8 rounded-xl bg-[#FFCC00]/10 border border-[#FFCC00]/20 flex items-center justify-center text-[#FFCC00] font-sans font-black text-xs shrink-0 select-none">
                M
              </div>
              <div className="text-left">
                <h4 className="text-[10.5px] font-bold text-white leading-none">MTN MoMo</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 whitespace-nowrap">Instant Escrow Pay</p>
              </div>
            </motion.div>

            {/* 4. Airtel Money */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 left-1/4 p-3.5 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/70 rounded-2xl flex items-center gap-3 shadow-xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-sans font-black text-xs shrink-0 select-none">
                A
              </div>
              <div className="text-left">
                <h4 className="text-[10.5px] font-bold text-white leading-none">Airtel Money</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 whitespace-nowrap">Secure Digital Pay</p>
              </div>
            </motion.div>

            {/* 5. Authentic Products */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1.1 }}
              className="absolute bottom-12 -right-4 sm:-right-10 p-3.5 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/70 rounded-2xl flex items-center gap-3 shadow-xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[10.5px] font-bold text-white leading-none">Authentic Tech</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-0.5 whitespace-nowrap">1-Year Sealed Warranty</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. DYNAMIC SHIELD SECTION: SECTOR CATEGORY TABS */}
      <section id="tech-portfolio" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-10 scroll-mt-24">
        
        {/* Category Header with Clean Apple aesthetic styling */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-900 pb-4 mb-8 gap-4 text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-zinc-500 uppercase">INVENTORY FEED</span>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight">
              {category ? `${category}` : "Explore the Portfolio"}
            </h2>
          </div>

          {/* Micro active count */}
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {category ? `${filteredProducts.length} Items Locked` : `${products.length} Units Online`}
          </span>
        </div>

        {/* Dynamic Category Selector */}
        <div className="mb-10 flex overflow-x-auto no-scrollbar gap-2.5 pb-2.5 border-b border-zinc-900/40 text-left">
          {/* All Sector block tag */}
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all text-xs font-medium tracking-wide shrink-0 border",
              category === null
                ? "bg-white text-black border-transparent shadow-lg shadow-white/5 font-semibold"
                : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            )}
          >
            <Compass size={13} />
            <span>All Sectors</span>
          </button>

          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategorySelect(cat)}
                className={cn(
                  "relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all text-xs font-medium tracking-wide shrink-0 border",
                  isActive
                    ? "bg-white text-black border-transparent shadow-lg shadow-white/5 font-semibold"
                    : "bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                )}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* 3. RECENTLY VIEWED CONTAINER */}
        {category === null && searchQuery === '' && recentlyViewedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 p-6 bg-zinc-950/40 border border-zinc-900 rounded-[2rem] space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-zinc-500" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Recently Viewed Units
                </h3>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950/80 border border-zinc-900 px-2 py-0.5 rounded-md">
                {recentlyViewedProducts.length} Cache Logged
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {recentlyViewedProducts.map((item) => (
                <div
                  key={`rec-${item.id}`}
                  onClick={() => onProductClick(item)}
                  className="group relative rounded-2xl bg-[#09090b] hover:bg-[#0c0c10] border border-zinc-900/60 p-3 flex flex-col justify-between h-48 transition-all duration-300 cursor-pointer"
                >
                  <div className="h-20 w-full flex items-center justify-center relative overflow-hidden my-1">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_6px_12px_rgba(255,255,255,0.05)] transform transition-transform duration-500 group-hover:scale-105 select-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1 text-left mt-auto">
                    <h4 className="text-[10.5px] font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {item.name}
                    </h4>
                    <span className="text-[9.5px] font-mono text-zinc-500">
                      UGX {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 4. PRIMARY FEED GRID */}
        {loadingProducts ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-zinc-500 mb-4" size={36} />
            <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">Syncing database feed...</p>
          </div>
        ) : (category || searchQuery) && filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center bg-zinc-950/40 border border-zinc-900 rounded-[2.5rem] relative overflow-hidden"
          >
             <div className="relative z-10 max-w-sm mx-auto space-y-6 px-4">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-display font-medium text-white">No items found</h3>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-xs mx-auto">
                  There are currently no products matching your search query or selected sector.
                </p>
              </div>
              <button 
                onClick={() => onCategorySelect(null)}
                className="py-3 px-6 bg-white hover:bg-neutral-100 text-black font-semibold text-xs rounded-full transition-all active:scale-95 cursor-pointer font-mono tracking-wider"
              >
                RESET SECTORS
              </button>
            </div>
          </motion.div>
        ) : category || searchQuery ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {filteredProducts.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => onProductClick(item)}
                className="group relative rounded-[2rem] bg-[#070709] border border-zinc-900/80 hover:border-zinc-700/60 p-6 flex flex-col justify-between h-[360px] transition-all duration-300 shadow-xl text-left cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-center z-10 mb-4">
                  <span className="px-2.5 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full text-[9px] font-mono text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">
                    {item.category}
                  </span>
                  <span className="flex items-center gap-0.5 text-yellow-500 text-[10.5px] font-mono font-black">
                    <Star size={11} fill="currentColor" /> {getProductRating(item.name)}
                  </span>
                </div>

                {/* Highly structured photography spot */}
                <div className="h-40 w-full flex items-center justify-center relative my-2 overflow-hidden bg-transparent rounded-2xl">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(255,255,255,0.03)] transform transition-transform duration-700 group-hover:scale-105 select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-4 z-10 mt-auto">
                  <div>
                    <h3 className="text-sm sm:text-base font-display font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1 select-none">
                      <span>{getProductDelivery(item.category)}</span>
                      <span className="text-emerald-400 font-bold uppercase">{getProductStockText(item.stock)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 border-t border-zinc-900/60 gap-3">
                    <div className="text-left font-mono">
                      <span className="text-[7.5px] text-zinc-500 block leading-none uppercase tracking-wider font-bold">UG RATE</span>
                      <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
                        UGX {item.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(item.id);
                        }}
                        className={cn(
                          "p-2 rounded-xl border transition-all active:scale-95 cursor-pointer",
                          isItemWishlisted(item.id)
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                        )}
                        title="Wishlist"
                      >
                        <Heart size={11} fill={isItemWishlisted(item.id) ? "currentColor" : "none"} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        className="py-2 px-3 bg-white hover:bg-neutral-100 text-black text-[10px] font-mono font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>ADD</span>
                        <ShoppingBag size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Standard Category blocks
          groupedMainProducts && !loadingProducts && (
            <div className="space-y-16">
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
                  <div key={cat} className="space-y-6 text-left">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                          {getCategoryIcon(cat)}
                        </div>
                        <h3 className="text-base sm:text-lg font-display font-medium text-white">
                          {cat}
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full">
                        {catProducts.length} Units Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                      {catProducts.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.01 }}
                          onClick={() => onProductClick(item)}
                          className="group relative rounded-[2rem] bg-[#070709] border border-zinc-900/80 hover:border-zinc-700/60 p-6 flex flex-col justify-between h-[360px] transition-all duration-300 shadow-xl text-left cursor-pointer overflow-hidden animate-reveal"
                        >
                          <div className="flex justify-between items-center z-10 mb-4">
                            <span className="px-2.5 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full text-[9px] font-mono text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">
                              {cat.split(' ')[0]}
                            </span>
                            <span className="flex items-center gap-0.5 text-yellow-500 text-[10.5px] font-mono font-black">
                              <Star size={11} fill="currentColor" /> {getProductRating(item.name)}
                            </span>
                          </div>

                          <div className="h-40 w-full flex items-center justify-center relative my-2 overflow-hidden bg-transparent rounded-2xl">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(255,255,255,0.03)] transform transition-transform duration-700 group-hover:scale-105 select-none"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="space-y-4 z-10 mt-auto">
                            <div>
                              <h3 className="text-sm sm:text-base font-display font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                                {item.name}
                              </h3>
                              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1 select-none">
                                <span>{getProductDelivery(item.category)}</span>
                                <span className="text-emerald-400 font-bold uppercase">{getProductStockText(item.stock)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3.5 border-t border-zinc-900/60 gap-3">
                              <div className="text-left font-mono">
                                <span className="text-[7.5px] text-zinc-500 block leading-none uppercase tracking-wider font-bold">UG RATE</span>
                                <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
                                  UGX {item.price.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleWishlist(item.id);
                                  }}
                                  className={cn(
                                    "p-2 rounded-xl border transition-all active:scale-95 cursor-pointer",
                                    isItemWishlisted(item.id)
                                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                                  )}
                                  title="Wishlist"
                                >
                                  <Heart size={11} fill={isItemWishlisted(item.id) ? "currentColor" : "none"} />
                                </button>

                                <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onAddToCart(item);
                                  }}
                                  className="py-2 px-3 bg-white hover:bg-neutral-100 text-black text-[10px] font-mono font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                >
                                  <span>ADD</span>
                                  <ShoppingBag size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          )
        )}
      </section>
    </div>
  );
}
