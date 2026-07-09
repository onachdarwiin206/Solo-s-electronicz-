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
import { TrustBar } from './TrustBar';
import { WhyChooseSolo } from './WhyChooseSolo';
import { RapidRepairHub } from './RapidRepairHub';

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
    <div className="space-y-24 pb-32 bg-transparent text-foreground overflow-hidden relative">
      {/* Background aesthetic glow grids */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-blue-500/[0.04] via-transparent to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-[12%] left-[-10%] w-[550px] h-[550px] bg-blue-600/[0.02] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-[28%] right-[-10%] w-[550px] h-[550px] bg-indigo-500/[0.02] blur-[180px] rounded-full pointer-events-none" />

      {/* Urgent Marquee Alert Strip */}
      <div className="w-full bg-brand-blue text-black font-mono font-black text-[10px] sm:text-xs py-2 border-b-2 border-brand-blue tracking-[0.1em] overflow-hidden select-none relative z-20">
        <div className="whitespace-nowrap inline-block animate-marquee uppercase">
          ⚡ ACTIVE SHIPMENT ALERTS // SOLAR POWER BANKS & SMARTPHONES SELLING OUT FAST FOR THE ACADEMIC TERM // 15% REPAIR DISCOUNT FOR STUDENTS & BODA RIDERS // VISIT US OPPOSITE LIRA MAIN MARKET ⚡ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ⚡ ACTIVE SHIPMENT ALERTS // SOLAR POWER BANKS & SMARTPHONES SELLING OUT FAST FOR THE ACADEMIC TERM // 15% REPAIR DISCOUNT FOR STUDENTS & BODA RIDERS // VISIT US OPPOSITE LIRA MAIN MARKET ⚡
        </div>
      </div>

      {/* 1. HERO SECTION REDESIGN */}
      <section className="relative pt-12 md:pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-left font-mono">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* LEFT COLUMN: Bold Conversion & Trust Copy */}
          <div className="lg:col-span-7 flex flex-col justify-between border-2 border-brand-blue bg-black/85 p-6 sm:p-8 relative">
            {/* Blueprint grid overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(#0047AB 1px, transparent 1px), linear-gradient(90deg, #0047AB 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            <div className="space-y-6 relative z-10">
              {/* Top Tech Label */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-brand-blue text-black text-[10px] font-black uppercase tracking-wider">
                  PHYSICAL SHOP // LIRA CITY
                </span>
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">
                  [ VERIFIED HARDWARE HUBS ]
                </span>
              </div>

              {/* Bold Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-none uppercase tracking-tight">
                LIRA CITY'S HOME OF <span className="text-brand-green">GENUINE</span> ELECTRONICS & REPAIRS
              </h1>

              {/* Trust-Focused Subtitle */}
              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                Why risk your hard-earned cash on street boys or fake copy products? <strong>Solo's Electronics</strong> is a certified physical retail shop in Lira City Center. We offer 100% original smartphones, laptops, TVs, solar power chargers, and accessories — all backed by a <strong>stamped 1-year warranty receipt</strong> and professional on-site engineering repairs.
              </p>

              {/* Lira Targeted Urgency Notification */}
              <div className="border border-dashed border-brand-green/40 bg-brand-green/5 p-4 text-[11px] text-brand-green uppercase font-bold tracking-tight">
                🚨 SPECIAL NOTICE: Lira University students, small business operators, and boda boda riders get 15% OFF repair services on presentation of ID!
              </div>

              {/* Primary & Secondary Action CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {/* Primary CTA - WhatsApp direct */}
                <a 
                  href="https://wa.me/256793405517?text=Hello%20Solo%27s%20Electronics!%20I%20am%20visiting%20your%20online%20showroom%20and%20want%20to%20order%2Fask%20about%20your%20products%20and%20warranties."
                  target="_blank"
                  rel="noreferrer"
                  className="bg-brand-green text-black hover:bg-white hover:text-black border-2 border-brand-green font-black text-xs uppercase tracking-widest p-4 flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                >
                  <WhatsAppIcon size={16} className="fill-current" />
                  Chat / Order via WhatsApp
                </a>

                {/* Secondary CTA - Physical Shop info */}
                <button
                  onClick={() => {
                    document.getElementById('physical-location-specs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-brand-blue hover:bg-white hover:text-black text-white font-black text-xs uppercase tracking-widest p-4 border-2 border-brand-blue flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                >
                  <MapPin size={14} />
                  Visit Lira City Shop
                </button>
              </div>
            </div>

            {/* Location Specs Table */}
            <div id="physical-location-specs" className="mt-8 pt-6 border-t-2 border-brand-blue/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left relative z-10">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">// EXACT ADDRESS</span>
                <span className="text-white text-[11px] leading-tight block">
                  Opposite Lira Main Market, Lira City Center, Uganda
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">// OPEN HOURS</span>
                <span className="text-white text-[11px] block">
                  Mon-Sat: 8AM - 8PM<br />
                  Sun: 10AM - 4PM
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">// CALL SUPPORT</span>
                <span className="text-brand-green text-[11px] font-bold block">
                  +256 793 405 517<br />
                  +256 772 718 161
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Stock Inventory Rig (Spotlight Carousel) */}
          <div className="lg:col-span-5 border-2 border-brand-blue bg-black/90 p-6 flex flex-col justify-between relative select-none">
            {/* Blueprint background grid */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{
                backgroundImage: `radial-gradient(circle, #39FF14 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            />

            {/* Header Timeline Ribbon */}
            <div className="flex justify-between items-center border-b border-brand-blue/30 pb-3 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand-green animate-pulse" />
                LIVE_STOCK_FEED // ACTIVE
              </span>
              <span>ITEM {activeShowcaseIdx + 1} OF {premiumShowcase.length}</span>
            </div>

            {premiumShowcase.length > 0 && activeShowcaseProduct && (
              <div className="flex-1 flex flex-col justify-between my-4">
                
                {/* Showcase Image Area */}
                <div 
                  onClick={() => onQuickView(activeShowcaseProduct)}
                  className="h-48 w-full bg-zinc-950 border border-brand-blue/20 flex items-center justify-center p-4 relative cursor-pointer group"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeShowcaseProduct.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <OptimizedImage
                        src={activeShowcaseProduct.image}
                        alt={activeShowcaseProduct.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,4,171,0.25)] group-hover:scale-105 transition-transform duration-300"
                      />
                    </motion.div>
                  </AnimatePresence>

                  <span className="absolute bottom-2 right-3 text-[9px] text-brand-green/80 font-mono tracking-widest bg-black border border-brand-green/30 px-2 py-0.5 uppercase">
                    UGX {activeShowcaseProduct.price.toLocaleString()}
                  </span>
                </div>

                {/* Showcase Copy Area */}
                <div className="mt-4 text-left space-y-2">
                  <span className="text-[10px] text-brand-green font-bold uppercase block tracking-widest">
                    [ RECOMMENDED DEAL // {activeShowcaseProduct.category} ]
                  </span>
                  <h3 className="text-md font-black text-white uppercase truncate">
                    {activeShowcaseProduct.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed line-clamp-2">
                    {activeShowcaseProduct.description}
                  </p>

                  {/* Stock spec block */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px]">
                    <div className="p-2 border border-brand-blue/20 bg-zinc-950 flex flex-col">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider">STOCK LEVEL</span>
                      <span className="text-white font-bold">{activeShowcaseProduct.stock > 0 ? `${activeShowcaseProduct.stock} UNITS IN LIRA` : "OUT OF STOCK"}</span>
                    </div>
                    <div className="p-2 border border-brand-blue/20 bg-zinc-950 flex flex-col">
                      <span className="text-zinc-500 text-[8px] uppercase tracking-wider">WARRANTY STATUS</span>
                      <span className="text-brand-green font-bold">1-YEAR RECEIPT</span>
                    </div>
                  </div>
                </div>

                {/* Showcase CTAs */}
                <div className="mt-4 pt-3 border-t border-brand-blue/20 flex gap-2.5">
                  <button
                    onClick={() => onAddToCart(activeShowcaseProduct)}
                    className="flex-1 bg-brand-blue text-white font-bold text-[10px] uppercase tracking-widest py-3 hover:bg-white hover:text-black border-2 border-brand-blue cursor-pointer transition-colors text-center"
                  >
                    Add to Basket
                  </button>
                  <a
                    href={`https://wa.me/256793405517?text=${encodeURIComponent(`Hello Solo's Electronics! I am interested in buying: ${activeShowcaseProduct.name} (Price: UGX ${activeShowcaseProduct.price.toLocaleString()}) which I saw on your online showroom. Is it available at Lira City Center?`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-brand-green text-black font-black text-[10px] uppercase tracking-widest py-3 border-2 border-brand-green cursor-pointer hover:bg-white hover:text-black transition-colors text-center flex items-center justify-center gap-1"
                  >
                    <WhatsAppIcon size={12} className="fill-current" />
                    Buy via WhatsApp
                  </a>
                </div>

              </div>
            )}

            {/* Manual Toggles & Autoplay Control */}
            <div className="border-t border-brand-blue/30 pt-3 flex justify-between items-center text-[10px]">
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setActiveShowcaseIdx(prev => (prev - 1 + premiumShowcase.length) % premiumShowcase.length);
                  }}
                  className="p-1.5 border border-brand-blue/30 hover:border-brand-green text-zinc-400 hover:text-white cursor-pointer bg-zinc-950"
                >
                  <ChevronLeft size={12} />
                </button>
                <button
                  onClick={() => {
                    setActiveShowcaseIdx(prev => (prev + 1) % premiumShowcase.length);
                  }}
                  className="p-1.5 border border-brand-blue/30 hover:border-brand-green text-zinc-400 hover:text-white cursor-pointer bg-zinc-950"
                >
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlayingAutoplay(p => !p)}
                  className={`px-2 py-1 border cursor-pointer ${isPlayingAutoplay ? 'border-brand-green/40 text-brand-green bg-brand-green/5' : 'border-brand-blue/30 text-zinc-500 bg-zinc-950'}`}
                >
                  {isPlayingAutoplay ? "AUTOPLAY ON" : "AUTOPLAY OFF"}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Global Trust verification bar inserted directly under hero column stack */}
        <TrustBar />

      </section>

      {/* RECENTLY UPLOADED SECTION */}
      {category === null && searchQuery === '' && recentlyUploadedProducts.length > 0 && (
        <section id="recently-uploaded-section" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 scroll-mt-24 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/[0.06] pb-4 mb-8 gap-4 text-left">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-blue-400 uppercase flex items-center gap-1.5">
                <Zap size={11} className="fill-blue-400/20" />
                FRESH SHOWROOM SYNC
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight uppercase">
                Recently Uploaded Gear
              </h2>
            </div>
            
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest bg-white/[0.02] border border-white/[0.04] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 select-none self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
              Live Provision Stream
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {recentlyUploadedProducts.map((item) => {
              const timeLabel = getUploadTimeLabel(item);
              const isWishlisted = isItemWishlisted(item.id);
              const itemImage = (item.images && item.images.length > 0) ? item.images[0] : item.image;
              
              return (
                <div 
                  key={`uploaded-${item.id}`}
                  className="group relative rounded-[2rem] bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-blue-500/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-xl"
                >
                  {/* Glowing background bubble */}
                  <span className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.05] rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
                  
                  <div>
                    {/* Header: Relative upload time and Quick buttons */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/15 text-blue-400 text-[8.5px] font-mono rounded-lg uppercase tracking-wider font-extrabold flex items-center gap-1">
                        <Clock size={10} />
                        {timeLabel}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleWishlist(item.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isWishlisted 
                              ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                              : 'bg-white/[0.02] text-zinc-500 border-white/[0.04] hover:text-white hover:bg-white/[0.05]'
                          }`}
                          title="Bookmark hardware"
                        >
                          <Heart size={12} className={isWishlisted ? 'fill-blue-500 text-blue-500' : ''} />
                        </button>
                      </div>
                    </div>

                    {/* Image Area */}
                    <div 
                      onClick={() => onProductClick(item)}
                      className="h-44 w-full flex items-center justify-center bg-black/20 rounded-2xl p-4 border border-white/[0.02] relative overflow-hidden cursor-pointer"
                    >
                      <OptimizedImage
                        src={itemImage}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] transform transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Meta info */}
                    <div className="mt-5 text-left space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono tracking-wider text-zinc-500 font-extrabold uppercase">
                        <span>{item.category}</span>
                        {item.rating && (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star size={9} className="fill-current" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                      
                      <h4 
                        onClick={() => onProductClick(item)}
                        className="font-bold text-white text-sm uppercase truncate cursor-pointer hover:text-blue-400 transition-colors"
                      >
                        {item.name}
                      </h4>
                      
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Quick Add */}
                  <div className="mt-6 pt-5 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="text-left font-mono">
                      <span className="text-[8px] text-zinc-500 block uppercase tracking-widest font-black">PROVISION RATE</span>
                      <span className="text-white text-xs font-black">UGX {item.price.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onQuickView(item)}
                        className="p-2.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Quick Inspect"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => onAddToCart(item)}
                        className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/10 hover:border-blue-500 text-blue-400 hover:text-white text-[9px] font-mono tracking-widest uppercase font-extrabold rounded-xl transition-all duration-300 cursor-pointer"
                      >
                        Acquire
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Why Choose Solo's Value Proposition Grid */}
      {category === null && searchQuery === '' && <WhyChooseSolo />}

      {/* Rapid On-Site Repair station rate card & WhatsApp Booking */}
      {category === null && searchQuery === '' && <RapidRepairHub />}

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

                    <CategoryRowWithScroll
                      catProducts={catProducts}
                      onAddToCart={onAddToCart}
                      onProductClick={onProductClick}
                      onQuickView={onQuickView}
                      isItemWishlisted={isItemWishlisted}
                      onToggleWishlist={onToggleWishlist}
                      isItemLiked={isItemLiked}
                      onToggleLike={onToggleLike}
                    />
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
                  className="group relative rounded-[2.25rem] bg-card/35 dark:bg-card/30 backdrop-blur-md hover:bg-card/50 border border-white/[0.04] hover:border-blue-500/40 p-5 flex items-center gap-5 w-80 h-32 transition-all duration-300 cursor-pointer shrink-0 shadow-xl hover:shadow-[0_15px_45px_rgba(59,130,246,0.12)]"
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

function CategoryRowWithScroll({ 
  catProducts, 
  onAddToCart, 
  onProductClick, 
  onQuickView, 
  isItemWishlisted, 
  onToggleWishlist, 
  isItemLiked, 
  onToggleLike 
}: { 
  catProducts: Product[]; 
  onAddToCart: any; 
  onProductClick: any; 
  onQuickView: any; 
  isItemWishlisted: any; 
  onToggleWishlist: any; 
  isItemLiked: any; 
  onToggleLike: any; 
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Run once initially
      checkScroll();
      // Handle resize
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [catProducts]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/scrollrow w-full">
      {/* Left Scroll Button */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-foreground hover:scale-110 shadow-lg cursor-pointer transition-all active:scale-95 duration-200"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
      )}

      {/* Right Scroll Button */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-foreground hover:scale-110 shadow-lg cursor-pointer transition-all active:scale-95 duration-200"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      )}

      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto no-scrollbar pb-6 pt-2 scroll-smooth w-full select-none snap-x snap-mandatory"
      >
        {catProducts.map((item) => (
          <div key={item.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
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
