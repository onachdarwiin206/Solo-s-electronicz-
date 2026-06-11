import { motion } from 'motion/react';
import { useTheme } from '../../ThemeContext';

export function BackgroundSlideshow() {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-black">
      <div className="absolute inset-0 bg-background/95 transition-colors duration-1000" />

      {/* Dynamic drifting glow blobs inside frosted glass mode */}
      {theme === 'glass' && (
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <motion.div 
            animate={{ 
              x: [0, 80, -40, 0],
              y: [0, -50, 40, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/25 blur-[120px] top-[-10%] left-[-10%]" 
          />
          <motion.div 
            animate={{ 
              x: [0, -90, 50, 0],
              y: [0, 60, -80, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[140px] bottom-[-15%] right-[-10%]" 
          />
          <motion.div 
            animate={{ 
              x: [0, 40, -60, 0],
              y: [0, 80, -40, 0],
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[100px] top-[30%] left-[25%]" 
          />
        </div>
      )}
    </div>
  );
}
