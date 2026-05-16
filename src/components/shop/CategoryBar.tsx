import { Tablet, Smartphone, Laptop, Watch, Headphones, Tv } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CategoryBarProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

const categories = [
  { name: 'All', icon: Tablet, id: null },
  { name: 'Phones', icon: Smartphone, id: 'Phones' },
  { name: 'Computers', icon: Laptop, id: 'Computers' },
  { name: 'Devices', icon: Tv, id: 'Electronics' },
  { name: 'Audio', icon: Headphones, id: 'Audio' },
  { name: 'Smartwatch', icon: Watch, id: 'Accessories' },
];

export function CategoryBar({ onCategorySelect, selectedCategory }: CategoryBarProps) {
  return (
    <div className="bg-black/50 backdrop-blur-sm border-b border-white/5 py-4 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 flex gap-4 min-w-max">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.name}
              onClick={() => onCategorySelect(cat.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border group",
                isActive 
                  ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20" 
                  : "bg-white/5 border-white/5 hover:border-white/20"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isActive ? "bg-white text-blue-600 scale-110" : "bg-white/5 text-gray-500 group-hover:text-white"
              )}>
                <Icon size={24} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
              )}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
