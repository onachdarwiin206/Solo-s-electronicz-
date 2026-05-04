import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, MessageCircle, BadgeCheck, Star, Shield, Zap, Truck } from 'lucide-react';
import { Product } from '../../types';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
}

const WHATSAPP_NUMBER = "256793405517";

export function ProductDetail({ product, onBack, onAddToCart }: ProductDetailProps) {
  const handleWhatsAppBuy = () => {
    const message = `*Inquiry: ${product.name}*\nPrice: UGX ${product.price.toLocaleString()}\n\nHello Solo's Electronics, I'm interested in this unit. Is it available for delivery in Lira?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        Back to Tech Feed
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="space-y-6">
          <div className="aspect-square rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 relative group">
            {product.videoUrl ? (
              <video src={product.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline controls />
            ) : (
              <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
            )}
            {product.isVerified && (
              <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                <BadgeCheck size={12} /> Verified Hardware
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="mb-8">
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mt-4 mb-2 uppercase italic leading-none">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Premium Performance</span>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-4xl font-black text-white font-mono tracking-tighter">UGX {product.price.toLocaleString()}</p>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Official Regional Price | Lira Delivery Included</p>
          </div>

          <div className="space-y-8 mb-12">
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Shield size={12} className="text-blue-500" /> Engineering Specs</h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={10} className="text-yellow-500" /> Grade</h4>
                 <p className="text-white font-black text-xs uppercase italic">Direct Import</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Truck size={10} className="text-blue-500" /> Availability</h4>
                 <p className="text-white font-black text-xs uppercase italic">{product.stock > 0 ? 'Ready for Lira' : 'Restocking'}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col sm:flex-row gap-4">
            <button onClick={() => onAddToCart(product)} className="flex-1 py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-xs uppercase tracking-widest group">
              <ShoppingCart size={18} className="group-hover:rotate-12 transition-transform" /> Add to Basket
            </button>
            <button onClick={handleWhatsAppBuy} className="flex-1 py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-green-900/20 text-xs uppercase tracking-widest">
              <MessageCircle size={18} fill="currentColor" /> Live Inquiry
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
