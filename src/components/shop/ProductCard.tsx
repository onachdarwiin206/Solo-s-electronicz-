import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Loader2, Heart, Bookmark, BadgeCheck, Eye, Star, MessageCircle, Info, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { OptimizedImage } from '../ui/OptimizedImage';
import { triggerWhatsAppFlow } from '../ui/WhatsAppFloat';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  onClick?: () => void;
  onQuickView?: (product: Product) => void;
}

const WHATSAPP_NUMBER = "256793405517";

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

export function ProductCard({ 
  product, 
  onAddToCart, 
  isWishlisted = false,
  onToggleWishlist,
  isLiked = false,
  onToggleLike,
  onClick,
  onQuickView
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const getFilteredImages = () => {
    const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
    const filtered = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');
    return filtered.length > 0 ? filtered : [''];
  };

  const images = getFilteredImages();

  useEffect(() => {
    if (images.length <= 1 || product.video_url) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000); // comfortable auto-slide pace
    return () => clearInterval(interval);
  }, [images.length, product.video_url]);

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getStockStatus = () => {
    const stock = Number(product.stock) || 0;
    if (stock <= 0) return { label: 'Sold Out', color: 'text-red-400 bg-red-400/10 border-red-500/20', percent: 0 };
    if (stock < 6) return { label: `${stock} Units Left • Selling Fast`, color: 'text-orange-400 bg-orange-400/10 border-orange-500/20', percent: (stock / 12) * 100 };
    return { label: 'In Stock • Ready to Ship', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20', percent: Math.min(100, (stock / 60) * 100) };
  };

  const stockStatus = getStockStatus();

  // Deterministic original price & savings calculations for premium look
  const multiplier = product.id === 'p1' ? 1.18 : product.id === 'p2' ? 1.12 : 1.15;
  const originalPrice = Math.round((product.price * multiplier) / 10000) * 10000;
  const discountPercentage = Math.round((1 - (product.price / originalPrice)) * 100);
  const savingsAmount = originalPrice - product.price;

  const handleWhatsAppBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello Solo Electronics, I want to buy the *${product.name}* (UGX ${product.price.toLocaleString()}).\n\nLink: ${window.location.origin}/product/${product.id}`;
    triggerWhatsAppFlow(message);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ((product.stock || 0) <= 0) return;
    
    setIsAdding(true);
    setIsFlying(true);
    onAddToCart(product);
    
    setTimeout(() => {
      setIsAdding(false);
      setIsFlying(false);
    }, 1000);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <div className="relative isolate">
      <motion.div
        ref={cardRef}
        whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
        onClick={onClick}
        className="group relative bg-[#090a0f]/90 dark:bg-card border border-white/[0.04] hover:border-blue-500/45 rounded-[2.25rem] overflow-hidden transition-all duration-300 shadow-[0_15px_45px_0_rgba(0,0,0,0.18)] hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] cursor-pointer flex flex-col justify-between h-full min-h-[490px]"
      >
        {/* Card backdrop element */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />

        <div className="aspect-square relative w-full overflow-hidden bg-foreground/[0.02]">
          {/* Discount Percentage Ribbon overlay */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 items-start">
            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-mono font-bold tracking-tight rounded-full shadow-lg shadow-blue-500/20 uppercase">
              {discountPercentage}% OFF
            </span>
            {product.is_verified !== false && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider">
                <BadgeCheck size={9} className="text-emerald-400" />
                Genuine
              </span>
            )}
          </div>

          {product.video_url ? (
            <video
              src={product.video_url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <OptimizedImage
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain p-1.5 transform group-hover:scale-[1.08] transition-transform duration-700 select-none"
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Carousel Controls */}
          {images.length > 1 && !product.video_url && (
            <>
              <button 
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/45 hover:bg-black/85 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/45 hover:bg-black/85 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              >
                <ChevronRight size={14} />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-1 h-1 rounded-full transition-all duration-300",
                      idx === currentImageIndex ? "bg-blue-500 w-3" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#090a0f] opacity-90 pointer-events-none" />
          
          {/* Interaction Slide-In/Quick action overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <Tooltip content={isWishlisted ? "Remove from Wishlist" : "Wishlist"} position="left">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist?.(product.id);
                }}
                className={cn(
                  "p-2.5 rounded-xl backdrop-blur-md transition-all border outline-none cursor-pointer",
                  isWishlisted 
                    ? "bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-900/40" 
                    : "bg-black/30 border-white/10 text-white hover:bg-black/60"
                )}
              >
                <Bookmark size={15} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </Tooltip>

            <Tooltip content="Quick Look" position="left">
              <button 
                onClick={handleQuickView}
                className="p-2.5 bg-black/30 border border-white/10 text-white rounded-xl backdrop-blur-md hover:bg-black/60 transition-all outline-none cursor-pointer"
              >
                <Eye size={15} />
              </button>
            </Tooltip>

            <Tooltip content={isLiked ? "Unlike" : "Like"} position="left">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike?.(product.id);
                }}
                className={cn(
                  "p-2.5 rounded-xl backdrop-blur-md transition-all border flex flex-col items-center gap-0.5 outline-none cursor-pointer",
                  isLiked 
                    ? "bg-rose-600 border-rose-400 text-white shadow-xl shadow-rose-900/40" 
                    : "bg-black/30 border-white/10 text-white hover:bg-black/60"
                )}
              >
                <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                {product.likes_count !== undefined && (
                  <span className="text-[7px] font-mono font-bold leading-none">{product.likes_count}</span>
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Info/CTA Area */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Category / Visual Pill */}
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-zinc-500 uppercase tracking-widest font-black">
                {product.category}
              </span>
            </div>

            {/* Product Name (Space Grotesk style paired) */}
            <h3 className="text-base sm:text-lg font-display font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1 leading-tight">
              {product.name}
            </h3>

            {/* Description (Inter style) */}
            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed min-h-[32px]">
              {product.description}
            </p>

            {/* Dynamic Interactive Stock indicator with progress bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[8.5px] font-mono font-bold uppercase tracking-wider">
                <span className={stockStatus.percent < 50 ? "text-orange-400 animate-pulse" : "text-zinc-500"}>
                  {stockStatus.label}
                </span>
                <span className="text-zinc-500 font-normal">UG STORE</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.02]">
                <div 
                  style={{ width: `${stockStatus.percent}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    product.stock === 0 ? "bg-red-500" :
                    (product.stock || 0) < 6 ? "bg-gradient-to-r from-orange-500 to-red-500" :
                    "bg-gradient-to-r from-blue-500 to-indigo-500"
                  )}
                />
              </div>
            </div>

            {/* Pricing Section (High-conversion Jumia & Apple hybrid styling) */}
            <div className="pt-2 bg-[#0d0e14]/50 border border-white/[0.02] p-3 rounded-2xl flex flex-col justify-center text-left">
              <div className="flex items-baseline gap-2">
                <span className="text-sm sm:text-base font-mono font-black text-white whitespace-nowrap">
                  UGX {product.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono font-medium text-zinc-500 line-through whitespace-nowrap">
                  UGX {originalPrice.toLocaleString()}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wide mt-0.5">
                Saved: UGX {savingsAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action buttons (reveals on hover nicely, completely clean and touch interactive) */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/[0.04] z-10">
            <button
              onClick={handleAdd}
              disabled={isAdding || (product.stock || 0) <= 0}
              className="py-3 bg-white hover:bg-neutral-100 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 shadow-lg shadow-white/5 cursor-pointer"
            >
              {isAdding ? (
                <Loader2 className="animate-spin text-black" size={12} />
              ) : (
                <ShoppingCart size={11} className="text-black" />
              )}
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
            
            <button
              onClick={handleWhatsAppBuy}
              className="py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <WhatsAppIcon size={11} />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Fly-to-cart Portal Element */}
      <AnimatePresence>
        {isFlying && (
          <motion.div
            initial={{ 
              position: 'fixed',
              top: cardRef.current?.getBoundingClientRect().top || 0,
              left: cardRef.current?.getBoundingClientRect().left || 0,
              width: 100,
              height: 100,
              zIndex: 1000,
              opacity: 1,
              scale: 1,
              borderRadius: '1.5rem',
            }}
            animate={{ 
              top: 20,
              left: window.innerWidth - 100,
              width: 20,
              height: 20,
              opacity: 0,
              scale: 0.2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="pointer-events-none bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
          >
            <OptimizedImage src={product.image} alt={product.name} className="w-full h-full object-cover rounded-inherit" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
