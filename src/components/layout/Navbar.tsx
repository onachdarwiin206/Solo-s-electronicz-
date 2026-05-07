import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Menu, X, ShoppingCart, Search, Package, Globe, Bookmark, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Language } from '../../translations';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../AuthContext';

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
  const [showLang, setShowLang] = useState(false);
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
    return () => {
      if (pressTimeout.current) clearTimeout(pressTimeout.current);
    };
  }, []);

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 lg:gap-8 flex-1">
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
            
            <div className="hidden xl:block">
              <div className="flex items-baseline space-x-2">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onCategorySelect(item.category)}
                    className="px-3 py-2 rounded-md text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all font-mono uppercase tracking-tighter"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search architecture..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Tooltip content="Search Database">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Search size={20} />
              </button>
            </Tooltip>

            <Tooltip content="Track Hardware">
              <button 
                onClick={onTrackingClick}
                className="hidden sm:block p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Package size={20} />
              </button>
            </Tooltip>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowLang(!showLang)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-all border border-white/5"
              >
                <Globe size={16} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  {currentLanguage}
                </span>
              </button>

              {showLang && (
                <div className="absolute right-0 mt-3 w-64 bg-gray-900 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-[100]">
                  <div className="mb-3 px-2">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Global Language Engine</p>
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-[300px] overflow-y-auto no-scrollbar">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLang(false);
                        }}
                        className={cn(
                          "flex items-center justify-between w-full p-2.5 rounded-xl transition-all text-left",
                          currentLanguage === lang.code 
                            ? "bg-blue-600/20 text-white border border-blue-500/30" 
                            : "hover:bg-white/5 text-gray-400 border border-transparent"
                        )}
                      >
                        <div>
                          <p className="text-xs font-black uppercase tracking-tighter leading-none">{lang.label}</p>
                          <p className="text-[9px] font-mono text-gray-500 mt-0.5">{lang.sub}</p>
                        </div>
                        {currentLanguage === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Tooltip content="Saved Hardware">
              <button 
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
                onClick={() => {
                   // Optional: feature to show wishlist modal if requested, for now just show count
                }}
              >
                <Bookmark size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-black">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </Tooltip>

            <Tooltip content="View Basket">
              <button 
                onClick={onCartClick}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-black">
                    {cartCount}
                  </span>
                )}
              </button>
            </Tooltip>
            
            <Tooltip content={user ? "Logout Hardware Account" : "Access Personal Cloud"}>
              <button 
                onClick={user ? () => logout() : onAuthClick}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border",
                  user 
                    ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20" 
                    : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5"
                )}
              >
                {user ? <LogOut size={16} /> : <User size={16} className="text-blue-500" />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                  {user ? 'Exit' : 'Login'}
                </span>
              </button>
            </Tooltip>

            {isAdmin && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'admin' }))}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-500 rounded-full transition-all"
              >
                <Package size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Dash</span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
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
            className="md:hidden bg-black/80 border-b border-white/5 overflow-hidden"
          >
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for hardware..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="px-3 py-4 border-t border-white/5 mt-4">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Select Region / Language</p>
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
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
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
