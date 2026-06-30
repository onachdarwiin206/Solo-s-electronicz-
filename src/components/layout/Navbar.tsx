import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, Package, Globe, Bookmark, User, LogOut, ShieldCheck, Sparkles, UserCheck, Eye, HelpCircle, LogIn, ClipboardList, Sun, Moon, Smartphone, Download, Laptop, Gamepad2, Tv, Layers, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Language } from '../../translations';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useTheme } from '../../ThemeContext';

interface NavbarProps {
  onCategorySelect: (category: string | null) => void;
  onSearch: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  onCartClick: () => void;
  onWishlistClick: () => void;
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
  onWishlistClick,
  onMarketingClick,
  isAdmin,
  currentLanguage,
  onLanguageChange,
  onAuthClick,
  t
}: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
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
    { name: 'All Devices', category: null, icon: Grid },
    { name: 'Phones', category: 'Phones & Tablets', icon: Smartphone },
    { name: 'Computers', category: 'Computers & Laptops', icon: Laptop },
    { name: 'Gaming', category: 'Gaming & Consoles', icon: Gamepad2 },
    { name: 'Audio', category: 'TVs & Audio', icon: Tv },
    { name: 'Accessories', category: 'Accessories', icon: Layers },
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
        {/* Ribbon 1: Identity, Operational Search & Utilities */}
        <div className="flex items-center justify-between h-16 gap-2">
          <div className="flex items-center gap-2 lg:gap-8 flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => onCategorySelect(null)}
                onMouseDown={startPressTimer}
                onMouseUp={cancelPressTimer}
                onMouseLeave={cancelPressTimer}
                onTouchStart={startPressTimer}
                onTouchEnd={cancelPressTimer}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 text-sm sm:text-xl lg:text-2xl font-black tracking-tighter text-blue-500 hover:text-blue-400 transition-all italic select-none outline-none truncate py-1",
                  pressTimerActive && "scale-90 opacity-70"
                )}
              >
                <span className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white font-mono font-extrabold not-italic text-xs sm:text-base tracking-normal shadow-lg shadow-blue-500/20 border border-blue-400/30 shrink-0 select-none">
                  E
                </span>
                <span className="inline sm:hidden">EMMA PHONES</span>
                <span className="hidden sm:inline">EMMA PHONES & ELECTRONICS</span>
              </button>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md ml-auto min-w-0">
              <div className="relative w-full group/search">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within/search:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  className="w-full bg-white/95 dark:bg-zinc-950/95 border border-zinc-300/80 dark:border-zinc-700/80 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-semibold text-foreground outline-none shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-sans placeholder:text-zinc-500/90 dark:placeholder:text-zinc-400/90"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-3 shrink-0">
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
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={onWishlistClick}
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

            <Tooltip content={`Theme: ${theme === 'glass' ? 'Glass Refraction' : theme === 'light' ? 'Light Mode' : 'Dark Mode'}`}>
              <button 
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground transition-all duration-300 rounded-full hover:bg-foreground/5 relative flex items-center justify-center outline-none cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'glass' && <Sparkles size={20} className="text-purple-400 rotate-12" />}
                {theme === 'light' && <Sun size={20} className="text-amber-500" />}
                {theme === 'dark' && <Moon size={20} className="text-blue-400" />}
              </button>
            </Tooltip>

            <Tooltip content="Install Mobile App">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('triggerPwaPrompt'));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/25 active:scale-95 text-blue-500 hover:text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                id="header-pwa-install-btn"
              >
                <Smartphone size={13} className="animate-pulse" />
                <span className="hidden sm:inline-block">INSTALL</span> APP
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

        {/* Ribbon 2: Secondary Category Browser Navigation - Scrollable on mobile/tablet */}
        <div className="flex xl:justify-center items-center h-11 border-t border-border/80 gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-1 select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => onCategorySelect(item.category)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 hover:scale-105 active:scale-95 transition-all duration-200 font-mono uppercase tracking-tighter cursor-pointer shrink-0"
              >
                <Icon size={13} className="shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
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
              <div className="relative group/mobilesearch">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 group-focus-within/mobilesearch:text-blue-500 transition-colors" size={16} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for hardware..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700/80 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold text-foreground outline-none shadow-md focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => {
                  onCategorySelect(item.category);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/10"
              >
                <Icon size={16} className="shrink-0 text-muted-foreground/70" />
                <span>{item.name}</span>
              </button>
            );
          })}



          <div className="px-3 py-4 border-t border-border">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Appearance / Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light' as const, label: 'Light', icon: Sun, color: 'text-amber-500' },
                { id: 'dark' as const, label: 'Dark', icon: Moon, color: 'text-blue-400' },
                { id: 'glass' as const, label: 'Glass', icon: Sparkles, color: 'text-purple-400' }
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setTheme(item.id);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-1.5 cursor-pointer", 
                      isSelected 
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    <IconComponent size={14} className={isSelected ? 'text-white' : item.color} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
