import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ShoppingCart, MessageCircle, BadgeCheck, Star, 
  Shield, Zap, Truck, ChevronLeft, ChevronRight, Play, Maximize2,
  Bookmark, Heart, Calendar, ArrowRight, Sparkles, Cpu, Tag, CheckCircle2
} from 'lucide-react';
import { Product } from '../../types';
import { OptimizedImage } from '../ui/OptimizedImage';
import { cn } from '../../lib/utils';
import { triggerWhatsAppFlow } from '../ui/WhatsAppFloat';
import { ReviewSystem } from '../reviews/ReviewSystem';

interface ProductDetailProps {
  product: Product;
  products?: Product[]; // Optional list to display related products
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
}

const WHATSAPP_NUMBER = "256793405517";

export default function ProductDetail({ 
  product, 
  products = [],
  onBack, 
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  isLiked = false,
  onToggleLike
}: ProductDetailProps) {
  const [activeMedia, setActiveMedia] = useState(0);

  useEffect(() => {
    // Save to recently viewed cache log
    try {
      const stored = localStorage.getItem('recently_viewed');
      let items: string[] = stored ? JSON.parse(stored) : [];
      items = [product.id, ...items.filter(id => id !== product.id)].slice(0, 5);
      localStorage.setItem('recently_viewed', JSON.stringify(items));
    } catch {}
  }, [product.id]);

  const allMedia = [
    ...(product.images || []),
    product.image,
    ...(product.videos || []),
    product.video_url
  ].filter(Boolean) as string[];

  // Remove duplicates while preserving order
  const uniqueMedia = Array.from(new Set(allMedia));

  const handleWhatsAppBuy = () => {
    const message = `*Inquiry: ${product.name}*\nPrice: UGX ${product.price.toLocaleString()}\n\nHello Solo's Electronics, I'm interested in this unit. Is it available for delivery in Lira?`;
    triggerWhatsAppFlow(message);
  };

  const currentMedia = uniqueMedia[activeMedia];
  const isVideo = currentMedia?.includes('video') || currentMedia?.includes('.mp4');

  const nextMedia = () => setActiveMedia((prev) => (prev + 1) % uniqueMedia.length);
  const prevMedia = () => setActiveMedia((prev) => (prev - 1 + uniqueMedia.length) % uniqueMedia.length);

  // Filter 3 related products under same category
  const relatedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [products, product.category, product.id]);

  // Deterministic ratings
  const getProductRating = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const ratingVal = 4.6 + (Math.abs(hash) % 4) / 10;
    return ratingVal.toFixed(1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto py-12 md:py-16 px-4 sm:px-6 lg:px-8 space-y-24 bg-black text-white text-left"
    >
      {/* HEADER BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-900">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2.5 text-zinc-400 hover:text-white transition-all text-xs font-mono font-bold uppercase tracking-widest group bg-zinc-950 px-5 py-2.5 rounded-full border border-zinc-900 w-fit cursor-pointer"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portfolio
        </button>

        <nav className="flex items-center gap-2.5 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
          <span className="hover:text-white cursor-pointer" onClick={onBack}>Sectors</span>
          <ChevronRight size={12} />
          <span className="text-zinc-300 italic">{product.name}</span>
        </nav>
      </div>

      {/* STAGE A: SECTOR SPLIT (MASSIVE IMAGERY & DETAILS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Media Gallery (Massive Showcase Box) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="aspect-square rounded-[2rem] overflow-hidden bg-zinc-950 border border-zinc-900 relative group shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMedia}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full p-8 flex items-center justify-center"
              >
                {isVideo ? (
                  <video 
                    src={currentMedia} 
                    className="w-full h-full object-contain" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    controls 
                  />
                ) : (
                  <OptimizedImage src={currentMedia} className="max-w-full max-h-full object-contain filter drop-shadow-[0_20px_50px_rgba(255,255,255,0.05)]" alt={product.name} />
                )}
              </motion.div>
            </AnimatePresence>

            {uniqueMedia.length > 1 && (
              <>
                <button 
                  onClick={prevMedia}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-zinc-900/60 hover:bg-zinc-900 text-white rounded-full backdrop-blur-md border border-zinc-800/80 transition-all active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextMedia}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-zinc-900/60 hover:bg-zinc-900 text-white rounded-full backdrop-blur-md border border-zinc-800/80 transition-all active:scale-90"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {product.is_verified && (
              <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 backdrop-blur rounded-full text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/20 shadow-lg">
                <BadgeCheck size={11} /> Authentic Grade A+
              </div>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {uniqueMedia.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {uniqueMedia.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMedia(idx)}
                  className={cn(
                    "relative w-20 h-20 bg-zinc-950 rounded-2xl overflow-hidden border transition-all shrink-0 p-2 flex items-center justify-center",
                    activeMedia === idx 
                      ? "border-blue-500 scale-102 bg-zinc-900" 
                      : "border-zinc-900 opacity-60 hover:opacity-100 hover:border-zinc-800"
                  )}
                >
                  {media.includes('video') || media.includes('.mp4') ? (
                    <div className="w-full h-full bg-blue-500/10 flex items-center justify-center rounded-xl">
                       <Play size={16} className="text-blue-400" />
                    </div>
                  ) : (
                    <OptimizedImage src={media} className="max-w-full max-h-full object-contain" alt={`${product.name} thumbnail ${idx}`} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Context Details */}
        <div className="lg:col-span-6 flex flex-col space-y-8 lg:pl-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 bg-zinc-900/80 border border-zinc-800 text-zinc-300 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest leading-none">
                {product.category}
              </span>
              {(product.stock || 0) <= 0 ? (
                <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest leading-none">
                  Depleted
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest leading-none">
                  {product.stock} Units Online
                </span>
              )}

              {/* Saved & Like buttons */}
              <div className="flex gap-2 ml-auto">
                <button 
                  onClick={() => onToggleWishlist?.(product.id)}
                  className={cn(
                    "p-2.5 rounded-full transition-all border cursor-pointer",
                    isWishlisted ? "bg-white border-transparent text-black" : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800"
                  )}
                >
                  <Bookmark size={13} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => onToggleLike?.(product.id)}
                  className={cn(
                    "p-2.5 rounded-full transition-all border flex items-center gap-1.5 cursor-pointer",
                    isLiked ? "bg-pink-600 border-transparent text-white" : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800"
                  )}
                >
                  <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
                  {product.likes_count !== undefined && <span className="text-[9px] font-mono font-bold">{product.likes_count}</span>}
                </button>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-display font-medium text-white tracking-tight leading-[1.08] uppercase">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 py-2 border-b border-zinc-900 pb-4">
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill={i < Math.round(product.rating || 5) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{product.rating || 5.0} Score</span>
              <div className="h-3 w-px bg-zinc-800" />
              <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">ID Log: {product.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Pricing Banner */}
          <div className="p-6 bg-zinc-950 rounded-3xl border border-zinc-900 relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.02] blur-3xl pointer-events-none" />
            <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-1">Direct Procurement rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-mono text-zinc-400 font-bold uppercase leading-none">UGX</span>
              <p className="text-3xl sm:text-4xl font-mono font-black text-white leading-none tracking-tight">
                {product.price.toLocaleString()}
              </p>
            </div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-2">VAT & Kampala-Lira Logistics Included</p>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-500">Technical Specifications</h3>
            <p className="text-zinc-400 text-sm leading-relaxed font-sans font-medium mb-4">
              {product.description}
            </p>
            
            {product.specifications && (
              <div className="grid grid-cols-1 gap-2.5 bg-zinc-950 p-6 rounded-3xl border border-zinc-900">
                {product.specifications.split('\n').filter(s => s.trim()).map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-3 group/spec text-left">
                    <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
                    <span className="text-xs text-zinc-300 font-mono tracking-wide">{spec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Details Trio Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <Zap size={13} className="text-amber-500 mb-2.5" />
              <h4 className="text-[11px] font-bold text-white uppercase leading-none">Pristine Quality</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">Import Grade A+</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <Truck size={13} className="text-blue-500 mb-2.5" />
              <h4 className="text-[11px] font-bold text-white uppercase leading-none">Fast Transit</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">Immediate Dispatch</p>
            </div>
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
              <Shield size={13} className="text-emerald-500 mb-2.5" />
              <h4 className="text-[11px] font-bold text-white uppercase leading-none">Warranty</h4>
              <p className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">12 Months Hub Guarantee</p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => onAddToCart(product)} 
              disabled={(product.stock || 0) <= 0}
              className="py-4.5 bg-white hover:bg-neutral-100 text-black font-black text-xs font-mono tracking-widest rounded-full flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart size={15} /> 
              ADD TO BASKET
            </button>
            <button 
              onClick={handleWhatsAppBuy} 
              className="py-4.5 bg-[#25D366] hover:bg-emerald-500 text-white font-black text-xs font-mono tracking-widest rounded-full flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle size={15} fill="currentColor" /> 
              SECURE VIA WHATSAPP
            </button>
          </div>
        </div>
      </div>

      {/* STAGE B: PRODUCT DESIGNHIGHLIGHT spotlight */}
      <section className="p-10 bg-zinc-950/80 border border-zinc-900 rounded-[2.5rem] relative overflow-hidden text-center">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/[0.012] blur-3xl rounded-full pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="text-[10px] font-mono font-bold tracking-[0.4em] text-blue-500 uppercase">ENGINEERING ASSURANCES</span>
          <h2 className="text-2xl sm:text-4xl font-display font-medium text-white tracking-tight leading-tight uppercase">
            Pristine Hardware. Verified Authenticity.
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
            Every piece of electronic hardware is unsealed, inspected, and serialized under rigorous standard quality assurance check lists before dispatch to ensure defect-free regional deployment.
          </p>
        </div>
      </section>

      {/* STAGE C: REVIEWS AND CUSTOMER FEEDBACK */}
      <section className="pt-8 border-t border-zinc-900">
        <ReviewSystem product={product} />
      </section>

      {/* STAGE D: RELATED PRODUCTS Drawer */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-zinc-900 text-left space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-zinc-500 uppercase">SUGGESTED COMBINATIONS</span>
              <h2 className="text-2xl font-display font-medium text-white uppercase">Related Hardware</h2>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-3 py-1 rounded-full">
              Same Sector
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  // Scroll to top and switch to this product
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onProductClick(item);
                }}
                className="group relative rounded-[2rem] bg-[#070709] border border-zinc-900 hover:border-zinc-800 p-6 flex flex-col justify-between h-[320px] transition-all duration-300 text-left cursor-pointer overflow-hidden"
              >
                <div className="flex justify-between items-center z-10 mb-2">
                  <span className="px-2.5 py-1 bg-[#121215] rounded-full text-[8.5px] font-mono text-zinc-400 uppercase tracking-widest truncate">
                    {item.category.split(' ')[0]}
                  </span>
                  <span className="flex items-center gap-0.5 text-yellow-500 text-[10px] font-mono font-black">
                    <Star size={10} fill="currentColor" /> {getProductRating(item.name)}
                  </span>
                </div>

                <div className="h-32 w-full flex items-center justify-center relative my-1 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_20px_rgba(255,255,255,0.02)] transform transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-3 mt-auto">
                  <h4 className="text-sm font-display font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between pt-2.5 border-t border-zinc-900">
                    <span className="text-xs font-mono font-bold text-white">
                      UGX {item.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      VIEW <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
