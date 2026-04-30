import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface HeroProps {
  user: any;
  onLogin: () => void;
}

export function Hero({ user, onLogin }: HeroProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background Motion handled in CSS .motion-bg */}
      <div className="motion-bg animate-slide" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            SOLO'S ELECTRONICS
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            The next generation of tech is here. Computers, phones, and devices curated for the digital elite.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => {
                const shopSection = document.querySelector('section');
                shopSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
            >
              Shop Now
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {!user ? (
               <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 text-sm"
              >
                Sign In to Your Account
              </button>
            ) : (
              <button 
                onClick={() => {
                   const marketingPortal = document.getElementById('marketing-portal');
                   marketingPortal?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 text-sm"
              >
                Marketing Portal
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
