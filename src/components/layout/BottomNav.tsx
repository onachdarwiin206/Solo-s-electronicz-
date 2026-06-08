import { Home, Search, ShoppingBag, Package, User } from 'lucide-react';
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
    { id: 'search', label: 'Search', icon: Search },
    { id: 'cart', label: 'Cart', icon: ShoppingBag },
    { id: 'tracking', label: 'Track', icon: Package },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-t border-border md:hidden p-2 pb-5">
      <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Determine if tab is active
          const isActive = 
            (tab.id === 'shop' && (activeView === 'shop' || activeView === 'product-detail')) ||
            (tab.id === 'tracking' && activeView === 'tracking') ||
            (tab.id === 'profile' && activeView === 'auth') ||
            (tab.id === activeView);
          
          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id as any)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-1 px-3 transition-all min-w-[56px] h-full rounded-2xl active:bg-foreground/5",
                isActive ? "text-blue-500 font-bold" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 w-8 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative p-1">
                <Icon size={20} fill={isActive && tab.id !== 'search' ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />
                
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-blue-600 text-white text-[8px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border border-background shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
