import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, Package, Globe, Bookmark, User, LogOut, ShieldCheck, Sparkles, UserCheck, Eye, HelpCircle, LogIn, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Language } from '../../translations';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface NavbarProps {
  onCategorySelect: (category: string | null) => void;
  onSearch: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  onCartClick: () => void;
  onTrackingClick: () => void;
  onMarketingClick: () => void;
  isAdmin: boolean;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onAuthClick: () => void;
  t: any;
}

export function Navbar({ 
  onCategorySelect, 
  onSearch,
  cartCount, 
  wishlistCount,
  onCartClick, 
  onTrackingClick,
  onMarketingClick,
  isAdmin,
  currentLanguage,
  onLanguageChange,
  onAuthClick,
  t
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pressTimerActive, setPressTimerActive] = useState(false);
  const pressTimeout = useRef<NodeJS.Timeout | null>(null);

  const startPressTimer = () => {
    setPressTimerActive(true);
    pressTimeout.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openAdmin'));
      setPressTimerActive(false);
    }, 3000); // 3 seconds
  };

  const cancelPressTimer = () => {
    if (pressTimeout.current) clearTimeout(pressTimeout.current);
    setPressTimerActive(false);
  };

  useEffect(() => {
    const handleToggleSearch = () => {
      setShowSearch(p => !p);
    };
    window.addEventListener('toggleSearch', handleToggleSearch);
    return () => {
      if (pressTimeout.current) clearTimeout(pressTimeout.current);
      window.removeEventListener('toggleSearch', handleToggleSearch);
    };
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const navItems = [
    { name: 'All Devices', category: null },
    { name: 'Phones', category: 'Phones & Tablets' },
    { name: 'Computers', category: 'Computers & Laptops' },
    { name: 'Gaming', category: 'Gaming & Consoles' },
    { name: 'Audio', category: 'TVs & Audio' },
    { name: 'Accessories', category: 'Accessories' },
  ];

  const languages: { code: Language; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'International' },
    { code: 'lg', label: 'Luganda', sub: 'Central Uganda' },
    { code: 'nyn', label: 'Runyankole', sub: 'Western Uganda' },
    { code: 'sw', label: 'Swahili', sub: 'East Africa' },
    { code: 'lgo', label: 'Leblango', sub: 'Northern Uganda' },
    { code: 'it', label: 'Iteso', sub: 'Eastern Uganda' },
    { code: 'es', label: 'Español', sub: 'Internacional' },
    { code: 'de', label: 'Deutsch', sub: 'International' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onCategorySelect(null)}
                onMouseDown={startPressTimer}
                onMouseUp={cancelPressTimer}
                onMouseLeave={cancelPressTimer}
                onTouchStart={startPressTimer}
                onTouchEnd={cancelPressTimer}
                className={cn(
                  "text-2xl font-black tracking-tighter text-blue-500 hover:text-blue-400 transition-all shrink-0 italic select-none outline-none",
                  pressTimerActive && "scale-90 opacity-70"
                )}
              >
                SOLO'S
              </button>
            </div>
            
            <div className="hidden xl:block">
              <div className="flex items-baseline space-x-2">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onCategorySelect(item.category)}
                    className="px-3 py-2 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all font-mono uppercase tracking-tighter"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  className="w-full bg-foreground/5 border border-border rounded-2xl py-2.5 pl-12 pr-4 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-mono placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Tooltip content="Search Products">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search size={20} />
              </button>
            </Tooltip>

            <Tooltip content="Wishlist">
              <button 
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => {
                   // Optional: feature to show wishlist modal if requested, for now just show count
                }}
              >
                <Bookmark size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-background">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip content="View Basket">
              <button 
                onClick={onCartClick}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-background">
                    {cartCount}
                  </span>
                )}
              </button>
            </Tooltip>



            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 rounded-md text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Inline Mobile Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background/80 border-b border-border overflow-hidden"
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for hardware..."
                  className="w-full bg-foreground/5 border border-border rounded-2xl py-3 pl-12 pr-4 text-sm text-foreground outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <div className={cn("md:hidden bg-background/95 border-b border-border overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px]" : "max-h-0")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button
            onClick={() => {
              onCategorySelect(null);
              setIsOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 hover:bg-foreground/10 italic"
          >
            Home / Landing
          </button>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                onCategorySelect(item.category);
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/10"
            >
              {item.name}
            </button>
          ))}

          <div className="px-3 py-4 border-t border-border mt-4">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Select Region / Language</p>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <button 
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex flex-col p-3 rounded-2xl border transition-all text-left", 
                    currentLanguage === lang.code 
                      ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                      : "bg-foreground/5 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter">{lang.label}</span>
                  <span className="text-[8px] font-mono opacity-60 mt-1">{lang.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
