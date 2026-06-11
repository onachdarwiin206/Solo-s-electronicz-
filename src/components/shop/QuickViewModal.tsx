import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, MessageCircle, BadgeCheck, Star, Shield, Zap, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { cn } from '../../lib/utils';
import { OptimizedImage } from '../ui/OptimizedImage';
import { triggerWhatsAppFlow } from '../ui/WhatsAppFloat';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const WHATSAPP_NUMBER = "256793405517";

export default function QuickViewModal({ product, onClose, onAddToCart }: QuickViewModalProps) {
  const [activeMedia, setActiveMedia] = useState(0);
  if (!product) return null;

  const allMedia = [
    ...(product.images || [product.image]),
    ...(product.videos || (product.video_url ? [product.video_url] : []))
  ].filter(Boolean);

  const handleWhatsAppBuy = () => {
    const message = `*Quick Inquiry: ${product.name}*\nPrice: UGX ${product.price.toLocaleString()}\n\nHello Solo's Electronics, I saw this in the quick view. Is it in stock?`;
    triggerWhatsAppFlow(message);
  };

  const currentMedia = allMedia[activeMedia];
  const isVideo = currentMedia?.includes('video') || currentMedia?.includes('.mp4');

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-5xl bg-card border border-border rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-y-auto max-h-[90vh]"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 z-50 p-3 bg-foreground/5 hover:bg-foreground/10 text-foreground rounded-full transition-all border border-border"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
              <div className="relative bg-foreground/5 flex flex-col">
                <div className="flex-1 relative overflow-hidden group">
                  {isVideo ? (
                    <video 
                      src={currentMedia} 
                      className="w-full h-full object-contain bg-black dark:bg-card" 
                      autoPlay 
                      muted 
                      loop 
                      playsInline 
                    />
                  ) : (
                    <OptimizedImage 
                      src={currentMedia} 
                      className="w-full h-full object-contain" 
                      alt={product.name} 
                    />
                  )}

                  {allMedia.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveMedia(prev => (prev - 1 + allMedia.length) % allMedia.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={() => setActiveMedia(prev => (prev + 1) % allMedia.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                {allMedia.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar justify-center border-t border-border">
                    {allMedia.map((media, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveMedia(idx)}
                        className={cn(
                          "w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0",
                          activeMedia === idx ? "border-blue-500 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        {media.includes('video') || media.includes('.mp4') ? (
                           <div className="w-full h-full bg-blue-500/20 flex items-center justify-center">
                              <Zap size={16} className="text-blue-500" />
                           </div>
                        ) : (
                           <OptimizedImage src={media} className="w-full h-full object-cover" alt={product.name} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {product.is_verified && (
                  <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-green-500/90 backdrop-blur-xl rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white border border-green-400/30 z-20 shadow-2xl">
                    <BadgeCheck size={14} className="text-white" /> Solo Verified
                  </div>
                )}
              </div>

              <div className="p-8 md:p-16 flex flex-col bg-background">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                      {product.category}
                    </span>
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border",
                      (product.stock || 0) > 0 ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-red-500/20 text-red-500 border-red-500/30"
                    )}>
                      {(product.stock || 0) > 0 ? `${product.stock} Units Syncing` : 'Depleted'}
                    </span>
                  </div>
                  <h2 className="text-5xl font-black text-foreground tracking-tighter mb-4 uppercase italic leading-[0.9]">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill={i < (product.rating || 5) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest font-mono">
                      Ref #{product.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="mb-12">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 italic">Standard Retail Value</div>
                  <p className="text-5xl font-black text-foreground font-mono tracking-tighter italic">UGX {product.price.toLocaleString()}</p>
                </div>

                <div className="space-y-8 mb-12 flex-1">
                  <div>
                    <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                      <Shield size={14} className="text-blue-500" /> Operational Specs
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">{product.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-foreground/5 rounded-3xl border border-border hover:border-blue-500/30 transition-colors">
                       <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><Zap size={14} className="text-yellow-500" /> Integrity</h4>
                       <p className="text-foreground font-black text-xs uppercase italic tracking-tighter">Factory Fresh</p>
                    </div>
                    <div className="p-5 bg-foreground/5 rounded-3xl border border-border hover:border-blue-500/30 transition-colors">
                       <h4 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><Truck size={14} className="text-blue-500" /> Logistics</h4>
                       <p className="text-foreground font-black text-xs uppercase italic tracking-tighter">Ready for Dispatch</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => { onAddToCart(product); onClose(); }} 
                    disabled={(product.stock || 0) <= 0}
                    className="group py-6 bg-foreground hover:bg-blue-600 text-background hover:text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50"
                  >
                    <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" /> Commit to Inventory
                  </button>
                  <button onClick={handleWhatsAppBuy} className="py-6 bg-green-600 font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 text-[11px] uppercase tracking-[0.2em] text-white">
                    <MessageCircle size={18} fill="currentColor" /> Encrypted Inquiry
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
