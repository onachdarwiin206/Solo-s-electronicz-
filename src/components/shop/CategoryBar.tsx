import { 
  Tablet, 
  Smartphone, 
  Laptop, 
  Watch, 
  Headphones, 
  Tv, 
  Gamepad2, 
  Wifi, 
  Home, 
  Camera, 
  Zap,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { PRODUCT_CATEGORIES } from '../../constants';

interface CategoryBarProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Phones & Tablets': return Smartphone;
    case 'Computers & Laptops': return Laptop;
    case 'Gaming & Consoles': return Gamepad2;
    case 'TVs & Audio': return Tv;
    case 'Accessories': return Headphones;
    case 'Networking': return Wifi;
    case 'Home Appliances': return Home;
    case 'Smart Devices': return Watch;
    case 'Cameras & Security': return Camera;
    default: return LayoutGrid;
  }
};

export function CategoryBar({ onCategorySelect, selectedCategory }: CategoryBarProps) {
  return (
    <div className="bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-850/60 py-4 overflow-x-auto no-scrollbar scroll-smooth sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-start md:justify-center gap-2.5 min-w-max">
        
        {/* All Sectors Tab */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "relative flex items-center gap-2 px-4.5 py-2.5 transition-all duration-200 group cursor-pointer outline-none text-[11px] font-mono font-bold tracking-wider border uppercase",
            selectedCategory === null 
              ? "text-black bg-brand-green border-brand-green shadow-[0_0_15px_rgba(57,255,20,0.25)] font-black" 
              : "bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-brand-green dark:hover:text-brand-green hover:bg-brand-blue/10 hover:border-brand-blue/60 active:scale-95"
          )}
        >
          <div className={cn(
            "relative z-10 w-4 h-4 flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
            selectedCategory === null ? "text-black" : "text-gray-400 dark:text-zinc-500 group-hover:text-brand-green"
          )}>
            <LayoutGrid size={13} strokeWidth={2.5} />
          </div>
          <span className="relative z-10 font-mono">
            {selectedCategory === null ? "[ ALL SECTORS ]" : "ALL SECTORS"}
          </span>
        </button>

        {/* Dynamic Category Tabs */}
        {PRODUCT_CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={cn(
                "relative flex items-center gap-2 px-4.5 py-2.5 transition-all duration-200 group cursor-pointer outline-none text-[11px] font-mono font-bold tracking-wider border uppercase",
                isActive 
                  ? "text-black bg-brand-green border-brand-green shadow-[0_0_15px_rgba(57,255,20,0.25)] font-black" 
                  : "bg-white dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-brand-green dark:hover:text-brand-green hover:bg-brand-blue/10 hover:border-brand-blue/60 active:scale-95"
              )}
            >
              <div className={cn(
                "relative z-10 w-4 h-4 flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-black" : "text-gray-400 dark:text-zinc-500 group-hover:text-brand-green"
              )}>
                <Icon size={13} strokeWidth={2.5} />
              </div>
              <span className="relative z-10 font-mono">
                {isActive ? `[ ${cat} ]` : cat}
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
}
