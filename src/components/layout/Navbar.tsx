import { useState, ChangeEvent } from 'react';
import { Menu, X, ShoppingCart, User, Search, Package } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavbarProps {
  onCategorySelect: (category: string | null) => void;
  onSearch: (query: string) => void;
  cartCount: number;
  onCartClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
  onMarketingClick: () => void;
  user?: { name: string; role: string } | null;
}

export function Navbar({ 
  onCategorySelect, 
  onSearch,
  cartCount, 
  onCartClick, 
  onProfileClick, 
  onTrackingClick,
  onMarketingClick,
  user 
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const navItems = [
    { name: 'All Devices', category: null },
    { name: 'Phones', category: 'Phones' },
    { name: 'Computers', category: 'Computers' },
    { name: 'Electronics', category: 'Electronics' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8 flex-1">
            <button 
              onClick={() => onCategorySelect(null)}
              className="text-2xl font-bold tracking-tighter text-blue-500 hover:text-blue-400 transition-colors shrink-0"
            >
              SOLO'S
            </button>
            <div className="hidden md:block">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onCategorySelect(item.category)}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all font-mono uppercase tracking-tighter"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-md ml-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search devices..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onTrackingClick}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title="Track Order"
            >
              <Package size={20} />
            </button>
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <button 
                onClick={onMarketingClick}
                className="px-3 py-1.5 rounded-full bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
              >
                Marketing
              </button>
            )}
            <button 
              onClick={onCartClick}
              className="relative p-2 text-gray-300 hover:text-white transition-colors"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black">
                  {cartCount}
                </span>
              )}
            </button>
            <button 
              onClick={onProfileClick}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-all border border-white/5"
              title={user ? 'Sign Out' : 'Sign In'}
            >
              <User size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                {user ? user.name.split(' ')[0] : 'Login'}
              </span>
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={onCartClick} className="relative p-2 text-gray-300">
               <ShoppingCart size={20} />
               {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden bg-black/95 border-b border-white/10 overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-96" : "max-h-0")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                onCategorySelect(item.category);
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10"
            >
              {item.name}
            </button>
          ))}
          <button
            onClick={() => {
              onTrackingClick();
              setIsOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10"
          >
            Track Order
          </button>
          <button
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/10"
          >
            {user ? `Account (${user.name.split(' ')[0]})` : 'Login / Register'}
          </button>
        </div>
      </div>
    </nav>
  );
}
