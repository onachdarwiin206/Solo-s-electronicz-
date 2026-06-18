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
    <div className="bg-white/90 dark:bg-zinc-950/85 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-850/60 py-5 overflow-x-auto no-scrollbar scroll-smooth sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-start md:justify-center gap-2.5 min-w-max">
        
        {/* All Sectors Tab */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "relative flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 group cursor-pointer outline-none text-xs font-semibold tracking-wide border",
            selectedCategory === null 
              ? "text-white border-transparent font-extrabold shadow-[0_4px_15px_rgba(37,99,235,0.25)]" 
              : "bg-gray-50 dark:bg-zinc-950 border-gray-100 dark:border-zinc-900 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 hover:border-gray-200 dark:hover:border-zinc-800 active:scale-95"
          )}
        >
          {selectedCategory === null && (
            <motion.div
              layoutId="active-category-pill"
              className="absolute inset-0 bg-blue-600 rounded-full z-0 shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <div className={cn(
            "relative z-10 w-4.5 h-4.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            selectedCategory === null ? "text-white" : "text-gray-400 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-white"
          )}>
            <LayoutGrid size={15} strokeWidth={2.5} />
          </div>
          <span className="relative z-10">
            All Sectors
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
                "relative flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 group cursor-pointer outline-none text-xs font-semibold tracking-wide border",
                isActive 
                  ? "text-white border-transparent font-extrabold shadow-[0_4px_15px_rgba(37,99,235,0.25)]" 
                  : "bg-gray-50 dark:bg-zinc-950 border-gray-100 dark:border-zinc-900 text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 hover:border-gray-200 dark:hover:border-zinc-800 active:scale-95"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-category-pill"
                  className="absolute inset-0 bg-blue-600 rounded-full z-0 shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative z-10 w-4.5 h-4.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-white" : "text-gray-400 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-white"
              )}>
                <Icon size={15} strokeWidth={2.5} />
              </div>
              <span className="relative z-10">
                {cat}
              </span>
            </button>
          );
        })}

      </div>
    </div>
  );
}
