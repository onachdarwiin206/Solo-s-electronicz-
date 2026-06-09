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
    <div className="bg-[#050508]/65 backdrop-blur-3xl border-b border-white/5 py-8 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex gap-6 min-w-max justify-center items-center">
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "flex flex-col items-center gap-3.5 p-5.5 rounded-[2rem] transition-all duration-300 border group min-w-[100px] cursor-pointer outline-none",
            selectedCategory === null 
              ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40 shadow-[0_8px_30px_rgba(37,99,235,0.35)] text-white scale-105" 
              : "bg-[#0c0d12] border-white/5 text-gray-400 hover:text-white hover:bg-[#13151f] hover:border-blue-500/30 hover:shadow-[0_4px_24px_rgba(59,130,246,0.1)] active:scale-95"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
            selectedCategory === null ? "bg-white text-blue-600 scale-110 shadow-md" : "bg-white/5 text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-400"
          )}>
            <LayoutGrid size={22} className="transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.15em] font-mono",
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
                "flex flex-col items-center gap-3.5 p-5.5 rounded-[2rem] transition-all duration-300 border group min-w-[130px] cursor-pointer outline-none",
                isActive 
                  ? "bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-400/40 shadow-[0_8px_30px_rgba(37,99,235,0.35)] text-white scale-105" 
                  : "bg-[#0c0d12] border-white/5 text-gray-400 hover:text-white hover:bg-[#13151f] hover:border-blue-500/30 hover:shadow-[0_4px_24px_rgba(59,130,246,0.1)] active:scale-95"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                isActive ? "bg-white text-blue-600 scale-110 shadow-md" : "bg-white/5 text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-400"
              )}>
                <Icon size={22} className="transition-transform duration-300 group-hover:scale-110" />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.15em] font-mono",
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
