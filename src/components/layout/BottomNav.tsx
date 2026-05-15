import { Home, Package, User, Smartphone, Monitor, ShoppingBag, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: any) => void;
  cartCount: number;
}

export function BottomNav({ activeView, onViewChange, cartCount }: BottomNavProps) {
  const tabs = [
    { id: 'shop', label: 'Shop', icon: Home },
    { id: 'tracking', label: 'Track', icon: Package },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/10 md:hidden p-2 pb-6">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id || (tab.id === 'shop' && activeView === 'product-detail');
          
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id as any)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 transition-all",
                isActive ? "text-blue-500" : "text-gray-500"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                />
              )}
              <Icon size={20} fill={isActive ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              
              {tab.id === 'shop' && cartCount > 0 && (
                <span className="absolute top-1 right-2 bg-blue-600 text-white text-[8px] font-black px-1 rounded-full border border-black min-w-[14px]">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
