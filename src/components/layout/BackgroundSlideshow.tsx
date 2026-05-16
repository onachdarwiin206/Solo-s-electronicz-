import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OptimizedImage } from '../ui/OptimizedImage';

const BACKGROUNDS = [
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=60&w=1200&auto=format&fit=crop', // Deep Blue
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=60&w=1200&auto=format&fit=crop', // Purple Tech
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=60&w=1200&auto=format&fit=crop', // Cyan Circuit
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=60&w=1200&auto=format&fit=crop', // Dark Modern
];

export function BackgroundSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 8000); // Change image every 8 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-black/60 z-10" />
          <OptimizedImage 
            src={BACKGROUNDS[index]} 
            alt="Background" 
            className="w-full h-full"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
