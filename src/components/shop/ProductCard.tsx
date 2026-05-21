import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Loader2, Heart, Bookmark, BadgeCheck, Eye, Star, MessageCircle, Info, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { OptimizedImage } from '../ui/OptimizedImage';

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

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getStockStatus = () => {
    const stock = product.stock || 0;
    if (stock <= 0) return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-500 border-red-500/30' };
    if (stock < 3) return { label: 'Low Stock', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' };
    return { label: 'In Stock', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
  };

  const stockStatus = getStockStatus();

  const handleWhatsAppBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello Solo Electronics, I want to buy the *${product.name}* (UGX ${product.price.toLocaleString()}).\n\nLink: ${window.location.origin}/product/${product.id}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        onClick={onClick}
        className="group relative bg-card backdrop-blur-sm border border-border rounded-3xl overflow-hidden hover:border-blue-500/50 transition-colors shadow-2xl cursor-pointer"
      >
        <div className="aspect-square overflow-hidden relative group/image">
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
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Carousel Controls */}
          {images.length > 1 && !product.video_url && (
            <>
              <button 
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-10"
              >
                <ChevronRight size={16} />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "w-1 h-1 rounded-full transition-all",
                      idx === currentImageIndex ? "bg-blue-500 w-3" : "bg-white/40"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
          
          {/* Interaction Buttons */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <Tooltip content={isWishlisted ? "Remove from Saved" : "Save for Later"} position="left">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist?.(product.id);
                }}
                className={cn(
                  "p-3 rounded-2xl backdrop-blur-md transition-all border",
                  isWishlisted 
                    ? "bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-900/40" 
                    : "bg-black/40 border-white/10 text-white hover:bg-black/60"
                )}
              >
                <Bookmark size={18} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </Tooltip>

            <Tooltip content="Quick Look" position="left">
              <button 
                onClick={handleQuickView}
                className="p-3 bg-black/40 border border-white/10 text-white rounded-2xl backdrop-blur-md hover:bg-black/60 transition-all"
              >
                <Eye size={18} />
              </button>
            </Tooltip>

            <Tooltip content={isLiked ? "Unlike" : "Like"} position="left">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLike?.(product.id);
                }}
                className={cn(
                  "p-3 rounded-2xl backdrop-blur-md transition-all border flex flex-col items-center gap-0.5",
                  isLiked 
                    ? "bg-pink-600 border-pink-400 text-white shadow-xl shadow-pink-900/40" 
                    : "bg-black/40 border-white/10 text-white hover:bg-black/60"
                )}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                {product.likes_count !== undefined && (
                  <span className="text-[8px] font-black">{product.likes_count}</span>
                )}
              </button>
            </Tooltip>
          </div>

          <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
            <div className={cn(
              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md transition-colors",
              stockStatus.color
            )}>
              {stockStatus.label}
            </div>
            {product.is_verified && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/80 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-green-400/30">
                <BadgeCheck size={12} />
                Verified
              </div>
            )}
          </div>

          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
            <div className="bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase text-white border border-blue-400/30">
              {product.category}
            </div>
            {product.price > 1000000 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/80 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-black border border-yellow-400/30">
                <BadgeCheck size={12} fill="currentColor" />
                Official Store
              </div>
            )}
            {product.price < 500000 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/80 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-orange-400/30">
                <Zap size={12} fill="currentColor" />
                Free Delivery
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-xl font-black text-foreground group-hover:text-blue-400 transition-colors line-clamp-1 italic uppercase tracking-tighter">
              {product.name}
            </h3>
            <p className="text-xl font-mono font-black text-blue-500 whitespace-nowrap">
              UGX {product.price.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-widest">
              {product.rating || 5}.0
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-medium leading-relaxed">
            {product.description}
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAdd}
              disabled={isAdding || (product.stock || 0) <= 0}
              className="py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black rounded-2xl flex items-center justify-center gap-2 transition-all group/btn border border-border shadow-xl active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-widest"
            >
              {isAdding ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
              )}
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
            
            <button
              onClick={handleWhatsAppBuy}
              className="py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all border border-green-400/30 shadow-xl shadow-green-900/20 active:scale-95 text-[10px] uppercase tracking-widest"
            >
              <MessageCircle size={16} fill="currentColor" />
              Buy Now
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
