import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface HeroProps {
  user: any;
  onLogin: () => void;
  onShopNow: () => void;
  onMarketingClick: () => void;
  t: any;
}

export function Hero({ user, onLogin, onShopNow, onMarketingClick, t }: HeroProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            {t.hero_title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            {t.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onShopNow}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group"
            >
              {t.shop_now}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            {!user ? (
               <button 
                onClick={onLogin}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 text-sm"
              >
                {t.sign_in}
              </button>
            ) : (
              <button 
                onClick={onMarketingClick}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 text-sm"
              >
                {t.marketing_portal}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
