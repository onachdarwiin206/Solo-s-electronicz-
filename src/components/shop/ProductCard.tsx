import { motion } from 'motion/react';
import { ShoppingCart, Plus, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  key?: string | number;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
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
        <div className="absolute top-4 left-4 bg-blue-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-white shadow-lg">
          {product.category}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xl font-mono font-bold text-blue-500">
            UGX {product.price.toLocaleString()}
          </p>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 mb-6 font-light">
          {product.description}
        </p>
        
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="w-full py-3 bg-white hover:bg-gray-200 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Adding...
            </>
          ) : (
            <>
              <Plus size={20} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
