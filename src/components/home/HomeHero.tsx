import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, Laptop, Headphones, Watch, ShieldCheck, 
  Truck, Star, Sparkles, ShoppingBag, ArrowRight, 
  ChevronRight, CheckCircle2, MapPin, Compass, Gamepad2, Loader2
} from 'lucide-react';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES } from '../../constants';
import { ProductCard } from '../shop/ProductCard';
import { OrderTracking } from '../shop/OrderTracking';

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

      {!category && !searchQuery && (
        <>
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
                    className="px-6 py-4 bg-white hover:bg-neutral-100 text-black font-semibold text-xs font-mono tracking-widest rounded-2xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(255,255,255,0.1)] cursor-pointer"
                  >
                    SHOP NOW
                    <ShoppingBag size={14} className="text-black" />
                  </button>

                  <button
                    onClick={() => {
                      document.getElementById('live-logistics-radar')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-4 bg-white/[0.02] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04] text-white font-semibold text-xs font-mono tracking-widest rounded-2xl active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    TRACK ORDER
                    <Compass size={14} className="text-gray-400" />
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

              {/* RIGHT PRODUCT GRID COLUMN (70% Visual Weight of Grid) */}
              <div className="lg:col-span-8">
                
                {/* Visual Header above grid */}
                <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
                  <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase font-black">
                    PREMIUM FLAGSHIP PORTFOLIO // IMMEDIATE INVENTORY
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 100% In-Stock
                  </span>
                </div>

                {/* The 6 Premium Products configured exactly requested */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 xl:gap-5">
                  {showcaseProducts.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
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
                            className="p-1 px-2.5 bg-white hover:bg-neutral-200 text-black text-[9px] font-mono font-bold rounded-lg transition-all active:scale-90 flex items-center gap-1 shrink-0"
                          >
                            BUY
                            <ShoppingBag size={9} />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </div>

              </div>

            </div>

          </section>

          {/* 2. INSTANT PRODUCT CATEGORY SHORTCUTS BAR */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="p-1 border-t border-b border-white/[0.04]">
              <div className="flex flex-wrap lg:grid lg:grid-cols-5 gap-3 justify-center py-4 bg-transparent text-left">
                {PRODUCT_CATEGORIES.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategorySelect(cat)}
                    className="px-4 py-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.04] hover:border-white/10 rounded-2xl text-left transition-all active:scale-95 group relative overflow-hidden flex items-center gap-4 cursor-pointer flex-1 min-w-[140px]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.05] group-hover:border-blue-500/20 flex items-center justify-center text-gray-400 group-hover:text-blue-400 transition-colors shrink-0">
                      {cat.includes('Phones') && <Smartphone size={14} />}
                      {cat.includes('Computers') && <Laptop size={14} />}
                      {cat.includes('TVs') && <Headphones size={14} />}
                      {cat.includes('Gaming') && <Gamepad2 size={14} />}
                      {(!cat.includes('Phones') && !cat.includes('Computers') && !cat.includes('TVs') && !cat.includes('Gaming')) && <Watch size={14} />}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white truncate max-w-[100px]">{cat.split(' & ')[0]}</h3>
                      <span className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest block mt-0.5 group-hover:text-white transition-colors">CONNECT DESK</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* 3. THE DYNAMIC HARDWARE INVENTORY FEED (FORMERLY #TECH-INVENTORY) */}
      <section id="tech-inventory" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-end mb-12 border-b border-white/[0.04] pb-6 text-left">
           <div className="space-y-2">
             <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase font-black">
               {category ? "CATEGORY DISPATCH" : searchQuery ? "SEARCH INDEX" : "HARDWARE RECON"}
             </span>
             <h2 className="text-4xl font-black tracking-tighter uppercase italic text-white leading-none">
               {category || (searchQuery ? `Search: ${searchQuery}` : 'Hardware Feed')}
             </h2>
           </div>
           <div className="flex items-center gap-4">
              {loadingProducts && <Loader2 size={16} className="animate-spin text-blue-500" />}
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {filteredProducts.length} Results
              </span>
           </div>
        </div>

        {filteredProducts.length === 0 && !loadingProducts ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-40 text-center bg-white/5 border border-white/10 rounded-[4rem] relative overflow-hidden backdrop-blur-xl"
          >
             <div className="absolute inset-0 bg-blue-600/5 animate-pulse" />
             <div className="relative z-10 max-w-md mx-auto space-y-8 px-6">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                <ShieldCheck className="text-blue-500" size={48} />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Sector Offline</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                  The hardware pool is currently empty for this specific sector. Our sourcing engineers are working on replenishment.
                </p>
              </div>
              <button 
                onClick={() => onCategorySelect(null)}
                className="w-full py-5 bg-blue-600 text-white font-black text-sm uppercase italic rounded-3xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all hover:bg-blue-500"
              >
                Reboot Hardware Feed
              </button>
            </div>
          </motion.div>
        ) : groupedMainProducts && !loadingProducts ? (
          <div className="space-y-32">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="space-y-12 text-left"
              >
                <div className="flex items-center gap-6 group">
                  <div className="flex flex-col">
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-500 transition-colors leading-none">{cat}</h3>
                    <div className="flex items-center gap-2 mt-1.5 font-mono">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{catProducts.length} Units Active</span>
                    </div>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 to-transparent" />
                  <button 
                    onClick={() => onCategorySelect(cat)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white hover:bg-blue-600/20 transition-all shadow-xl"
                  >
                    View Full Sector →
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-10">
                  {catProducts.slice(0, 3).map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={onAddToCart} 
                      onClick={() => onProductClick(product)}
                      onQuickView={onQuickView}
                      isWishlisted={isItemWishlisted(product.id)}
                      onToggleWishlist={onToggleWishlist}
                      isLiked={isItemLiked(product.id)}
                      onToggleLike={onToggleLike}
                    />
                  ))}
                </div>
              </motion.section>
            ))}

            {/* Recently Viewed Section */}
            {(() => {
              const stored = typeof window !== 'undefined' ? localStorage.getItem('recently_viewed') : null;
              const recentlyViewedIds = stored ? JSON.parse(stored) : [];
              const recentlyViewedProducts = products.filter(p => recentlyViewedIds.includes(p.id))
                .sort((a, b) => recentlyViewedIds.indexOf(a.id) - recentlyViewedIds.indexOf(b.id));

              if (recentlyViewedProducts.length === 0) return null;

              return (
                <motion.section 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="pt-20 border-t border-white/10 space-y-12 text-left"
                >
                  <div className="flex items-center gap-6 group">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Recently Deployed</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Your interaction history</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-blue-500/10 to-transparent" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {recentlyViewedProducts.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => { onProductClick(product); }}
                        className="cursor-pointer group/rv text-left"
                      >
                        <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 group-hover/rv:border-blue-500/30 transition-all mb-3 relative">
                           <img src={product.image} alt="" className="w-full h-full object-cover group-hover/rv:scale-110 transition-all duration-700" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/rv:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover/rv:text-white truncate">{product.name}</h4>
                        <p className="text-[9px] font-mono text-blue-500/80 mt-0.5">UGX {product.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              );
            })()}

            {/* Category Quick Badges footer */}
            <div className="py-20 border-t border-white/10">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 text-center mb-10">Direct Sector Access</p>
               <div className="flex flex-wrap justify-center gap-4">
                  {PRODUCT_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => onCategorySelect(cat)}
                      className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-blue-500/50 hover:bg-white/10 transition-all"
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-8">
            {loadingProducts ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl h-[450px] animate-pulse overflow-hidden">
                   <div className="aspect-square bg-white/5" />
                   <div className="p-6 space-y-4 text-left">
                      <div className="h-6 bg-white/5 rounded-full w-3/4" />
                      <div className="h-4 bg-white/5 rounded-full w-1/4" />
                      <div className="h-12 bg-white/5 rounded-2xl w-full" />
                   </div>
                </div>
              ))
            ) : (
              filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  onClick={() => onProductClick(product)}
                  onQuickView={onQuickView}
                  isWishlisted={isItemWishlisted(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  isLiked={isItemLiked(product.id)}
                  onToggleLike={onToggleLike}
                />
              ))
            )}
          </div>
        )}
      </section>

      {!category && !searchQuery && (
        <>
          {/* 4. REAL-TIME ORDER TRACKING PLATFORM */}
          <section id="live-logistics-radar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase">REAL-TIME LOGISTICS CONTROL</span>
              <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">Active Freight Registry</h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Input an order ID or launch a simulated diagnostic to run the full logistics cockpit.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Quick Mock Demos */}
              <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-[2.5rem] text-left flex flex-col justify-between space-y-6 lg:col-span-1">
                <div>
                  <span className="text-[#2563eb] text-[10px] font-mono tracking-widest font-black uppercase">DIAGNOSTIC SIMULATOR</span>
                  <h3 className="text-lg font-display font-bold text-white mt-2">Simulated Freight Logs</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Run simulated real-time telemetry representing active shipments crossing Uganda.
                  </p>
                </div>

                <div className="space-y-2.5 font-mono">
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

          {/* 5. VERIFIED CLIENT REVIEWS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono tracking-[0.4em] text-blue-500 uppercase font-black">STATION VERIFICATIONS</span>
              <h2 className="text-3xl sm:text-4xl font-display font-medium text-white tracking-tight">Active Customer Feedback</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-8 bg-white/[0.01] border border-white/[0.04] rounded-3xl text-left flex flex-col justify-between space-y-6">
                <div className="flex text-amber-500 gap-1"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <p className="text-sm italic font-medium font-serif text-gray-300 leading-relaxed font-sans">
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
                <p className="text-sm italic font-medium font-serif text-gray-300 leading-relaxed font-sans">
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
                <p className="text-sm italic font-medium font-serif text-gray-300 leading-relaxed font-sans">
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
        </>
      )}

    </div>
  );
}
