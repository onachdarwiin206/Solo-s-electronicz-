import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { OptimizedImage } from '../ui/OptimizedImage';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onRemove: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export function WishlistDrawer({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onAddToCart,
  onProductClick
}: WishlistDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" 
          />
          
          {/* Drawer Sidebar */}
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#030307] border-l border-white/[0.04] z-[110] flex flex-col shadow-2xl font-sans"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/90 backdrop-blur-md">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-medium text-white flex items-center gap-2 uppercase tracking-tight">
                    <Bookmark className="text-blue-500 fill-blue-500/20" size={16} />
                    Saved Hardware
                  </h2>
                </div>
                <p className="text-[10px] font-sans text-zinc-500 uppercase tracking-widest font-medium">
                  Your customized system components cache
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-zinc-900 border border-transparent rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* List Header Info */}
            <div className="px-6 py-4 bg-zinc-950/60 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-widest">
              <span>Saved Inventory</span>
              <span className="text-blue-400 font-extrabold">{items.length} units cached</span>
            </div>

            {/* Items Content Area */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-4">
              {items.length > 0 ? (
                <div className="space-y-3.5">
                  {items.map((item) => {
                    const itemImage = (item.images && item.images.length > 0) ? item.images[0] : item.image;
                    return (
                      <div 
                        key={item.id}
                        className="flex gap-4 p-4 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-3xl border border-white/[0.04] relative overflow-hidden group/item"
                      >
                        {/* Interactive Product Image Container */}
                        <div 
                          onClick={() => {
                            onProductClick(item);
                            onClose();
                          }}
                          className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/[0.05] bg-black/40 flex items-center justify-center cursor-pointer transition-transform group-hover/item:scale-[1.03]"
                        >
                          <OptimizedImage src={itemImage} alt={item.name} className="w-full h-full object-contain p-1.5" />
                        </div>

                        {/* Text Information */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                          <div className="flex justify-between items-start gap-2">
                            <div 
                              onClick={() => {
                                onProductClick(item);
                                onClose();
                              }}
                              className="cursor-pointer"
                            >
                              <span className="text-[9px] font-mono font-bold text-blue-500 uppercase block tracking-wider">
                                {item.category}
                              </span>
                              <h4 className="font-bold text-white text-xs uppercase truncate group-hover/item:text-blue-400 transition-colors">
                                {item.name}
                              </h4>
                            </div>
                            <button 
                              onClick={() => onRemove(item.id)} 
                              className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                              title="Remove from saved items"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          <div className="flex justify-between items-center mt-2 font-mono">
                            <p className="text-white text-xs font-bold">UGX {item.price.toLocaleString()}</p>
                            
                            {/* Fast Action Add to Cart */}
                            <button
                              onClick={() => onAddToCart(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/10 hover:border-blue-500 text-blue-400 hover:text-white text-[9px] font-mono tracking-widest uppercase font-extrabold rounded-xl transition-all duration-300 cursor-pointer shrink-0"
                            >
                              <ShoppingCart size={10} />
                              Add To Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-center justify-center text-zinc-600 mb-4">
                    <Bookmark size={24} />
                  </div>
                  <h3 className="text-white font-display text-sm uppercase tracking-wider">Your saved hardware is empty</h3>
                  <p className="text-zinc-500 text-[10.5px] max-w-xs mt-1 leading-relaxed">
                    Bookmark components while browsing products to curate your ultimate hardware pool in this tab.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions if items exist */}
            {items.length > 0 && (
              <div className="p-6 border-t border-zinc-900 bg-black/95">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-mono text-zinc-400 uppercase">
                    <span>Cured Sourcing Total:</span>
                    <span className="text-white font-black">
                      UGX {items.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Add all items from wishlist to cart
                      items.forEach(item => onAddToCart(item));
                      onClose();
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-mono tracking-widest text-[10px] font-bold uppercase rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 group/allBtn cursor-pointer"
                  >
                    Add All Items To Cart
                    <ArrowRight size={11} className="transform transition-transform group-hover/allBtn:translate-x-1" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
