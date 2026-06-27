import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bookmark, X, ArrowRight } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

export interface ToastData {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-3 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const { id, productName, productImage, message, actionText, onAction, duration = 4000 } = toast;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
      layout
      className="w-full bg-[#07070c]/95 border border-white/[0.08] rounded-2.5xl p-4 flex flex-col gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl pointer-events-auto relative overflow-hidden group select-none"
    >
      {/* Background radial accent glow */}
      <span className="absolute -right-12 -top-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all duration-500 pointer-events-none" />

      <div className="flex gap-3 items-center">
        {/* Product Image */}
        <div className="w-11 h-11 rounded-xl bg-white/[0.02] border border-white/[0.06] p-1 flex items-center justify-center shrink-0">
          <OptimizedImage
            src={productImage}
            alt={productName}
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-left">
          <h5 className="text-[10px] font-mono tracking-widest text-blue-400 font-extrabold uppercase flex items-center gap-1.5">
            <Bookmark size={10} className="fill-blue-400" />
            Wishlist Added
          </h5>
          <h4 className="text-xs font-semibold text-white truncate pr-4 mt-0.5">
            {productName}
          </h4>
          <p className="text-[10px] text-zinc-400 font-medium">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(id)}
          className="absolute top-3 right-3 p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Action Button */}
      {actionText && onAction && (
        <button
          onClick={() => {
            onAction();
            onDismiss(id);
          }}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-blue-600/15 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-white text-[10.5px] font-mono tracking-widest uppercase font-extrabold rounded-xl transition-all duration-300 cursor-pointer group/btn"
        >
          {actionText}
          <ArrowRight size={11} className="transform transition-transform group-hover/btn:translate-x-1" />
        </button>
      )}

      {/* Progress Bar Timeline */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/[0.04]">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        />
      </div>
    </motion.div>
  );
}
