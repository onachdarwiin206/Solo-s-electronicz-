import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';
import Lottie from 'lottie-react';

interface SoloBotProps {
  user: any;
  onLogin: () => void;
  onViewTerms: () => void;
  onTrackOrder: () => void;
}

export function SoloBot({ user, onLogin, onViewTerms, onTrackOrder }: SoloBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Fetch a developer lottie animation
    fetch('https://assets3.lottiefiles.com/packages/lf20_w51pcehl.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Lottie fetch failed', err));

    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="pointer-events-auto bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl rounded-br-none shadow-2xl max-w-[280px] md:max-w-xs "
          >
            <div className="flex justify-between items-start mb-2">
               <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Guide (Solo)</span>
               <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                 <X size={16} />
               </button>
            </div>
            <p className="text-sm text-gray-100 leading-relaxed">
              Hey {user ? user.name.split(' ')[0] : ''}! I'm <span className="font-bold text-white">Solo</span>, your personal software engineer guide. I've built this store with a custom delivery system and digital receipts. How can I help you today?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {!user && (
                <button 
                  onClick={onLogin}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-full text-white border border-blue-400/30 transition-colors font-bold uppercase"
                >
                  Login / Sign Up
                </button>
              )}
              <button 
                onClick={onTrackOrder}
                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full text-white border border-white/10 transition-colors"
              >
                Track Order
              </button>
              <button 
                onClick={onViewTerms}
                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-full text-white border border-white/10 transition-colors"
              >
                Terms & Policy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl overflow-hidden group"
      >
        {animationData ? (
          <Lottie animationData={animationData} loop={true} className="w-full h-full scale-[1.6]" />
        ) : (
          <MessageSquare className="text-white" size={32} />
        )}
        <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/10 transition-colors" />
      </motion.button>
    </div>
  );
}
