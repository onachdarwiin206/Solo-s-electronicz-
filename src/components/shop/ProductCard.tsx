import { motion } from 'motion/react';
import { ShoppingCart, Plus, Loader2, Heart, Star, Bookmark } from 'lucide-react';
import { Product } from '../../types';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  isLiked?: boolean;
  onToggleLike?: (id: string) => void;
  key?: string | number;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  isWishlisted = false,
  onToggleWishlist,
  isLiked = false,
  onToggleLike
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    onAddToCart(product);
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-2xl"
    >
      <div className="aspect-square overflow-hidden relative">
        {product.videoUrl ? (
          <video
            src={product.videoUrl}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        
        {/* Interaction Buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
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
            title="Add to Wishlist"
          >
            <Bookmark size={18} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

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
            title="Like Product"
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            {product.likesCount !== undefined && (
               <span className="text-[8px] font-black">{product.likesCount}</span>
            )}
          </button>
        </div>

        <div className="absolute top-4 left-4 bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-white shadow-lg">
          {product.category}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xl font-mono font-bold text-blue-500 whitespace-nowrap">
            UGX {product.price.toLocaleString()}
          </p>
        </div>

        {/* Rating Display */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
            ))}
          </div>
          <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest">
            {product.rating || 5}.0
          </span>
        </div>

        <p className="text-sm text-gray-400 line-clamp-2 mb-6 font-light">
          {product.description}
        </p>
        
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="w-full py-4 bg-white hover:bg-blue-600 text-black hover:text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all group/btn shadow-xl hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Securing...
            </>
          ) : (
            <>
              <ShoppingCart size={20} className="group-hover/btn:scale-110 transition-transform" />
              Secure Ownership
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
