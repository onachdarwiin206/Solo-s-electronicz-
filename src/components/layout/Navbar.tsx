import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, Package, Globe, Bookmark, User, LogOut, ShieldCheck, Sparkles, UserCheck, Eye, HelpCircle, LogIn, ClipboardList, Sun, Moon, Smartphone, Download, Laptop, Gamepad2, Tv, Layers, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Language } from '../../translations';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useTheme } from '../../ThemeContext';
import { useSyncQueue } from '../../hooks/useSyncQueue';
import { WifiOff, CloudUpload } from 'lucide-react';

interface NavbarProps {
  onCategorySelect: (category: string | null) => void;
  selectedCategory?: string | null;
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
  selectedCategory = null,
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
  const { queue, isSyncing, syncNow } = useSyncQueue();
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Ribbon 1: Identity, Operational Search & Utilities */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 shrink">
            <button 
              onClick={() => onCategorySelect(null)}
              onMouseDown={startPressTimer}
              onMouseUp={cancelPressTimer}
              onMouseLeave={cancelPressTimer}
              onTouchStart={startPressTimer}
              onTouchEnd={cancelPressTimer}
              className={cn(
                "flex items-center gap-2 text-base sm:text-xl font-display font-black tracking-tight text-foreground select-none outline-none transition-all cursor-pointer shrink-0",
                pressTimerActive && "scale-95 opacity-75"
              )}
            >
              <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F68B1E] text-white font-display font-black text-xs sm:text-sm tracking-normal shadow-sm shrink-0">
                L
              </span>
              <span className="font-display font-black tracking-tight uppercase text-sm sm:text-lg">
                LIRA<span className="text-[#F68B1E] font-bold font-sans">.</span>
              </span>
            </button>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md min-w-0">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products, brands, categories..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-8 text-xs font-medium text-foreground outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-950 focus:border-[#F68B1E] dark:focus:border-[#F68B1E] focus:ring-2 focus:ring-[#F68B1E]/10"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); onSearch(''); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Offline Sync Status Widget */}
            {typeof window !== 'undefined' && !navigator.onLine && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[9px] font-mono tracking-wider font-bold">
                <WifiOff size={10} />
                <span className="hidden xs:inline">OFFLINE</span>
              </div>
            )}

            {isSyncing && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[9px] font-mono tracking-wider font-bold animate-pulse">
                <CloudUpload size={10} className="animate-bounce" />
                <span className="hidden xs:inline">SYNCING</span>
              </div>
            )}

            {!isSyncing && typeof window !== 'undefined' && navigator.onLine && queue.length > 0 && (
              <Tooltip content={`Sync ${queue.length} offline orders now`}>
                <button 
                  onClick={() => syncNow()}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 rounded-full text-emerald-400 text-[9px] font-mono tracking-wider font-bold cursor-pointer transition-colors"
                >
                  <CloudUpload size={10} />
                  <span>SYNC ({queue.length})</span>
                </button>
              </Tooltip>
            )}

            {/* Search Icon toggle - Mobile */}
            <Tooltip content="Search Products">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-foreground/5 active:scale-95 transition-all cursor-pointer"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </Tooltip>

            {/* Wishlist Button */}
            <Tooltip content="Wishlist">
              <button 
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-foreground/5 active:scale-95 transition-all cursor-pointer"
                onClick={onWishlistClick}
                aria-label="Wishlist"
              >
                <Bookmark size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#F68B1E] text-white text-[8px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* Cart Button */}
            <Tooltip content="View Basket">
              <button 
                onClick={onCartClick}
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-foreground/5 active:scale-95 transition-all cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[#F68B1E] text-white text-[8px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            </Tooltip>

            {/* WhatsApp Chat Button */}
            <Tooltip content="Chat with Owner on WhatsApp">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-whatsapp-flow', { detail: { message: "Hello Emma Electronics owner, I have an inquiry about your products and services!" } }));
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:scale-95 text-[#25D366] border border-[#25D366]/30 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 min-h-[36px]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path d="M17.472 14.382c-.022-.008-.115-.062-.272-.14-.08-.041-.268-.137-.358-.183-.09-.045-.155-.068-.22.031-.064.098-.25.314-.306.377-.056.062-.112.07-.22.031-.088-.044-.361-.133-.687-.424-.253-.226-.425-.506-.475-.591-.05-.084-.005-.13.038-.172.039-.038.08-.098.12-.147.04-.05.053-.085.08-.142.027-.057.013-.109-.007-.15-.02-.04-.155-.375-.213-.513-.057-.138-.114-.12-.156-.12-.04-.002-.087-.003-.135-.003-.048 0-.127.018-.193.088-.066.07-.254.248-.254.604 0 .357.259.702.295.751.036.049.51.777 1.235 1.09.173.074.308.118.414.152.173.055.33.047.454.028.138-.02 2.802-1.146 2.802-1.146.036-.046.072-.102.102-.156s.013-.105.007-.15-.022-.06-.051-.085zm-5.419 6.203h-.004a8.194 8.194 0 01-4.18-1.148l-.3-.178-3.1 1.018a.333.333 0 01-.42-.42l1.018-3.1-.178-.3a8.194 8.194 0 01-1.148-4.18C3.12 6.551 7.11 2.561 12 2.561c4.89 0 8.879 3.99 8.879 8.88 0 4.89-3.99 8.879-8.88 8.879l.063-.057zm0-16.791c-5.46 0-9.897 4.437-9.897 9.897 0 1.761.461 3.473 1.336 4.981l-.06-.102-1.42 4.33a.333.333 0 00.419.42l4.33-1.42.1.06a9.897 9.897 0 004.981 1.335h.001c5.46 0 9.897-4.437 9.897-9.897 0-5.46-4.437-9.897-9.897-9.897z" />
                </svg>
                <span className="hidden md:inline-block">CHAT OWNER</span>
              </button>
            </Tooltip>

            {/* Theme Toggle - Desktop/Tablet */}
            <Tooltip content={`Theme: ${theme === 'glass' ? 'Glass Refraction' : theme === 'light' ? 'Light Mode' : 'Dark Mode'}`}>
              <button 
                onClick={toggleTheme}
                className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-all duration-300 rounded-xl hover:bg-foreground/5 outline-none cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'glass' && <Sparkles size={18} className="text-purple-400 rotate-12" />}
                {theme === 'light' && <Sun size={18} className="text-amber-500" />}
                {theme === 'dark' && <Moon size={18} className="text-blue-400" />}
              </button>
            </Tooltip>

            {/* Install PWA button */}
            <Tooltip content="Install Mobile App">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('triggerPwaPrompt'));
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 bg-[#F68B1E]/10 hover:bg-[#F68B1E]/20 active:scale-95 text-[#F68B1E] dark:text-[#ff9d3a] border border-[#F68B1E]/20 rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 min-h-[36px]"
                id="header-pwa-install-btn"
              >
                <Smartphone size={13} />
                <span className="hidden md:inline-block">INSTALL</span>
              </button>
            </Tooltip>

            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-foreground hover:bg-foreground/5 transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Ribbon 2: Secondary Category Browser Navigation (Scrollable Pill Bar) */}
        <div className="flex justify-start items-center h-11 border-t border-border/50 gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap px-1 py-1 select-none touch-pan-x">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategory === item.category;
            return (
              <button
                key={item.name}
                onClick={() => onCategorySelect(item.category)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer shrink-0 border active:scale-95",
                  isSelected
                    ? "bg-[#F68B1E] border-[#F68B1E] text-white font-bold shadow-sm"
                    : "bg-transparent border-transparent text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                <Icon size={12} className="shrink-0" />
                <span className="font-sans uppercase">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline Mobile Search Expandable Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background/95 border-b border-border/60 overflow-hidden shadow-inner"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={15} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products, brands..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-9 text-xs font-medium text-foreground outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#F68B1E]"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); onSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <div className={cn("xl:hidden bg-background/95 backdrop-blur-xl border-b border-border/60 overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[600px] border-b" : "max-h-0")}>
        <div className="px-3 pt-2 pb-4 space-y-2">
          
          {/* Quick Categories */}
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest px-3 block mb-1">Categories</span>
            <button
              onClick={() => {
                onCategorySelect(null);
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-[#F68B1E] bg-[#F68B1E]/10 hover:bg-[#F68B1E]/20 active:scale-98 transition-all"
            >
              <Grid size={15} />
              <span>All Products</span>
            </button>
            {navItems.filter(i => i.category !== null).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onCategorySelect(item.category);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-foreground/5 active:bg-foreground/10 transition-all"
                >
                  <Icon size={14} className="shrink-0 text-zinc-400" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Contact & Install Action Cards on Mobile */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('trigger-whatsapp-flow', { detail: { message: "Hello Emma Electronics owner, I have an inquiry!" } }));
              }}
              className="flex items-center justify-center gap-2 p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M17.472 14.382c-.022-.008-.115-.062-.272-.14-.08-.041-.268-.137-.358-.183-.09-.045-.155-.068-.22.031-.064.098-.25.314-.306.377-.056.062-.112.07-.22.031-.088-.044-.361-.133-.687-.424-.253-.226-.425-.506-.475-.591-.05-.084-.005-.13.038-.172.039-.038.08-.098.12-.147.04-.05.053-.085.08-.142.027-.057.013-.109-.007-.15-.02-.04-.155-.375-.213-.513-.057-.138-.114-.12-.156-.12-.04-.002-.087-.003-.135-.003-.048 0-.127.018-.193.088-.066.07-.254.248-.254.604 0 .357.259.702.295.751.036.049.51.777 1.235 1.09.173.074.308.118.414.152.173.055.33.047.454.028.138-.02 2.802-1.146 2.802-1.146.036-.046.072-.102.102-.156s.013-.105.007-.15-.022-.06-.051-.085zm-5.419 6.203h-.004a8.194 8.194 0 01-4.18-1.148l-.3-.178-3.1 1.018a.333.333 0 01-.42-.42l1.018-3.1-.178-.3a8.194 8.194 0 01-1.148-4.18C3.12 6.551 7.11 2.561 12 2.561c4.89 0 8.879 3.99 8.879 8.88 0 4.89-3.99 8.879-8.88 8.879l.063-.057zm0-16.791c-5.46 0-9.897 4.437-9.897 9.897 0 1.761.461 3.473 1.336 4.981l-.06-.102-1.42 4.33a.333.333 0 00.419.42l4.33-1.42.1.06a9.897 9.897 0 004.981 1.335h.001c5.46 0 9.897-4.437 9.897-9.897 0-5.46-4.437-9.897-9.897-9.897z" />
              </svg>
              <span>Chat Owner</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent('triggerPwaPrompt'));
              }}
              className="flex items-center justify-center gap-2 p-3 bg-[#F68B1E]/10 hover:bg-[#F68B1E]/20 border border-[#F68B1E]/30 text-[#F68B1E] dark:text-[#ff9d3a] rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
            >
              <Smartphone size={15} />
              <span>Install App</span>
            </button>
          </div>

          {/* Theme Selector */}
          <div className="pt-2 border-t border-border/60">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2">Theme</p>
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
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center gap-1 cursor-pointer active:scale-95", 
                      isSelected 
                        ? "bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-black shadow-sm" 
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <IconComponent size={14} className={isSelected ? 'text-inherit' : item.color} />
                    <span className="text-[9px] font-black uppercase tracking-tight">{item.label}</span>
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
