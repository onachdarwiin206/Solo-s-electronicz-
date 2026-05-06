import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute z-50 px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap pointer-events-none shadow-2xl ${getPositionClasses()}`}
          >
            {content}
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-neutral-900 border-white/10 rotate-45 ${
              position === 'top' ? 'top-full -translate-y-1/2 left-1/2 -translate-x-1/2 border-b border-r' :
              position === 'bottom' ? 'bottom-full translate-y-1/2 left-1/2 -translate-x-1/2 border-t border-l' :
              position === 'left' ? 'left-full -translate-x-1/2 top-1/2 -translate-y-1/2 border-t border-r' :
              'right-full translate-x-1/2 top-1/2 -translate-y-1/2 border-b border-l'
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
