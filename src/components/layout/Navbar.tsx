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
  const [showLang, setShowLang] = useState(false);
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
              
              <div 
                className={cn(
                  "hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-mono uppercase tracking-[0.1em] transition-all",
                  isSupabaseConfigured 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                )}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    isSupabaseConfigured ? "bg-emerald-400" : "bg-amber-400"
                  )}></span>
                  <span className={cn(
                    "relative inline-flex rounded-full h-1.5 w-1.5",
                    isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-500"
                  )}></span>
                </span>
                <span>{isSupabaseConfigured ? "CLOUD-SYNC" : "SANDBOX-FLOW"}</span>
              </div>
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
                  placeholder="Search architecture..."
                  className="w-full bg-foreground/5 border border-border rounded-2xl py-2.5 pl-12 pr-4 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all font-mono placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Tooltip content="Search Database">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Search size={20} />
              </button>
            </Tooltip>

            <Tooltip content="Track Hardware">
              <button 
                onClick={onTrackingClick}
                className="hidden sm:block p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Package size={20} />
              </button>
            </Tooltip>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowLang(!showLang)}
                className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-full text-muted-foreground hover:text-foreground transition-all border border-border"
              >
                <Globe size={16} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                  {currentLanguage}
                </span>
              </button>

              {showLang && (
                <div className="absolute right-0 mt-3 w-64 bg-card border border-border rounded-3xl p-4 shadow-2xl backdrop-blur-xl z-[100]">
                  <div className="mb-3 px-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Global Language Engine</p>
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
                            ? "bg-blue-600/20 text-blue-500 border border-blue-500/30" 
                            : "hover:bg-foreground/5 text-muted-foreground border border-transparent"
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

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowLang(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border outline-none",
                  user 
                    ? "bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border-blue-500/20" 
                    : "bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground border-border"
                )}
              >
                <User size={16} className={cn(isAdmin ? "text-amber-400 font-bold" : user ? "text-emerald-400" : "text-blue-500")} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                  {user ? (user.name?.split(' ')[0] || 'Profile') : 'Login'}
                </span>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isAdmin ? "bg-amber-400 animate-pulse" : user ? "bg-emerald-500" : "bg-blue-500"
                )} />
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-3xl p-5 shadow-2xl backdrop-blur-3xl z-[120]"
                  >
                    {/* Header */}
                    <div className="mb-4">
                      {isAdmin ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8.5px] font-black uppercase tracking-widest text-amber-500">
                          <ShieldCheck size={11} />
                          System Administrator [Core]
                        </div>
                      ) : user ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8.5px] font-black uppercase tracking-widest text-emerald-400">
                          <UserCheck size={11} />
                          Verified Client Session
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[8.5px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
                          <Eye size={11} />
                          Potential Customer [Visitor]
                        </div>
                      )}
                    </div>

                    {/* Body Info */}
                    <div className="space-y-4">
                      {isAdmin ? (
                        <div className="p-3 bg-foreground/5 rounded-2xl border border-border/50">
                          <p className="text-xs font-black text-foreground uppercase tracking-tight">{user?.name || 'Authorized Admin'}</p>
                          <p className="text-[10px] font-mono text-muted-foreground break-all mt-0.5">{user?.email}</p>
                          <div className="mt-3 flex items-center gap-1 text-[8.5px] font-bold text-amber-400/80 uppercase tracking-widest">
                            <Sparkles size={10} />
                            Full System Clearance Enabled
                          </div>
                        </div>
                      ) : user ? (
                        <div className="p-3 bg-foreground/5 rounded-2xl border border-border/50 space-y-2">
                          <div>
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">{user.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground break-all mt-0.5">{user.email}</p>
                          </div>
                          {user.phone && (
                            <p className="text-[9.5px] font-mono text-muted-foreground/85 flex items-center gap-1 border-t border-border/30 pt-2">
                              <span>WhatsApp: {user.phone}</span>
                            </p>
                          )}
                          <div className="flex items-center justify-around gap-2 bg-foreground/5 rounded-xl p-2 text-center border border-border/30 mt-1">
                            <div>
                              <p className="text-xs font-mono font-black text-blue-500">{wishlistCount}</p>
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Saved</p>
                            </div>
                            <div className="w-[1px] h-6 bg-border/40" />
                            <div>
                              <p className="text-xs font-mono font-black text-blue-500">{cartCount}</p>
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Basket</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-foreground/5 rounded-2xl border border-border/50 space-y-2 text-left">
                          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wide">
                            YOUR SELECTIONS ARE TEMPORARILY BUFFERED. CREATE AN ACCESS PROFILE TO SECURE SYSTEM QUOTE SYNCS.
                          </p>
                          <div className="bg-blue-600/5 rounded-xl p-2.5 border border-blue-500/10 text-center">
                            <p className="text-[8.5px] font-black text-blue-500 uppercase tracking-widest">Client Privileges</p>
                            <p className="text-[8px] text-muted-foreground mt-0.5 uppercase tracking-tight">Express Checkout, Quote Sync, Priority Support</p>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Action Buttons */}
                      <div className="space-y-2 pt-2 border-t border-border/40">
                        {isAdmin && (
                          <button 
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('changeView', { detail: 'admin' }));
                              setShowProfile(false);
                            }}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
                          >
                            <ShieldCheck size={14} />
                            Launch Admin Center
                          </button>
                        )}

                        {user ? (
                          <>
                            <button 
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('changeView', { detail: 'tracking' }));
                                setShowProfile(false);
                              }}
                              className="w-full py-2.5 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-border"
                            >
                              <ClipboardList size={14} className="text-blue-500" />
                              Hardware Tracker Core
                            </button>
                            <button 
                              onClick={async () => {
                                await logout();
                                setShowProfile(false);
                              }}
                              className="w-full py-2.5 bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground font-black text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent"
                            >
                              <LogOut size={13} />
                              Disconnect Session
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                onAuthClick();
                                setShowProfile(false);
                              }}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
                            >
                              <LogIn size={14} />
                              Log In / Register Profile
                            </button>
                            <button 
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }));
                                setShowProfile(false);
                              }}
                              className="w-full py-2.5 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black text-[9.5px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-border"
                            >
                              <Eye size={13} className="text-blue-500" />
                              Continue as Guest
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
          <button
            onClick={() => {
              onTrackingClick();
              setIsOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/10"
          >
            Track Order
          </button>
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
