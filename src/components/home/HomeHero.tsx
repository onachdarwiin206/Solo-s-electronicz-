import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, Laptop, Headphones, Watch, ShieldCheck, 
  Truck, Star, Sparkles, ShoppingBag, ArrowRight, 
  ChevronRight, ChevronLeft, CheckCircle2, MapPin, Compass, Gamepad2, Loader2,
  Tv, Wifi, Camera, Cpu, Tag, Usb, Heart, Clock, AlertCircle, Sparkle,
  Search, Shield, PhoneCall, BadgePercent, CheckCircle, Zap, HelpCircle,
  Play, Pause, RefreshCw, Eye, Film
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
  const [isOrbiting, setIsOrbiting] = useState(true);
  const [cinemaDimmed, setCinemaDimmed] = useState(false);
  const [isPlayingAutoplay, setIsPlayingAutoplay] = useState(true);
  const [scanCoord, setScanCoord] = useState({ x: 124.8, y: 394.2, z: 88.5 });

  useEffect(() => {
    if (!isOrbiting) return;
    const interval = setInterval(() => {
      setScanCoord({
        x: Number((100 + Math.random() * 800).toFixed(1)),
        y: Number((100 + Math.random() * 800).toFixed(1)),
        z: Number((10 + Math.random() * 150).toFixed(1))
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isOrbiting]);
  
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

  const premiumShowcase = useMemo(() => {
    if (!products.length) return [];
    const smartphones = products.filter(p => p.category.toLowerCase().includes('phone') || p.name.toLowerCase().includes('galaxy') || p.name.toLowerCase().includes('iphone'));
    const laptops = products.filter(p => p.category.toLowerCase().includes('laptop') || p.category.toLowerCase().includes('computer'));
    const earbuds = products.filter(p => p.category.toLowerCase().includes('audio') || p.name.toLowerCase().includes('airpods') || p.name.toLowerCase().includes('headphone') || p.name.toLowerCase().includes('sony'));
    const otherFeatured = products.filter(p => p.featured || p.rating && p.rating >= 4.8);

    const items: Product[] = [];
    if (smartphones[0]) items.push(smartphones[0]);
    if (laptops[0]) items.push(laptops[0]);
    if (earbuds[0]) items.push(earbuds[0]);
    if (otherFeatured[1]) items.push(otherFeatured[1]);

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

  useEffect(() => {
    if (premiumShowcase.length < 2 || !isPlayingAutoplay) return;
    const interval = setInterval(() => {
      setActiveShowcaseIdx(prev => (prev + 1) % premiumShowcase.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [premiumShowcase, isPlayingAutoplay]);

  const activeShowcaseProduct = premiumShowcase[activeShowcaseIdx];

  const recentlyUploadedProducts = useMemo(() => {
    if (!products.length) return [];
    return [...products]
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : (a.client_created_at || 0);
        const timeB = b.created_at ? new Date(b.created_at).getTime() : (b.client_created_at || 0);
        if (timeA === 0 && timeB === 0) {
          return b.id.localeCompare(a.id);
        }
        return timeB - timeA;
      })
      .slice(0, 6);
  }, [products]);

  const getUploadTimeLabel = (product: Product) => {
    const time = product.created_at ? new Date(product.created_at).getTime() : (product.client_created_at || 0);
    if (!time) {
      const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hours = (hash % 18) + 1;
      return `${hours}h ago`;
    }
    const diffMs = Date.now() - time;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

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
    <div className="space-y-12 pb-32 bg-transparent text-zinc-800 dark:text-zinc-100 overflow-hidden relative">
      {/* Background aesthetic glow grids */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-orange-500/[0.02] via-transparent to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] bg-orange-500/[0.01] blur-[150px] rounded-full pointer-events-none" />

      {/* Jumia-Style Promotional Top Ribbon */}
      <div className="w-full bg-[#F68B1E] text-white py-2 px-4 text-center text-xs font-semibold tracking-wider flex items-center justify-center gap-2 select-none shadow-sm relative z-20">
        <Zap size={13} className="animate-pulse text-yellow-300 fill-current" />
        <span>LIRA ELECTRONICS MEGADAYS: SAMEDAY SECURE COURIER DISPATCH WITHIN LIRA CITY!</span>
      </div>

      {/* 1. THREE-COLUMN PORTAL HUB (JUMIA GRID ARCHETYPE) */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-left pt-2">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Category Sidebar (Desktop only) */}
          <div className="hidden xl:flex xl:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 flex-col gap-1 shadow-sm select-none">
            <span className="text-[10px] font-mono tracking-widest text-[#F68B1E] uppercase font-extrabold px-3.5 mb-3.5 block">
              Browse Categories
            </span>
            <button
              onClick={() => onCategorySelect(null)}
              className={cn(
                "flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border",
                category === null
                  ? "bg-[#F68B1E] border-[#F68B1E] text-white shadow-sm"
                  : "bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:text-[#F68B1E] dark:hover:text-[#F68B1E] hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Compass size={13} />
                <span>All Products</span>
              </div>
              <ChevronRight size={12} className="opacity-60" />
            </button>
            {PRODUCT_CATEGORIES.map((cat) => {
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategorySelect(cat)}
                  className={cn(
                    "flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer border",
                    isActive
                      ? "bg-[#F68B1E] border-[#F68B1E] text-white shadow-sm"
                      : "bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:text-[#F68B1E] dark:hover:text-[#F68B1E] hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </div>
                  <ChevronRight size={12} className="opacity-60" />
                </button>
              );
            })}
            <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 px-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <ShieldCheck size={14} className="text-[#F68B1E]" />
                <span>100% Certified Genuine</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <Truck size={14} className="text-[#F68B1E]" />
                <span>Safe Same-Day Delivery</span>
              </div>
            </div>
          </div>

          {/* Center Sliding Deals Banner (Main Carousel) */}
          <div className="col-span-1 xl:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm relative p-6 sm:p-8 min-h-[420px]">
            {/* Background ambient warmth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#F68B1E]/[0.02] to-transparent pointer-events-none" />
            
            {premiumShowcase.length > 0 && activeShowcaseProduct ? (
              <>
                {/* Top Tag and Carousel Dot indicators */}
                <div className="flex items-center justify-between select-none z-10">
                  <span className="px-2.5 py-1 bg-red-600 text-white text-[9px] font-sans font-black uppercase rounded tracking-wider flex items-center gap-1 animate-pulse">
                    <Zap size={11} className="fill-current" />
                    DEAL OF THE DAY
                  </span>
                  
                  {/* Slider Pagination */}
                  <div className="flex items-center gap-1.5">
                    {premiumShowcase.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveShowcaseIdx(idx)}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
                          idx === activeShowcaseIdx 
                            ? "bg-[#F68B1E] w-4" 
                            : "bg-zinc-200 dark:bg-zinc-700 hover:bg-[#F68B1E]/50"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Central Showcase Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1 my-4 z-10">
                  {/* Left Content */}
                  <div className="md:col-span-7 space-y-3.5 text-left">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#F68B1E] uppercase block">
                      {activeShowcaseProduct.category}
                    </span>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold text-zinc-900 dark:text-white uppercase leading-tight line-clamp-2">
                      {activeShowcaseProduct.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {activeShowcaseProduct.description}
                    </p>
                    
                    {/* Pricing with heavy discounts */}
                    <div className="pt-1">
                      <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block font-black">Flash Rate</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl sm:text-2xl font-mono font-black text-[#F68B1E]">
                          UGX {activeShowcaseProduct.price.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-zinc-400 line-through">
                          UGX {Math.floor(activeShowcaseProduct.price * 1.25).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Image Display */}
                  <div className="md:col-span-5 flex items-center justify-center relative">
                    <div 
                      onClick={() => onQuickView(activeShowcaseProduct)}
                      className="w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 relative cursor-pointer group shadow-sm hover:shadow transition-all"
                    >
                      <OptimizedImage
                        src={activeShowcaseProduct.image}
                        alt={activeShowcaseProduct.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-[9px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1 select-none">
                        <Eye size={11} /> Zoom
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls / Action row */}
                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50 pt-4 z-10 gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveShowcaseIdx(prev => (prev - 1 + premiumShowcase.length) % premiumShowcase.length);
                      }}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer border border-zinc-200/40 dark:border-zinc-700/40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setActiveShowcaseIdx(prev => (prev + 1) % premiumShowcase.length);
                      }}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer border border-zinc-200/40 dark:border-zinc-700/40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <button
                      onClick={() => onAddToCart(activeShowcaseProduct)}
                      className="px-5 py-2.5 bg-[#F68B1E] hover:bg-[#e07b12] text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer flex-1 max-w-[160px]"
                    >
                      <ShoppingBag size={13} />
                      <span>Buy Now</span>
                    </button>
                    
                    <button
                      onClick={() => onToggleWishlist(activeShowcaseProduct.id)}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer shrink-0",
                        isItemWishlisted(activeShowcaseProduct.id)
                          ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-900/30'
                          : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600'
                      )}
                    >
                      <Heart size={13} className={isItemWishlisted(activeShowcaseProduct.id) ? "fill-current" : ""} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs uppercase tracking-widest font-mono">
                Empty Showcase
              </div>
            )}
          </div>

          {/* Right Column (Courier, Secure Escrow & WhatsApp Negotiator) */}
          <div className="col-span-1 xl:col-span-3 flex flex-col gap-4">
            
            {/* Courier Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4.5 flex flex-col justify-between flex-1 shadow-sm text-left">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-[#F68B1E] font-extrabold uppercase">
                  <Truck size={12} />
                  <span>JUMIA EXPRESS COURIER</span>
                </div>
                <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-white uppercase">
                  Lira Doorstep Delivery
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Fast deliveries inside Lira Municipality and neighboring districts of Northern Uganda.
                </p>
              </div>
              <div className="mt-3 flex justify-between items-center text-[10px] font-sans font-bold text-[#F68B1E] select-none">
                <span>Free delivery over UGX 500k</span>
                <ChevronRight size={10} />
              </div>
            </div>

            {/* Secure Check Escrow Section */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4.5 flex flex-col justify-between flex-1 shadow-sm text-left">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                  <ShieldCheck size={12} />
                  <span>SECURE PHYSICAL COLLECTION</span>
                </div>
                <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-white uppercase">
                  Verify Before Payment
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Collect your items from our main showroom counter. Pay after inspecting and testing your device.
                </p>
              </div>
              <div className="mt-3 text-[9px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Escrow Covered Outpost</span>
              </div>
            </div>

            {/* Direct WhatsApp Negotiator */}
            <div className="bg-[#EBF7F0] dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-900/30 rounded-2xl p-4.5 flex flex-col justify-between flex-1 shadow-sm text-left">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                  <WhatsAppIcon size={12} className="text-emerald-500 fill-current" />
                  <span>DIRECT ORDER DESK</span>
                </div>
                <h4 className="text-xs font-sans font-bold text-emerald-900 dark:text-emerald-100 uppercase">
                  Order via WhatsApp
                </h4>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Submit orders directly to Emma's personal sales counter to request customized discounts!
                </p>
              </div>
              <a
                href="https://wa.me/256782522718?text=Hello%20Emma,%20I%20am%20viewing%20Lira%20Phones%20and%20Electronics%20and%20want%20to%20place%20a%20custom%20order!"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 py-2 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-[10px] font-sans font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <WhatsAppIcon size={12} className="fill-current" />
                <span>Chat with Emma</span>
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* 2. FLASH SALES DEALS BLOCK (RED BRAND BANNER) */}
      {category === null && searchQuery === '' && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-2">
          <div className="bg-[#E61E26] text-white rounded-2xl overflow-hidden shadow-sm">
            {/* Countdown header */}
            <div className="px-5 py-3.5 bg-[#B31217] flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-red-500/10">
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                  <Zap size={18} className="text-yellow-400 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-display font-black tracking-tight uppercase">
                    FLASH SALES
                  </h3>
                  <p className="text-[10px] text-red-200/90 font-mono tracking-wide">LIMITED STOCK • LIVE DISCOUNT WINDOW</p>
                </div>
              </div>

              {/* Ticking Timer */}
              <div className="flex items-center gap-2 bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/10">
                <span className="text-[9px] font-mono tracking-widest text-red-200 font-bold uppercase">ENDS IN:</span>
                <div className="flex items-center gap-1 font-mono text-xs font-extrabold">
                  <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-black">{timeLeft.hrs}</span>
                  <span className="text-red-200 font-bold">:</span>
                  <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-black">{timeLeft.mins}</span>
                  <span className="text-red-200 font-bold">:</span>
                  <span className="bg-white text-red-600 px-1.5 py-0.5 rounded font-black">{timeLeft.secs}</span>
                </div>
              </div>
            </div>

            {/* Horizontal Product Strip */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
              {products.filter(p => p.stock > 0).slice(0, 6).map((item) => {
                const originalPrice = Math.floor(item.price * 1.22);
                const discountPercent = 18;
                return (
                  <div
                    key={`flash-${item.id}`}
                    onClick={() => onProductClick(item)}
                    className="w-[200px] sm:w-[240px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-3 flex flex-col justify-between shrink-0 snap-start shadow-sm hover:shadow-md transition-all cursor-pointer relative group text-zinc-800 dark:text-zinc-100"
                  >
                    {/* Discount badge */}
                    <span className="absolute top-2.5 left-2.5 bg-[#E61E26] text-white text-[8px] font-sans font-black px-1.5 py-0.5 rounded uppercase tracking-wider z-10 shadow-sm">
                      -{discountPercent}%
                    </span>

                    {/* Image Area */}
                    <div className="h-36 sm:h-40 w-full bg-zinc-50 dark:bg-zinc-950 rounded-lg flex items-center justify-center p-1.5 mb-2 border border-zinc-100 dark:border-zinc-800/20 relative overflow-hidden shrink-0">
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-left min-w-0">
                      <h4 className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-50 group-hover:text-[#F68B1E] transition-colors leading-snug">
                        {item.name}
                      </h4>
                      <div className="space-y-0.5">
                        <div className="text-sm font-mono font-black text-[#F68B1E]">
                          UGX {item.price.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-400 line-through">
                          UGX {originalPrice.toLocaleString()}
                        </div>
                      </div>

                      {/* Stock availability */}
                      <div className="pt-1">
                        <div className="flex justify-between items-center text-[8px] font-mono font-bold text-zinc-400 mb-1 uppercase">
                          <span>{item.stock} left</span>
                          <span>In Stock</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(20, (item.stock / 15) * 100))}%` }}
                            className="h-full bg-red-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. CORE SERVICE GUARANTEES */}
      {category === null && searchQuery === '' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm text-left">
              <div className="w-10 h-10 bg-[#F68B1E]/10 text-[#F68B1E] rounded-xl flex items-center justify-center shrink-0">
                <Truck size={18} />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-white uppercase">Fast Regional Shipping</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">Express shipping and physical collection depots available throughout Lira municipality.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm text-left">
              <div className="w-10 h-10 bg-[#F68B1E]/10 text-[#F68B1E] rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-white uppercase">100% Secure Transaction</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">Official manufacturer diagnostic warranties and physical inspections supported on pick up.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm text-left">
              <div className="w-10 h-10 bg-[#F68B1E]/10 text-[#F68B1E] rounded-xl flex items-center justify-center shrink-0">
                <PhoneCall size={18} />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-sans font-bold text-zinc-900 dark:text-white uppercase">Dedicated Help Desk</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">Instant phone and WhatsApp assistance to clarify specs or negotiate bespoke corporate bulk rates.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. RECENTLY SYNCED SHOWROOM FEED */}
      {category === null && searchQuery === '' && recentlyUploadedProducts.length > 0 && (
        <section id="recently-uploaded-section" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 scroll-mt-24 pt-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200/60 dark:border-zinc-800/80 pb-3 mb-6 gap-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono font-black tracking-widest text-[#F68B1E] uppercase flex items-center gap-1">
                <Zap size={11} className="fill-current" />
                SHOWROOM ACQUISITION
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                Recently Loaded Inventory
              </h2>
            </div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 self-start sm:self-auto select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F68B1E] animate-ping shrink-0" />
              Live Provision Stream
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentlyUploadedProducts.map((item) => (
              <ProductCard
                key={`uploaded-${item.id}`}
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
        </section>
      )}

      {/* 5. DIRECT SHOWROOM CATALOG */}
      <section id="tech-portfolio" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 scroll-mt-24 pt-4 text-left">
        
        {/* Catalog header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-200/60 dark:border-zinc-800/80 pb-3 mb-6 gap-3">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">DIRECT SPEC CATALOG</span>
            <h2 className="text-xl sm:text-2xl font-display font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              {category ? `${category}` : "Browse the Showroom"}
            </h2>
          </div>

          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 self-start sm:self-auto select-none font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {category ? `${filteredProducts.length} Items Locked` : `${products.length} Units Online`}
          </span>
        </div>

        {/* Categories strip */}
        <div className="mb-8 flex overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800/40">
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all text-xs font-bold tracking-wide shrink-0 border cursor-pointer uppercase",
              category === null
                ? "bg-[#F68B1E] border-[#F68B1E] text-white shadow-sm"
                : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
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
                  "relative flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all text-xs font-bold tracking-wide shrink-0 border cursor-pointer uppercase",
                  isActive
                    ? "bg-[#F68B1E] border-[#F68B1E] text-white shadow-sm"
                    : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* FEED GRID USING REDESIGNED PRODUCT CARD */}
        {loadingProducts ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-zinc-400 mb-4" size={32} />
            <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">Loading catalog parameters...</p>
          </div>
        ) : (category || searchQuery) && filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm"
          >
             <div className="max-w-sm mx-auto space-y-5 px-4">
              <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-zinc-400">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase">No items found</h3>
                <p className="text-zinc-500 text-xs leading-relaxed max-w-xs mx-auto">
                  We currently do not have matching units in stock. Refine your query or inspect other categories.
                </p>
              </div>
              <button 
                onClick={() => onCategorySelect(null)}
                className="py-2.5 px-5 bg-zinc-900 hover:opacity-90 dark:bg-white text-white dark:text-black font-extrabold text-[10px] rounded-lg transition-all active:scale-95 cursor-pointer font-mono tracking-wider"
              >
                RESET FILTERS
              </button>
            </div>
          </motion.div>
        ) : (category || searchQuery) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="w-8 h-8 rounded-xl bg-[#F68B1E]/10 flex items-center justify-center text-[#F68B1E]">
                          {getCategoryIcon(cat)}
                        </div>
                        <h3 className="text-sm sm:text-base font-sans font-bold text-zinc-900 dark:text-white uppercase tracking-wide">
                          {cat}
                        </h3>
                      </div>
                      <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 px-2.5 py-1 rounded font-bold">
                        {catProducts.length} Stocked
                      </span>
                    </div>

                    <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 scroll-smooth w-full select-none snap-x snap-mandatory">
                      {catProducts.map((item) => (
                        <div key={item.id} className="w-[260px] sm:w-[290px] shrink-0 snap-start">
                          <ProductCard
                            product={item}
                            onAddToCart={onAddToCart}
                            onClick={() => onProductClick(item)}
                            onQuickView={onQuickView}
                            isWishlisted={isItemWishlisted(item.id)}
                            onToggleWishlist={onToggleWishlist}
                            isLiked={isItemLiked(item.id)}
                            onToggleLike={onToggleLike}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          )
        )}
      </section>

      {/* 6. RECENTLY VIEWED UNITS (FADING SLIDER) */}
      {category === null && searchQuery === '' && recentlyViewedProducts.length > 0 && (
        <div id="recently-viewed-marquee-container" className="w-full border-t border-zinc-200/40 dark:border-zinc-800/60 pt-16 pb-8 text-left space-y-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <Clock size={16} className="text-[#F68B1E] animate-pulse" />
              <div>
                <span className="text-[9px] font-mono font-black tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">HISTORY LOGS</span>
                <h3 className="text-base sm:text-lg font-display font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                  Recently Viewed Gear
                </h3>
              </div>
            </div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 px-2.5 py-1 rounded flex items-center gap-1 select-none">
              <span>{recentlyViewedProducts.length} items logged</span>
            </span>
          </div>

          <div id="recently-viewed-marquee-track" className="relative w-full overflow-hidden py-2 select-none">
            {/* Ambient visual fade masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background via-background/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background via-background/70 to-transparent z-10 pointer-events-none" />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                ease: "linear",
                duration: 25,
                repeat: Infinity,
              }}
              className="flex gap-4 w-max animate-none"
            >
              {repeatedViewed.map((item, idx) => (
                <div
                  key={`rec-marquee-${item.id}-${idx}`}
                  id={`rec-marquee-card-${item.id}-${idx}`}
                  onClick={() => onProductClick(item)}
                  className="group relative rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 p-3.5 flex items-center gap-3 w-72 h-24 transition-all duration-300 cursor-pointer shrink-0 shadow-sm hover:shadow"
                >
                  <div className="h-16 w-16 flex items-center justify-center relative bg-zinc-50 dark:bg-zinc-950 rounded-lg shrink-0 p-1.5 border border-zinc-200/40 dark:border-zinc-800/40">
                    <OptimizedImage 
                      src={item.image} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-0.5 text-left min-w-0">
                    <span className="text-[8px] font-mono font-bold tracking-wider text-[#F68B1E] uppercase block">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-[#F68B1E] transition-colors truncate max-w-[150px]">
                      {item.name}
                    </h4>
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold block">
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
  if (norm.includes('phone') || norm.includes('tablet')) return <Smartphone size={13} className="text-neutral-500 shrink-0" />;
  if (norm.includes('computer') || norm.includes('laptop')) return <Laptop size={13} className="text-neutral-500 shrink-0" />;
  if (norm.includes('gaming') || norm.includes('console')) return <Gamepad2 size={13} className="text-neutral-500 shrink-0" />;
  if (norm.includes('tv') || norm.includes('audio')) return <Headphones size={13} className="text-neutral-500 shrink-0" />;
  return <Sparkles size={13} className="text-neutral-500 shrink-0" />;
};
