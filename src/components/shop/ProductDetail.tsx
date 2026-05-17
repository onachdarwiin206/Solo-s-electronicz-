import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ShoppingCart, MessageCircle, BadgeCheck, Star, 
  Shield, Zap, Truck, ChevronLeft, ChevronRight, Play, Maximize2,
  Bookmark, Heart
} from 'lucide-react';
import { Product } from '../../types';
import { ReviewSystem } from '../reviews/ReviewSystem';
import { OptimizedImage } from '../ui/OptimizedImage';
import { cn } from '../../lib/utils';

interface ProductDetailProps {
  product: Product;
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
  onBack, 
  onAddToCart,
  isWishlisted = false,
  onToggleWishlist,
  isLiked = false,
  onToggleLike
}: ProductDetailProps) {
  const [activeMedia, setActiveMedia] = useState(0);

  useState(() => {
    // Save to recently viewed
    const stored = localStorage.getItem('recently_viewed');
    let items: string[] = stored ? JSON.parse(stored) : [];
    items = [product.id, ...items.filter(id => id !== product.id)].slice(0, 5);
    localStorage.setItem('recently_viewed', JSON.stringify(items));
  });

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
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const currentMedia = uniqueMedia[activeMedia];
  const isVideo = currentMedia?.includes('video') || currentMedia?.includes('.mp4');

  const nextMedia = () => setActiveMedia((prev) => (prev + 1) % uniqueMedia.length);
  const prevMedia = () => setActiveMedia((prev) => (prev - 1 + uniqueMedia.length) % uniqueMedia.length);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto py-8 md:py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-3 text-gray-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] group bg-white/5 px-6 py-3 rounded-full border border-white/10 w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Return to Feed
        </button>

        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <span className="hover:text-blue-500 cursor-pointer" onClick={onBack}>Home</span>
          <ChevronRight size={12} />
          <span className="hover:text-blue-500 cursor-pointer" onClick={onBack}>{product.category}</span>
          <ChevronRight size={12} />
          <span className="text-white italic">{product.name}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20 items-start">
        {/* Media Gallery Section */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 relative group shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMedia}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {isVideo ? (
                  <video 
                    src={currentMedia} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    muted 
                    loop 
                    playsInline 
                    controls 
                  />
                ) : (
                  <OptimizedImage src={currentMedia} className="w-full h-full object-cover" alt={product.name} />
                )}
              </motion.div>
            </AnimatePresence>

            {uniqueMedia.length > 1 && (
              <>
                <button 
                  onClick={prevMedia}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextMedia}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {product.is_verified && (
              <div className="absolute top-8 left-8 flex items-center gap-3 px-5 py-2.5 bg-green-500/90 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl border border-green-400/30">
                <BadgeCheck size={16} /> Verified Unit
              </div>
            )}

            {isVideo && (
              <div className="absolute bottom-8 right-8 p-4 bg-blue-500/80 backdrop-blur-xl rounded-full text-white shadow-2xl border border-blue-400/30">
                <Play size={20} fill="currentColor" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {uniqueMedia.length > 1 && (
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {uniqueMedia.map((media, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMedia(idx)}
                  className={cn(
                    "relative w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ring-offset-4 ring-offset-black",
                    activeMedia === idx 
                      ? "border-blue-500 ring-2 ring-blue-500/50 scale-105" 
                      : "border-white/10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  {media.includes('video') || media.includes('.mp4') ? (
                    <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                       <Play size={24} className="text-blue-500" />
                    </div>
                  ) : (
                    <OptimizedImage src={media} className="w-full h-full object-cover" alt={`${product.name} gallery ${idx}`} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="flex flex-col">
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
                {product.category}
              </span>
              {(product.stock || 0) > 0 ? (
                <span className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
                  {product.stock} Units Syncing
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
                  Depleted
                </span>
              )}

              <div className="flex gap-2 ml-auto">
                <button 
                  onClick={() => onToggleWishlist?.(product.id)}
                  className={cn(
                    "p-3 rounded-2xl transition-all border",
                    isWishlisted ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                  )}
                >
                  <Bookmark size={18} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => onToggleLike?.(product.id)}
                  className={cn(
                    "p-3 rounded-2xl transition-all border flex items-center gap-2",
                    isLiked ? "bg-pink-600 border-pink-500 text-white" : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                  )}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  {product.likes_count !== undefined && <span className="text-[10px] font-black">{product.likes_count}</span>}
                </button>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 uppercase italic leading-[0.9]">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-6 mt-8">
              <div className="flex text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
                ))}
              </div>
              <div className="h-4 w-px bg-white/10" />
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest font-mono">ID: {product.id.slice(0, 12)}</span>
            </div>
          </div>

          <div className="mb-12 p-8 bg-white/5 rounded-[2rem] border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all" />
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 italic">Solo Regional Authorization Price</div>
            <div className="flex items-baseline gap-3">
              <p className="text-6xl font-black text-white font-mono tracking-tighter italic">UGX {product.price.toLocaleString()}</p>
            </div>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">Lira Logistics Included • Instant Delivery Area</p>
          </div>

          <div className="space-y-10 mb-12">
            <div>
              <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                <Shield size={16} className="text-blue-500" /> Technical Dossier
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed font-medium font-serif italic border-l-4 border-blue-500/30 pl-6 mb-8">
                {product.description}
              </p>
              
              {product.specifications && (
                <div className="grid grid-cols-1 gap-3 mt-8">
                  {product.specifications.split('\n').filter(s => s.trim()).map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-4 group/spec">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full group-hover/spec:scale-150 transition-transform" />
                      <span className="text-sm text-gray-400 font-medium group-hover/spec:text-white transition-colors uppercase tracking-widest">{spec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                 <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Zap size={14} className="text-yellow-500" /> Grade
                 </h4>
                 <p className="text-white font-black text-sm uppercase italic tracking-tighter">Direct Import</p>
                 <span className="text-[9px] text-gray-500 font-bold uppercase block mt-1">A+ Inventory</span>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                 <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Truck size={14} className="text-blue-500" /> Logistics
                 </h4>
                 <p className="text-white font-black text-sm uppercase italic tracking-tighter">
                   {(product.stock || 0) > 0 ? 'Ready for Lira' : 'Restocking Pool'}
                 </p>
                 <span className="text-[9px] text-gray-500 font-bold uppercase block mt-1">Instant Dispatch</span>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                 <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <Maximize2 size={14} className="text-emerald-500" /> Warranty
                 </h4>
                 <p className="text-white font-black text-sm uppercase italic tracking-tighter">12 Months</p>
                 <span className="text-[9px] text-gray-500 font-bold uppercase block mt-1">Solo Assurance</span>
              </div>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button 
              onClick={() => onAddToCart(product)} 
              disabled={(product.stock || 0) <= 0}
              className="py-6 bg-white hover:bg-blue-600 text-black hover:text-white font-black rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 text-[12px] uppercase tracking-[0.25em] shadow-2xl disabled:opacity-50 group"
            >
              <ShoppingCart size={22} className="group-hover:rotate-12 transition-transform" /> 
              Commit to Basket
            </button>
            <button 
              onClick={handleWhatsAppBuy} 
              className="py-6 bg-green-600 hover:bg-green-500 text-white font-black rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-green-900/40 text-[12px] uppercase tracking-[0.25em]"
            >
              <MessageCircle size={22} fill="currentColor" /> 
              Live Procurement
            </button>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="pt-24 border-t border-white/10">
        <div className="max-w-4xl">
          <ReviewSystem product={product} />
        </div>
      </div>
    </motion.div>
  );
}
