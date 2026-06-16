import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Laptop, Headphones, Watch, ShieldCheck, 
  Truck, Star, Sparkles, ShoppingBag, ArrowRight, 
  ChevronRight, CheckCircle2, MapPin, Compass, Gamepad2, Loader2,
  Tv, Wifi, Camera, Cpu, Tag, Usb, Heart, Clock, AlertCircle, Sparkle,
  Search, Shield, PhoneCall, BadgePercent, CheckCircle, Zap, HelpCircle
} from 'lucide-react';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { cn } from '../../lib/utils';
import { ProductCard } from '../shop/ProductCard';
import { OptimizedImage } from '../ui/OptimizedImage';

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
  onSearch?: (query: string) => void;
  t: any;
}

// WhatsApp icon SVG component helper
const WhatsAppIcon = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ width: size, height: size }} 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.022-.008-.115-.062-.272-.14-.08-.041-.268-.137-.358-.183-.09-.045-.155-.068-.22.031-.064.098-.25.314-.306.377-.056.062-.112.07-.22.031-.088-.044-.361-.133-.687-.424-.253-.226-.425-.506-.475-.591-.05-.084-.005-.13.038-.172.039-.038.08-.098.12-.147.04-.05.053-.085.08-.142.027-.057.013-.109-.007-.15-.02-.04-.155-.375-.213-.513-.057-.138-.114-.12-.156-.12-.04-.002-.087-.003-.135-.003-.048 0-.127.018-.193.088-.066.07-.254.248-.254.604 0 .357.259.702.295.751.036.049.51.777 1.235 1.09.173.074.308.118.414.152.173.055.33.047.454.028.138-.02 2.802-1.146 2.802-1.146.036-.046.072-.102.102-.156s.013-.105.007-.15-.022-.06-.051-.085zm-5.419 6.203h-.004a8.194 8.194 0 01-4.18-1.148l-.3-.178-3.1 1.018a.333.333 0 01-.42-.42l1.018-3.1-.178-.3a8.194 8.194 0 01-1.148-4.18C3.12 6.551 7.11 2.561 12 2.561c4.89 0 8.879 3.99 8.879 8.88 0 4.89-3.99 8.879-8.88 8.879l.063-.057zm0-16.791c-5.46 0-9.897 4.437-9.897 9.897 0 1.761.461 3.473 1.336 4.981l-.06-.102-1.42 4.33a.333.333 0 00.419.42l4.33-1.42.1.06a9.897 9.897 0 004.981 1.335h.001c5.46 0 9.897-4.437 9.897-9.897 0-5.46-4.437-9.897-9.897-9.897z" />
  </svg>
);

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
  onSearch,
  t 
}: HomeHeroProps) {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  
  // Clean continuous ticking countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hrs: '03', mins: '44', secs: '19' });
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const diffMs = endOfToday.getTime() - now.getTime();
      
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      
      setTimeLeft({
        hrs: hours.toString().padStart(2, '0'),
        mins: minutes.toString().padStart(2, '0'),
        secs: seconds.toString().padStart(2, '0')
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize dynamic updates to search box state
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

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
      .filter((p): p is Product => !!p)
      .slice(0, 4);
  }, [recentlyViewedIds, products]);

  // Premium flagship items representing different sectors for the rotating display slider
  const premiumShowcase = useMemo(() => {
    if (!products.length) return [];
    // Carefully select a balanced matrix representing Smartphones, Laptops, Smartwatches, Earbuds
    const smartphones = products.filter(p => p.category.toLowerCase().includes('phone') || p.name.toLowerCase().includes('galaxy') || p.name.toLowerCase().includes('iphone'));
    const laptops = products.filter(p => p.category.toLowerCase().includes('laptop') || p.category.toLowerCase().includes('computer'));
    const earbuds = products.filter(p => p.category.toLowerCase().includes('audio') || p.name.toLowerCase().includes('airpods') || p.name.toLowerCase().includes('headphone') || p.name.toLowerCase().includes('sony'));
    const otherFeatured = products.filter(p => p.featured || p.rating && p.rating >= 4.8);

    const items: Product[] = [];
    if (smartphones[0]) items.push(smartphones[0]);
    if (laptops[0]) items.push(laptops[0]);
    if (earbuds[0]) items.push(earbuds[0]);
    if (otherFeatured[1]) items.push(otherFeatured[1]);

    // Fallback if not populated
    return items.length >= 2 ? items : products.slice(0, 4);
  }, [products]);

  // Auto-rotate the featured right showcase product slowly
  useEffect(() => {
    if (premiumShowcase.length < 2) return;
    const interval = setInterval(() => {
      setActiveShowcaseIdx(prev => (prev + 1) % premiumShowcase.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [premiumShowcase]);

  const activeShowcaseProduct = premiumShowcase[activeShowcaseIdx];

  const handlePopularSearch = (term: string) => {
    setLocalSearch(term);
    onSearch?.(term);
    document.getElementById('tech-portfolio')?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearch?.('');
  };

  return (
    <div className="space-y-24 pb-32 bg-[#03030c] text-white overflow-hidden relative">
      {/* Background aesthetic glow grids */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-blue-500/[0.04] via-transparent to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[12%] left-[-10%] w-[550px] h-[550px] bg-blue-600/[0.02] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-[28%] right-[-10%] w-[550px] h-[550px] bg-indigo-500/[0.02] blur-[180px] rounded-full pointer-events-none" />

      {/* 1. HERO SECTION REDESIGN */}
      <section className="relative pt-24 md:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT COLUMN: Clean typography hierarchy (35% focus) */}
          <div className="lg:col-span-5 text-left space-y-7 xl:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">
                Uganda's Premier Tech Vault
              </span>
            </div>

            {/* Title is strictly 6 words maximum */}
            <h1 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5.5xl font-display font-medium tracking-tight text-white leading-[1.05]">
              Genuine Sealed Electronics.<br />
              Delivered Direct.
            </h1>

            {/* Value Proposition is exactly 1 clean line in standard body */}
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-sans font-medium max-w-md">
              Enjoy brand-new authentic products backed by physical warranties and local support desks.
            </p>

            <div className="flex pt-2 gap-4">
              <button
                onClick={() => {
                  document.getElementById('tech-portfolio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-7 py-3.5 bg-white hover:bg-neutral-100 text-black font-semibold text-xs font-mono tracking-widest rounded-full active:scale-95 transition-all text-center flex items-center justify-center gap-2.5 shadow-xl cursor-pointer"
              >
                EXPLORE CATALOG
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-black" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Large Interactive Slider (65% focus, occupies 70-80% visual focal weight) */}
          <div className="lg:col-span-7 relative h-[440px] sm:h-[500px] flex items-center justify-center">
            
            {/* Visual background platform */}
            <div className="absolute inset-0 bg-radial-gradient from-blue-600/[0.04] to-transparent blur-3xl pointer-events-none" />

            <AnimatePresence mode="wait">
              {activeShowcaseProduct && (
                <motion.div
                  key={activeShowcaseProduct.id}
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.04, y: -12 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onQuickView(activeShowcaseProduct)}
                  className="relative w-full max-w-md aspect-square bg-[#08090d]/85 border border-white/[0.04] hover:border-blue-500/30 rounded-[2.75rem] p-8 flex flex-col items-center justify-between shadow-[0_30px_70px_rgba(0,0,0,0.7)] cursor-pointer group select-none"
                >
                  {/* Glowing halo glass shadow */}
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none rounded-t-[2.75rem]" />

                  {/* Top Flagship row */}
                  <div className="w-full flex justify-between items-center z-10">
                    <span className="px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                      {activeShowcaseProduct.category}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 text-[10px] font-mono font-bold">
                      <Star size={11} className="fill-amber-400 text-amber-400" /> RECOMMENDED
                    </span>
                  </div>

                  {/* Large floating display representing devices */}
                  <motion.div 
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
                    className="relative w-[75%] h-[55%] flex items-center justify-center my-2"
                  >
                    <OptimizedImage 
                      src={activeShowcaseProduct.image} 
                      alt={activeShowcaseProduct.name} 
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_25px_40px_rgba(59,130,246,0.18)] transform group-hover:scale-[1.03] transition-transform duration-700"
                    />
                  </motion.div>

                  {/* Showcase Product details */}
                  <div className="w-full text-center space-y-1 z-10 bg-black/20 p-3 rounded-2xl border border-white/[0.02]">
                    <h3 className="text-sm sm:text-base font-display font-medium text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                      {activeShowcaseProduct.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-blue-400">
                      UGX {activeShowcaseProduct.price.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FLOATING TRUST BADGES: Strictly formatted with custom gravity effects for spatial depth */}
            {/* 1. Genuine Electronics */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.1 }}
              className="absolute -top-3 left-0 sm:-left-4 p-3 bg-zinc-950/90 backdrop-blur-xl border border-white/[0.04] rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[10px] font-bold text-white leading-none">Genuine Electronics</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 whitespace-nowrap">Official Guarantee</p>
              </div>
            </motion.div>

            {/* 2. Fast Delivery */}
            <motion.div 
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 4.4, ease: "easeInOut", delay: 0.8 }}
              className="absolute top-1/2 -left-6 sm:-left-10 p-3 bg-zinc-950/90 backdrop-blur-xl border border-white/[0.04] rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Truck size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[10px] font-bold text-white leading-none">Fast Delivery</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 whitespace-nowrap">Reliable Transit</p>
              </div>
            </motion.div>

            {/* 3. WhatsApp Support */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-[35%] -right-4 sm:-right-8 p-3 bg-zinc-950/90 backdrop-blur-xl border border-white/[0.04] rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <WhatsAppIcon size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[10px] font-bold text-white leading-none">WhatsApp Support</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 whitespace-nowrap">Instant Catalog Advice</p>
              </div>
            </motion.div>

            {/* 4. Secure Shopping */}
            <motion.div 
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 right-1/4 p-3 bg-zinc-950/90 backdrop-blur-xl border border-white/[0.04] rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-none select-none max-w-[170px]"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div className="text-left">
                <h4 className="text-[10px] font-bold text-white leading-none">Secure Shopping</h4>
                <p className="text-[8px] font-mono text-zinc-500 mt-1 whitespace-nowrap">Receipt Proof Verified</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>





      {/* 4. SEARCH & DISCOVERY UPGRADE */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-4">
        <div className="bg-[#08090e]/95 border border-white/[0.05] rounded-[3rem] p-6 sm:p-10 shadow-2xl relative text-left">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/[0.01] to-purple-600/[0.01] pointer-events-none rounded-[3rem]" />
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-blue-400 uppercase">SECURE SEARCH PLATFORM</span>
              <h2 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight">Looking for something specific?</h2>
              <p className="text-zinc-500 text-[11px]">Instant live matching across our verified Lira warehouses & direct brand imports</p>
            </div>

            {/* Immersive high contrast search input bar */}
            <div className="relative group/search">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/search:text-blue-400 transition-colors" size={18} />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalSearch(val);
                  onSearch?.(val);
                }}
                placeholder="Search smart devices, laptops, sound systems, accessories..."
                className="w-full bg-black/60 border border-white/[0.06] rounded-2.5xl py-4.5 pl-14 pr-12 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all font-mono placeholder:text-zinc-500"
              />
              {localSearch && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono font-bold text-zinc-500 hover:text-white transition-colors bg-white/5 border border-white/5 px-2 py-1 rounded"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Premium Suggestion & Popular searches Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-zinc-500 mr-2 uppercase tracking-wide">Popular searches:</span>
              {[
                "iPhone",
                "Samsung",
                "Infinix",
                "Tecno",
                "Laptops",
                "Smart Watches"
              ].map((term) => (
                <button
                  key={`trend-${term}`}
                  onClick={() => handlePopularSearch(term)}
                  className={cn(
                    "px-3.5 py-1.5 bg-[#12131a] active:scale-95 border rounded-full text-[10px] font-mono transition-all font-bold cursor-pointer",
                    localSearch.toLowerCase() === term.toLowerCase()
                      ? "border-blue-400 text-blue-400 bg-blue-500/[0.02]"
                      : "border-white/[0.04] text-zinc-400 hover:text-white hover:border-zinc-700"
                  )}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. PORTFOLIO & CATEGORIES FEED */}
      <section id="tech-portfolio" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 scroll-mt-24">
        
        {/* Dynamic header display */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/[0.06] pb-4 mb-8 gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-zinc-500 uppercase">DIRECT TECH CATALOG</span>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight">
              {category ? `${category}` : "Browse the Showroom"}
            </h2>
          </div>

          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950/80 border border-white/[0.04] px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 self-start sm:self-auto select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {category ? `${filteredProducts.length} Items Locked` : `${products.length} Units Online`}
          </span>
        </div>

        {/* Dynamic Category selectors */}
        <div className="mb-10 flex overflow-x-auto no-scrollbar gap-2.5 pb-2.5 border-b border-white/[0.03] text-left">
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all text-xs font-mono font-bold uppercase tracking-wider shrink-0 border cursor-pointer",
              category === null
                ? "bg-white text-black border-transparent shadow-lg shadow-white/5 font-semibold"
                : "bg-transparent border-white/[0.04] text-zinc-400 hover:text-white hover:border-zinc-700"
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
                  "relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all text-xs font-mono font-bold uppercase tracking-wider shrink-0 border cursor-pointer",
                  isActive
                    ? "bg-white text-black border-transparent shadow-lg shadow-white/5 font-italic"
                    : "bg-transparent border-white/[0.04] text-zinc-400 hover:text-white hover:border-zinc-700"
                )}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* RECENTLY VIEWED CONTAINER */}
        {category === null && searchQuery === '' && recentlyViewedProducts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 p-6 bg-zinc-950/40 border border-white/[0.03] rounded-3xl space-y-4 text-left shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-white/[0.02] pb-2">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-zinc-500" />
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Recently Viewed Units
                </h3>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950/80 border border-white/[0.02] px-2 py-0.5 rounded-md">
                {recentlyViewedProducts.length} Cache Logged
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentlyViewedProducts.map((item) => (
                <div
                  key={`rec-${item.id}`}
                  onClick={() => onProductClick(item)}
                  className="group relative rounded-2xl bg-[#08080c] hover:bg-[#0c0c12] border border-white/[0.04] p-3 flex flex-col justify-between h-48 transition-all duration-300 cursor-pointer"
                >
                  <div className="h-20 w-full flex items-center justify-center relative overflow-hidden my-1">
                    <OptimizedImage 
                      src={item.image} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_6px_12px_rgba(255,255,255,0.05)] transform transition-transform duration-500 group-hover:scale-105 select-none"
                    />
                  </div>
                  <div className="space-y-1 text-left mt-auto">
                    <h4 className="text-[10.5px] font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {item.name}
                    </h4>
                    <span className="text-[9.5px] font-mono text-zinc-500 font-bold block">
                      UGX {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FEED GRID USING REDESIGNED PRODUCT CARD */}
        {loadingProducts ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-zinc-500 mb-4" size={32} />
            <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">Synchronizing certified tech rates...</p>
          </div>
        ) : (category || searchQuery) && filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center bg-zinc-950/40 border border-white/[0.03] rounded-[2.5rem] relative overflow-hidden"
          >
             <div className="relative z-10 max-w-sm mx-auto space-y-6 px-4">
              <div className="w-12 h-12 bg-zinc-900 border border-white/[0.03] rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-display font-medium text-white">No products found</h3>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-xs mx-auto">
                  We currently do not have matching units in stock. Refine your query or check back later!
                </p>
              </div>
              <button 
                onClick={() => onCategorySelect(null)}
                className="py-3 px-6 bg-white hover:bg-neutral-100 text-black font-semibold text-xs rounded-full transition-all active:scale-95 cursor-pointer font-mono tracking-wider"
              >
                RESET FILTERS
              </button>
            </div>
          </motion.div>
        ) : (category || searchQuery) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {filteredProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onAddToCart={onAddToCart}
                onClick={() => onProductClick(item)}
                onQuickView={onQuickView}
                isWishlisted={isItemWishlisted(item.id)}
                onToggleWishlist={onToggleWishlist}
                isLiked={isItemLiked(item.id)}
                onToggleLike={onToggleLike}
              />
            ))}
          </div>
        ) : (
          // Segmented categorized visual blocks
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
                  <div key={cat} className="space-y-8 text-left">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#09090d] border border-white/[0.04] flex items-center justify-center text-zinc-400">
                          {getCategoryIcon(cat)}
                        </div>
                        <h3 className="text-base sm:text-lg font-display font-medium text-white">
                          {cat}
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 border border-white/[0.02] px-3 py-1 rounded-full font-bold">
                        {catProducts.length} UNITS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
                      {catProducts.map((item) => (
                        <ProductCard
                          key={item.id}
                          product={item}
                          onAddToCart={onAddToCart}
                          onClick={() => onProductClick(item)}
                          onQuickView={onQuickView}
                          isWishlisted={isItemWishlisted(item.id)}
                          onToggleWishlist={onToggleWishlist}
                          isLiked={isItemLiked(item.id)}
                          onToggleLike={onToggleLike}
                        />
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

const getCategoryIcon = (cat: string) => {
  const norm = cat.toLowerCase();
  if (norm.includes('phone') || norm.includes('tablet')) return <Smartphone size={13} className="text-zinc-400 shrink-0" />;
  if (norm.includes('computer') || norm.includes('laptop')) return <Laptop size={13} className="text-zinc-400 shrink-0" />;
  if (norm.includes('gaming') || norm.includes('console')) return <Gamepad2 size={13} className="text-zinc-400 shrink-0" />;
  if (norm.includes('tv') || norm.includes('audio')) return <Headphones size={13} className="text-zinc-400 shrink-0" />;
  return <Sparkles size={13} className="text-zinc-400 shrink-0" />;
};
