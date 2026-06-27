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
      .slice(0, 12);
  }, [recentlyViewedIds, products]);

  const repeatedViewed = useMemo(() => {
    if (!recentlyViewedProducts.length) return [];
    let list = [...recentlyViewedProducts];
    while (list.length < 10) {
      list = [...list, ...recentlyViewedProducts];
    }
    return [...list, ...list];
  }, [recentlyViewedProducts]);

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

  const marqueeProducts = useMemo(() => {
    if (!products.length) return [];
    return products.filter(p => p.featured || (p.rating && p.rating >= 4.7)).slice(0, 10);
  }, [products]);

  const repeatedProducts = useMemo(() => {
    if (!marqueeProducts.length) return [];
    return [...marqueeProducts, ...marqueeProducts];
  }, [marqueeProducts]);

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
    <div className="space-y-24 pb-32 bg-transparent text-foreground overflow-hidden relative">
      {/* Background aesthetic glow grids */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-blue-500/[0.04] via-transparent to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[12%] left-[-10%] w-[550px] h-[550px] bg-blue-600/[0.02] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-[28%] right-[-10%] w-[550px] h-[550px] bg-indigo-500/[0.02] blur-[180px] rounded-full pointer-events-none" />

      {/* 1. HERO SECTION REDESIGN */}
      <section className="relative pt-24 md:pt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* CENTERED COLUMN: Continuous Infinite Horizontal Product Marquee */}
          <div className="lg:col-span-12 relative py-4 flex flex-col items-center justify-center w-full overflow-hidden">
            
            {/* Visual background platform */}
            <div className="absolute inset-0 bg-radial-gradient from-red-600/[0.08] via-transparent to-transparent blur-3xl pointer-events-none" />

            {repeatedProducts.length > 0 && (
              <div className="w-full overflow-hidden relative py-12 select-none rounded-[3rem] border-2 border-red-500/40 bg-gradient-to-r from-red-950/90 via-red-900/85 to-red-950/90 shadow-[0_0_60px_rgba(239,68,68,0.25)]">
                {/* Visual hot red neon accent bar at the top */}
                <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-95" />
                
                {/* Active Dynamic Sales Burner pulsing badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full shadow-[0_0_25px_rgba(239,68,68,0.7)] border border-red-300/40 animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  <span>🔥 HOT SALES BURNER 🔥</span>
                </div>

                {/* Visual fade masks left and right with red-tinted ambient gradient */}
                <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-[#180202] via-[#180202]/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#180202] via-[#180202]/80 to-transparent z-10 pointer-events-none" />

                <motion.div
                  animate={{ x: ["-50%", "0%"] }}
                  transition={{
                    ease: "linear",
                    duration: 35, // Premium slow continuous scroll
                    repeat: Infinity,
                  }}
                  className="flex gap-16 w-max pt-6"
                >
                  {repeatedProducts.map((item, idx) => {
                    // Create a realistic high value discount for the red hot burner sales tag
                    const mockDiscount = 10 + (parseInt(item.id) || idx) % 25;
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        onClick={() => onQuickView(item)}
                        className="flex flex-col items-center text-center cursor-pointer group shrink-0 w-64 sm:w-72 px-4 transition-transform duration-300 hover:-translate-y-1.5"
                      >
                        {/* Floating Product Image with red-themed high power glowing shadow drop shadow */}
                        <div className="h-56 sm:h-64 w-56 sm:w-64 flex items-center justify-center relative mb-5">
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_45px_rgba(239,68,68,0.22)] transform group-hover:scale-110 transition-transform duration-500 ease-out select-none pointer-events-none"
                          />
                        </div>
                        
                        {/* Floating product details underneath with high energy Red styling */}
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-mono rounded-full uppercase tracking-widest block max-w-max mx-auto mb-1 font-bold">
                            {item.category}
                          </span>
                          <h3 className="text-xs sm:text-sm font-display font-medium text-foreground group-hover:text-red-400 transition-colors tracking-tight line-clamp-1 max-w-[180px] sm:max-w-[220px]">
                            {item.name}
                          </h3>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-[11px] sm:text-xs font-mono font-black text-red-500">
                              UGX {item.price.toLocaleString()}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-red-600/90 text-white font-black rounded tracking-tighter">
                              -{mockDiscount}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            )}



          </div>
        </div>
      </section>






      {/* 5. PORTFOLIO & CATEGORIES FEED */}
      <section id="tech-portfolio" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 scroll-mt-24">
        
        {/* Dynamic header display */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-border pb-4 mb-8 gap-4 text-left">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">DIRECT TECH CATALOG</span>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-foreground tracking-tight">
              {category ? `${category}` : "Browse the Showroom"}
            </h2>
          </div>

          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest bg-card border border-border px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0 self-start sm:self-auto select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {category ? `${filteredProducts.length} Items Locked` : `${products.length} Units Online`}
          </span>
        </div>

        {/* Dynamic Category selectors */}
        <div className="mb-10 flex overflow-x-auto no-scrollbar gap-2.5 pb-2.5 border-b border-border/60 text-left">
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "relative flex items-center gap-2.5 px-5 py-3 rounded-full transition-all text-xs font-mono font-bold uppercase tracking-wider shrink-0 border cursor-pointer",
              category === null
                ? "bg-foreground text-background border-transparent shadow"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
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
                    ? "bg-foreground text-background border-transparent shadow opacity-90"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* RECENTLY VIEWED CONTAINER REMOVED FROM HERE TO BE SHIFTED AS A MARQUEE JUST ABOVE THE FOOTER */}

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
            className="py-20 text-center bg-card border border-border rounded-[2.5rem] relative overflow-hidden shadow-sm"
          >
             <div className="relative z-10 max-w-sm mx-auto space-y-6 px-4">
              <div className="w-12 h-12 bg-background border border-border rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-display font-medium text-foreground">No products found</h3>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
                  We currently do not have matching units in stock. Refine your query or check back later!
                </p>
              </div>
              <button 
                onClick={() => onCategorySelect(null)}
                className="py-3 px-6 bg-foreground hover:opacity-90 text-background font-semibold text-xs rounded-full transition-all active:scale-95 cursor-pointer font-mono tracking-wider"
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
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground">
                          {getCategoryIcon(cat)}
                        </div>
                        <h3 className="text-base sm:text-lg font-display font-medium text-foreground">
                          {cat}
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest bg-background border border-border px-3 py-1 rounded-full font-bold">
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

      {/* 6. RECENTLY VIEWED INFINITE MARQUEE */}
      {category === null && searchQuery === '' && recentlyViewedProducts.length > 0 && (
        <div id="recently-viewed-marquee-container" className="w-full border-t border-border/40 pt-24 pb-14 text-left space-y-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-blue-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-muted-foreground uppercase">PERSISTENT SYSTEM RETRIEVAL</span>
                <h3 className="text-xl md:text-2xl font-display font-medium text-foreground tracking-tight">
                  Recently Viewed Units
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest bg-card border border-border px-3.5 py-1.5 rounded-full flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {recentlyViewedProducts.length} Items Cached
            </span>
          </div>

          <div id="recently-viewed-marquee-track" className="relative w-full overflow-hidden py-4 select-none">
            {/* Ambient visual fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/70 to-transparent z-10 pointer-events-none" />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                ease: "linear",
                duration: 25,
                repeat: Infinity,
              }}
              className="flex gap-6 w-max animate-none"
            >
              {repeatedViewed.map((item, idx) => (
                <div
                  key={`rec-marquee-${item.id}-${idx}`}
                  id={`rec-marquee-card-${item.id}-${idx}`}
                  onClick={() => onProductClick(item)}
                  className="group relative rounded-[2.25rem] bg-[#090a0f]/85 dark:bg-card/70 hover:bg-card border border-white/[0.04] hover:border-blue-500/40 p-5 flex items-center gap-5 w-80 h-32 transition-all duration-300 cursor-pointer shrink-0 shadow-xl hover:shadow-[0_15px_45px_rgba(59,130,246,0.12)]"
                >
                  {/* Subtle backdrop element */}
                  <span className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none rounded-[2.25rem]" />
                  
                  <div className="h-24 w-24 flex items-center justify-center relative overflow-hidden bg-background/40 rounded-2xl shrink-0 p-2 border border-white/[0.02]">
                    <OptimizedImage 
                      src={item.image} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.04)] transform transition-transform duration-500 group-hover:scale-110 select-none"
                    />
                  </div>
                  <div className="space-y-1.5 text-left min-w-0">
                    <span className="text-[9.5px] font-mono font-bold tracking-wider text-blue-500 uppercase block">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-medium text-foreground group-hover:text-blue-400 transition-colors truncate max-w-[170px]">
                      {item.name}
                    </h4>
                    <span className="text-xs font-mono text-muted-foreground font-black block">
                      UGX {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      )}
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
