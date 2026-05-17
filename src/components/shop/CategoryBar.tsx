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
    case 'Deals & Offers': return Zap;
    default: return LayoutGrid;
  }
};

export function CategoryBar({ onCategorySelect, selectedCategory }: CategoryBarProps) {
  return (
    <div className="bg-black/50 backdrop-blur-md border-b border-white/5 py-6 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="max-w-7xl mx-auto px-4 flex gap-4 min-w-max">
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border group min-w-[90px]",
            selectedCategory === null 
              ? "bg-blue-600 border-blue-400 shadow-[0_10px_30px_rgba(37,99,235,0.3)]" 
              : "bg-white/5 border-white/5 hover:border-white/10"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
            selectedCategory === null ? "bg-white text-blue-600 scale-110" : "bg-black/40 text-gray-500 group-hover:text-white"
          )}>
            <LayoutGrid size={24} />
          </div>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.15em]",
            selectedCategory === null ? "text-white" : "text-gray-500 group-hover:text-gray-300"
          )}>
            All Sectors
          </span>
        </button>

        {PRODUCT_CATEGORIES.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-3xl transition-all border group min-w-[120px]",
                isActive 
                  ? "bg-blue-600 border-blue-400 shadow-[0_10px_30px_rgba(37,99,235,0.3)]" 
                  : "bg-white/5 border-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                isActive ? "bg-white text-blue-600 scale-110" : "bg-black/40 text-gray-500 group-hover:text-white"
              )}>
                <Icon size={24} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.15em]",
                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
              )}>
                {cat}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
