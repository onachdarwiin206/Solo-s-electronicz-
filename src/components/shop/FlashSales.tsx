import { useEffect, useState } from 'react';
import { Zap, Clock } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface FlashSalesProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export function FlashSales({ products, onAddToCart, onProductClick, onQuickView }: FlashSalesProps) {
  const [timeLeft, setTimeLeft] = useState('04:22:15');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const mins = 59 - now.getMinutes();
      const secs = 59 - now.getSeconds();
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashProducts = products.filter(p => p.featured).slice(0, 4);

  if (flashProducts.length === 0) return null;

  return (
    <div className="py-12 bg-gradient-to-br from-red-600/10 to-transparent rounded-[3rem] border border-red-500/10 mb-20 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse" />
      
      <div className="flex flex-col md:flex-row justify-between items-center px-8 mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-500/40">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Flash Sales</h2>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Limited Hardware Pulse</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-3xl">
          <Clock className="text-gray-500" size={16} />
          <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Ending In:</p>
          <div className="flex gap-2">
            {timeLeft.split(':').map((unit, i) => (
              <span key={i} className="bg-red-600 text-white font-black px-3 py-1.5 rounded-xl text-sm min-w-[40px] text-center shadow-lg shadow-red-500/20">
                {unit}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-8">
        {flashProducts.map(product => (
          <div key={product.id} className="relative group">
            <div className="absolute -top-3 -left-3 z-10 bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 uppercase tracking-widest italic flex items-center gap-1">
              <Zap size={10} fill="currentColor" />
              -25% OFF
            </div>
            <ProductCard 
              product={product} 
              onAddToCart={onAddToCart} 
              onClick={() => onProductClick(product)}
              onQuickView={onQuickView}
              isWishlisted={false}
              onToggleWishlist={() => {}}
              isLiked={false}
              onToggleLike={() => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
