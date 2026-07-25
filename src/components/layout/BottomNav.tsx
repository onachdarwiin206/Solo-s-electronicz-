import { Home, Search, ShoppingBag, Package, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  activeView: string;
  onViewChange: (view: any) => void;
  cartCount: number;
}

interface NavTab {
  id: string;
  label: string;
  icon: any;
  disabled?: boolean;
}

export function BottomNav({ activeView, onViewChange, cartCount }: BottomNavProps) {
  const tabs: NavTab[] = [
    { id: 'shop', label: 'Shop', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'cart', label: 'Cart', icon: ShoppingBag },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-2xl border-t border-border/80 md:hidden px-3 py-2 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-12 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Determine if tab is active
          const isActive = 
            (tab.id === 'shop' && (activeView === 'shop' || activeView === 'product-detail')) ||
            (tab.id === 'profile' && activeView === 'auth') ||
            (tab.id === activeView);
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.disabled) return;
                onViewChange(tab.id as any);
              }}
              disabled={tab.disabled}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-1 px-4 transition-all min-w-[64px] min-h-[44px] rounded-2xl active:scale-95 touch-manipulation cursor-pointer",
                isActive ? "text-[#F68B1E] font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-foreground",
                tab.disabled && "opacity-30 cursor-not-allowed pointer-events-none"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 w-8 h-1 bg-[#F68B1E] rounded-full shadow-[0_0_10px_rgba(246,139,30,0.6)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="relative p-0.5">
                <Icon size={20} fill={isActive && tab.id !== 'search' ? "currentColor" : "none"} strokeWidth={isActive ? 2.5 : 2} />
                
                {tab.id === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#F68B1E] text-white text-[8px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-background shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
