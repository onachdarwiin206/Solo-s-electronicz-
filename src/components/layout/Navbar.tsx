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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ribbon 1: Identity, Operational Search & Utilities */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <button 
              onClick={() => onCategorySelect(null)}
              onMouseDown={startPressTimer}
              onMouseUp={cancelPressTimer}
              onMouseLeave={cancelPressTimer}
              onTouchStart={startPressTimer}
              onTouchEnd={cancelPressTimer}
              className={cn(
                "flex items-center gap-2.5 text-lg sm:text-xl font-display font-black tracking-tight text-foreground select-none outline-none transition-all cursor-pointer",
                pressTimerActive && "scale-95 opacity-75"
              )}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F68B1E] text-white font-display font-black text-sm tracking-normal shadow-sm shrink-0">
                L
              </span>
              <span className="font-display font-black tracking-tight uppercase">
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
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-foreground outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-950 focus:border-[#F68B1E] dark:focus:border-[#F68B1E] focus:ring-2 focus:ring-[#F68B1E]/10"
                />
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Offline Sync Status Widget */}
            {typeof window !== 'undefined' && !navigator.onLine && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-mono tracking-wider font-bold">
                <WifiOff size={11} />
                <span>OFFLINE</span>
              </div>
            )}

            {isSyncing && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-mono tracking-wider font-bold animate-pulse">
                <CloudUpload size={11} className="animate-bounce" />
                <span>SYNCING...</span>
              </div>
            )}

            {!isSyncing && typeof window !== 'undefined' && navigator.onLine && queue.length > 0 && (
              <Tooltip content={`Sync ${queue.length} offline orders now`}>
                <button 
                  onClick={() => syncNow()}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 rounded-full text-emerald-400 text-[10px] font-mono tracking-wider font-bold cursor-pointer transition-colors"
                >
                  <CloudUpload size={11} />
                  <span>SYNC ({queue.length})</span>
                </button>
              </Tooltip>
            )}

            <Tooltip content="Search Products">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
              >
                <Search size={18} />
              </button>
            </Tooltip>

            <Tooltip content="Wishlist">
              <button 
                className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
                onClick={onWishlistClick}
              >
                <Bookmark size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#F68B1E] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-background">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip content="View Basket">
              <button 
                onClick={onCartClick}
                className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-colors cursor-pointer"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-[#F68B1E] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-background">
                    {cartCount}
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip content="Chat with Owner on WhatsApp">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-whatsapp-flow', { detail: { message: "Hello Emma Electronics owner, I have an inquiry about your products and services!" } }));
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 active:scale-95 text-[#25D366] border border-[#25D366]/30 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path d="M17.472 14.382c-.022-.008-.115-.062-.272-.14-.08-.041-.268-.137-.358-.183-.09-.045-.155-.068-.22.031-.064.098-.25.314-.306.377-.056.062-.112.07-.22.031-.088-.044-.361-.133-.687-.424-.253-.226-.425-.506-.475-.591-.05-.084-.005-.13.038-.172.039-.038.08-.098.12-.147.04-.05.053-.085.08-.142.027-.057.013-.109-.007-.15-.02-.04-.155-.375-.213-.513-.057-.138-.114-.12-.156-.12-.04-.002-.087-.003-.135-.003-.048 0-.127.018-.193.088-.066.07-.254.248-.254.604 0 .357.259.702.295.751.036.049.51.777 1.235 1.09.173.074.308.118.414.152.173.055.33.047.454.028.138-.02 2.802-1.146 2.802-1.146.036-.046.072-.102.102-.156s.013-.105.007-.15-.022-.06-.051-.085zm-5.419 6.203h-.004a8.194 8.194 0 01-4.18-1.148l-.3-.178-3.1 1.018a.333.333 0 01-.42-.42l1.018-3.1-.178-.3a8.194 8.194 0 01-1.148-4.18C3.12 6.551 7.11 2.561 12 2.561c4.89 0 8.879 3.99 8.879 8.88 0 4.89-3.99 8.879-8.88 8.879l.063-.057zm0-16.791c-5.46 0-9.897 4.437-9.897 9.897 0 1.761.461 3.473 1.336 4.981l-.06-.102-1.42 4.33a.333.333 0 00.419.42l4.33-1.42.1.06a9.897 9.897 0 004.981 1.335h.001c5.46 0 9.897-4.437 9.897-9.897 0-5.46-4.437-9.897-9.897-9.897z" />
                </svg>
                <span className="hidden md:inline-block">CHAT OWNER</span>
              </button>
            </Tooltip>

            <Tooltip content={`Theme: ${theme === 'glass' ? 'Glass Refraction' : theme === 'light' ? 'Light Mode' : 'Dark Mode'}`}>
              <button 
                onClick={toggleTheme}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-foreground transition-all duration-300 rounded-full hover:bg-foreground/5 relative flex items-center justify-center outline-none cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'glass' && <Sparkles size={18} className="text-purple-400 rotate-12" />}
                {theme === 'light' && <Sun size={18} className="text-amber-500" />}
                {theme === 'dark' && <Moon size={18} className="text-blue-400" />}
              </button>
            </Tooltip>

            <Tooltip content="Install Mobile App">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('triggerPwaPrompt'));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F68B1E]/10 hover:bg-[#F68B1E]/20 active:scale-95 text-[#F68B1E] dark:text-[#ff9d3a] border border-[#F68B1E]/20 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
                id="header-pwa-install-btn"
              >
                <Smartphone size={12} />
                <span className="hidden sm:inline-block">INSTALL</span>
              </button>
            </Tooltip>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-foreground focus:outline-none cursor-pointer"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Ribbon 2: Secondary Category Browser Navigation */}
        <div className="flex justify-start items-center h-12 border-t border-border/50 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-1 select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategory === item.category;
            return (
              <button
                key={item.name}
                onClick={() => onCategorySelect(item.category)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer shrink-0 border",
                  isSelected
                    ? "bg-[#F68B1E] border-[#F68B1E] text-white font-bold shadow-sm"
                    : "bg-transparent border-transparent text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                <Icon size={13} className="shrink-0" />
                <span className="font-sans uppercase">
                  {item.name}
                </span>
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
            className="md:hidden bg-background/80 border-b border-border/60 overflow-hidden"
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={15} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search products..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-foreground outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <div className={cn("md:hidden bg-background/95 border-b border-border/60 overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px]" : "max-h-0")}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button
            onClick={() => {
              onCategorySelect(null);
              setIsOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-sm font-bold uppercase tracking-wider text-[#F68B1E] hover:bg-foreground/5"
          >
            Home
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
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-foreground/5 hover:text-foreground"
              >
                <Icon size={14} className="shrink-0 text-zinc-400" />
                <span>{item.name}</span>
              </button>
            );
          })}

          <div className="px-3 py-4 border-t border-border/60">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Appearance / Theme</p>
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
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 cursor-pointer", 
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
