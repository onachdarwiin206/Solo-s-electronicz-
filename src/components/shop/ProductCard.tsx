import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Loader2, Heart, Bookmark, BadgeCheck, Eye, Star, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(prev => prev === ratio ? prev : ratio);
    }
  };

  const images = React.useMemo(() => {
    const rawImages = product.images && product.images.length > 0 ? product.images : [product.image];
    const filtered = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');
    return filtered.length > 0 ? filtered : [''];
  }, [product.images ? product.images.join(',') : '', product.image]);

  useEffect(() => {
    const imageUrl = images[currentImageIndex];
    if (imageUrl) {
      const img = new Image();
      img.src = imageUrl;
      if (img.complete) {
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = img.naturalWidth / img.naturalHeight;
          setImageAspectRatio(prev => prev === ratio ? prev : ratio);
        }
      } else {
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            setImageAspectRatio(prev => prev === ratio ? prev : ratio);
          }
        };
      }
    }
  }, [images, currentImageIndex]);

  useEffect(() => {
    if (images.length <= 1 || product.video_url) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
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
    if (stock <= 0) return { label: 'Sold Out', color: 'text-red-500 bg-red-500/10', percent: 0 };
    if (stock < 6) return { label: `${stock} Left • Selling Fast`, color: 'text-amber-600 bg-amber-500/10', percent: (stock / 12) * 100 };
    return { label: 'In Stock • Ready to Ship', color: 'text-emerald-600 bg-emerald-500/10', percent: Math.min(100, (stock / 60) * 100) };
  };

  const stockStatus = getStockStatus();

  const multiplier = product.id === 'p1' ? 1.18 : product.id === 'p2' ? 1.12 : 1.15;
  const originalPrice = Math.round((product.price * multiplier) / 10000) * 10000;
  const discountPercentage = Math.round((1 - (product.price / originalPrice)) * 100);
  const savingsAmount = originalPrice - product.price;

  const handleWhatsAppBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello Emma Electronics, I want to buy the *${product.name}* (UGX ${product.price.toLocaleString()}).\n\nLink: ${window.location.origin}/product/${product.id}`;
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
    <div className="relative isolate h-full">
      <motion.div
        ref={cardRef}
        whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
        onClick={onClick}
        className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.04)] hover:border-zinc-300 dark:hover:border-zinc-700/80 cursor-pointer h-full min-h-[500px]"
      >
        {/* Top visual content area (Framed image) */}
        <div>
          <div 
            style={{ aspectRatio: '1.05' }}
            className="relative w-full rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-2.5 sm:p-3.5 transition-all duration-300"
          >
            {/* Tag over list */}
            <span className="absolute top-3 left-3 z-20 flex flex-col gap-1 items-start">
              <span className="px-2.5 py-1 bg-neutral-900 dark:bg-white text-white dark:text-black text-[9px] font-mono font-bold tracking-wider rounded-lg shadow-sm">
                {discountPercentage}% OFF
              </span>
              {product.is_verified !== false && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[8px] font-mono font-bold uppercase tracking-wider">
                  <BadgeCheck size={8} />
                  Genuine
                </span>
              )}
            </span>

            {/* Quick Actions overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Tooltip content={isWishlisted ? "Remove Wishlist" : "Wishlist"} position="left">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist?.(product.id);
                  }}
                  className={cn(
                    "p-2 rounded-xl backdrop-blur-md border outline-none cursor-pointer shadow-sm transition-all",
                    isWishlisted 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-white hover:dark:bg-zinc-900"
                  )}
                >
                  <Bookmark size={14} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </Tooltip>

              <Tooltip content="Quick View" position="left">
                <button 
                  onClick={handleQuickView}
                  className="p-2 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl backdrop-blur-md hover:bg-white hover:dark:bg-zinc-900 shadow-sm transition-all outline-none cursor-pointer"
                >
                  <Eye size={14} />
                </button>
              </Tooltip>

              <Tooltip content={isLiked ? "Unlike" : "Like"} position="left">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike?.(product.id);
                  }}
                  className={cn(
                    "p-2 rounded-xl backdrop-blur-md border flex flex-col items-center gap-0.5 outline-none cursor-pointer shadow-sm transition-all",
                    isLiked 
                      ? "bg-rose-600 border-rose-500 text-white" 
                      : "bg-white/80 dark:bg-zinc-900/80 border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-white hover:dark:bg-zinc-900"
                  )}
                >
                  <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                </button>
              </Tooltip>
            </div>

            {/* Video/Image Render */}
            {product.video_url ? (
              <video
                src={product.video_url}
                className="w-full h-full object-cover rounded-inherit"
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
                  className="w-full h-full flex items-center justify-center"
                >
                  <OptimizedImage
                    src={images[currentImageIndex]}
                    alt={product.name}
                    onLoad={handleImageLoad}
                    className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500 select-none"
                  />
                </motion.div>
              </AnimatePresence>
            )}

            {/* Image carousel buttons */}
            {images.length > 1 && !product.video_url && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 dark:bg-zinc-900/90 text-foreground border border-neutral-200 dark:border-zinc-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 cursor-pointer shadow-sm"
                >
                  <ChevronLeft size={12} />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/90 dark:bg-zinc-900/90 text-foreground border border-neutral-200 dark:border-zinc-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 cursor-pointer shadow-sm"
                >
                  <ChevronRight size={12} />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((_, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "w-1 h-1 rounded-full transition-all duration-300",
                        idx === currentImageIndex ? "bg-neutral-800 dark:bg-white w-2.5" : "bg-neutral-300 dark:bg-zinc-700"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Core product information */}
          <div className="mt-4 text-left space-y-1.5">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 dark:text-zinc-400 uppercase font-bold block">
              {product.category}
            </span>
            
            <h3 className="text-base font-sans font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {product.name}
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed min-h-[36px]">
              {product.description}
            </p>

            {/* Minimal Stock status bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[9px] font-mono font-semibold uppercase tracking-wider">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {stockStatus.label}
                </span>
                <span className="text-zinc-500 dark:text-zinc-500">OUTPOST</span>
              </div>
              <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${stockStatus.percent}%` }}
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    product.stock === 0 ? "bg-red-500" :
                    (product.stock || 0) < 6 ? "bg-amber-500" :
                    "bg-blue-600"
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing and Action row */}
        <div className="mt-5">
          <div className="py-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-left">
            <div>
              <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold block">PRICE</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-mono font-bold text-zinc-900 dark:text-white">
                  UGX {product.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 line-through">
                  UGX {originalPrice.toLocaleString()}
                </span>
              </div>
            </div>
            
            <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">
              Save {discountPercentage}%
            </span>
          </div>

          {/* Action buttons (Touch interactive cards) */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <button
              onClick={handleAdd}
              disabled={isAdding || (product.stock || 0) <= 0}
              className="py-2.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-semibold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer shadow-sm"
            >
              {isAdding ? (
                <Loader2 className="animate-spin text-current" size={11} />
              ) : (
                <ShoppingCart size={11} />
              )}
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
            
            <button
              onClick={handleWhatsAppBuy}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <WhatsAppIcon size={11} />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Fly animation */}
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
            className="pointer-events-none bg-blue-500 shadow-md"
          >
            <OptimizedImage src={product.image} alt={product.name} className="w-full h-full object-cover rounded-inherit" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
