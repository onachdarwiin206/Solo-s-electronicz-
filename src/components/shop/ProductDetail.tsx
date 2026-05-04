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
    const message = `Hello Solos Engineering, I'm interested in the ${product.name} (UGX ${product.price.toLocaleString()}). Can I get more details?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8"
    >
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Engineering Hub
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Media Section */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 relative">
            {product.videoUrl ? (
              <video 
                src={product.videoUrl} 
                className="w-full h-full object-cover"
                autoPlay 
                muted 
                loop 
                playsInline
                controls
              />
            ) : (
              <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
            )}
            {product.isVerified && (
              <div className="absolute bottom-8 left-8 flex items-center gap-2 px-4 py-2 bg-green-500/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
                <BadgeCheck size={14} />
                Verified Authentic Hardware
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <div className="mb-8">
            <span className="px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
              {product.category}
            </span>
            <h1 className="text-5xl font-black text-white tracking-tighter mt-4 mb-2 uppercase italic">
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-xs font-mono text-gray-500 font-bold uppercase tracking-widest">
                {product.rating || 5}.0 Performance Rating
              </span>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-4xl font-black text-white font-mono tracking-tighter">
              UGX {product.price.toLocaleString()}
            </p>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
              Standard Regional Pricing | Inc. VAT
            </p>
          </div>

          <div className="space-y-8 mb-12">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield size={14} className="text-blue-500" /> Technical Overview
              </h3>
              <p className="text-gray-400 leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Zap size={10} className="text-yellow-500" /> Condition
                 </h4>
                 <p className="text-white font-bold text-sm uppercase italic">High-Grade Stock</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Truck size={10} className="text-blue-500" /> Availability
                 </h4>
                 <p className="text-white font-bold text-sm uppercase italic">{product.stock > 0 ? 'Ready for Dispatch' : 'Awaiting Import'}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onAddToCart(product)}
              className="py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 active:scale-95 text-xs uppercase tracking-widest"
            >
              <ShoppingCart size={20} />
              Acquire Item
            </button>
            <button
              onClick={handleWhatsAppBuy}
              className="py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all border border-green-400/30 shadow-xl shadow-green-900/20 active:scale-95 text-xs uppercase tracking-widest"
            >
              <MessageCircle size={20} fill="currentColor" />
              Direct Inquiry
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
