import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, MessageCircle, BadgeCheck, Star, Shield, Zap, Truck } from 'lucide-react';
import { Product } from '../../types';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const WHATSAPP_NUMBER = "256793405517";

export function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  if (!product) return null;

  const handleWhatsAppBuy = () => {
    const message = `*Quick Inquiry: ${product.name}*\nPrice: UGX ${product.price.toLocaleString()}\n\nHello Solo's Electronics, I saw this in the quick view. Is it in stock?`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleAdd = () => {
    onAddToCart(product);
  };

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all border border-white/10"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square bg-white/5 border-r border-white/10 relative">
                {product.videoUrl ? (
                  <video src={product.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                )}
                {product.isVerified && (
                  <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-green-500/90 backdrop-blur rounded-full text-[8px] font-black uppercase tracking-widest text-white">
                    <BadgeCheck size={12} /> Verified Hardware
                  </div>
                )}
              </div>

              <div className="p-8 md:p-12 flex flex-col">
                <div className="mb-6">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    {product.category}
                  </span>
                  <h2 className="text-3xl font-black text-white tracking-tighter mt-4 mb-2 uppercase italic">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">High Spec Unit</span>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-3xl font-black text-white font-mono tracking-tighter">UGX {product.price.toLocaleString()}</p>
                </div>

                <div className="space-y-6 mb-8 flex-1">
                  <div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Shield size={12} className="text-blue-500" /> Description
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed line-clamp-4">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                       <h4 className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Zap size={10} className="text-yellow-500" /> Condition</h4>
                       <p className="text-white font-black text-[10px] uppercase italic">Genuine Unit</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                       <h4 className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Truck size={10} className="text-blue-500" /> Distribution</h4>
                       <p className="text-white font-black text-[10px] uppercase italic">Lira Local Stock</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleAdd} className="flex-1 py-4 bg-white text-black font-black rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest overflow-hidden">
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button onClick={handleWhatsAppBuy} className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-[10px] uppercase tracking-widest">
                    <MessageCircle size={16} fill="currentColor" /> Inquiry
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
