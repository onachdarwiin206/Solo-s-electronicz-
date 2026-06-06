import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Check, Star, Info, Settings, Share2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function AndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('desktop');

  useEffect(() => {
    // 1. Detect platform of mobile user
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    const isIos = /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    
    if (isAndroid) {
      setPlatform('android');
    } else if (isIos) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    // 2. Check if the app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 3. Catch the Chromium PWA install prompt trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Save prompt for later trigger
      setDeferredPrompt(e);
      
      // Only show after a short timeout to let user explore, and only if not dismissed recently
      const dismissed = localStorage.getItem('solos_pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => {
          setShowBanner(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's a mobile user and they have never dismissed the banner, show an invitation prompt
    const dismissed = localStorage.getItem('solos_pwa_dismissed');
    if ((isAndroid || isIos) && !dismissed) {
      setTimeout(() => {
        setShowBanner(true);
      }, 5000);
    }

    // Capture app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] Solo\'s Electronics installed successfully!');
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Global listener so other parts of the app can open the install guide
    const triggerGuideListener = () => {
      setShowGuideModal(true);
    };
    window.addEventListener('open-install-guide', triggerGuideListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-install-guide', triggerGuideListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install choice outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowBanner(false);
    } else {
      // Fallback: show interactive guided installation steps
      setShowGuideModal(true);
    }
  };

  const dismissBanner = () => {
    localStorage.setItem('solos_pwa_dismissed', 'true');
    setShowBanner(false);
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Dynamic Header/Toast Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-[60]"
          >
            <div className="bg-[#09090b]/95 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
              {/* Radial Glowing Background Decor */}
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
              
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-500">
                    <Smartphone size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-foreground text-xs font-black uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <span>Solo's Tech App</span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-black border border-emerald-500/20">
                        FREE INSTALL
                      </span>
                    </h4>
                    <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5 max-w-[240px]">
                      Install our fast, lightweight app directly to your device for offline shopping & instant orders.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={dismissBanner}
                  className="p-1 hover:bg-foreground/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.4)]"
                >
                  <Download size={13} />
                  {deferredPrompt ? "Install Now" : "Install Guide"}
                </button>
                <button
                  onClick={() => {
                    setShowBanner(false);
                    setShowGuideModal(true);
                  }}
                  className="px-3 py-2 bg-foreground/5 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-border"
                >
                  How?
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guided Setup Interactive Dialogue Modal */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#09090b] border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-left relative"
            >
              {/* Top Banner Graphics */}
              <div className="bg-gradient-to-r from-blue-900/60 to-slate-900 p-6 border-b border-border text-center overflow-hidden relative">
                <div className="absolute -left-12 -bottom-12 w-28 h-28 bg-blue-500/10 blur-2xl rounded-full" />
                <div className="absolute top-4 right-4 flex gap-1 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5 text-[8px] font-mono text-green-400 uppercase font-black tracking-widest">
                  <Check size={8} className="mt-0.5" /> PWA Standalone Ready
                </div>
                
                <h3 className="text-foreground text-sm font-black uppercase tracking-widest font-mono mt-4">
                  Android & Mobile Installer
                </h3>
                <p className="text-xs text-muted-foreground/90 max-w-xs mx-auto mt-1 leading-relaxed">
                  Enjoy real-time updates and lightning-fast loading by installing directly from the browser tab!
                </p>
              </div>

              {/* Step By Step Breakdown content */}
              <div className="p-6 space-y-6">
                {platform === 'android' ? (
                  // Android Specific Custom Guide
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-foreground text-xs font-black uppercase tracking-wider font-mono">
                          Trigger Browser Installer
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-normal mt-0.5">
                          Tap the button below. If your system is compatible with automatic launcher deployment, Chrome will immediately prompt you.
                        </p>
                        {deferredPrompt && (
                          <button
                            onClick={handleInstallClick}
                            className="mt-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Download size={11} /> Trigger Action Set
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 items-start border-t border-border/40 pt-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-foreground text-xs font-black uppercase tracking-wider font-mono flex items-center gap-1">
                          Manual Integration Method
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-normal mt-0.5">
                          If no automatic prompt triggers, tap the three dots <span className="text-foreground font-extrabold px-1 py-0.5 bg-foreground/10 rounded">⋮</span> menu at the top right of Chrome (or your active browser).
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start border-t border-border/40 pt-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-foreground text-xs font-black uppercase tracking-wider font-mono">
                          Confirm "Install App"
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-normal mt-0.5">
                          Select <span className="text-blue-500 font-extrabold uppercase">"Install App"</span> or <span className="text-blue-500 font-extrabold uppercase">"Add to Home Screen"</span>. The device will download package parameters and pin Solo's icon to your drawer.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : platform === 'ios' ? (
                  // iOS Specific Custom Guide
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-foreground text-xs font-black uppercase tracking-wider font-mono flex items-center gap-1.5">
                          Open Safari Share Sheet
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-normal mt-0.5 flex items-center gap-1">
                          Ensure you're browsing in Safari, and tap the <span className="text-blue-500 flex items-center gap-0.5 font-bold"><Share2 size={13} /> Share</span> icon in your utility navigation panel.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start border-t border-border/40 pt-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-foreground text-xs font-black uppercase tracking-wider font-mono flex items-center gap-1">
                          Scroll to Options Set
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-normal mt-0.5">
                          Scroll down the share sheet options list and select <span className="text-blue-500 font-extrabold uppercase">"Add to Home Screen"</span>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start border-t border-border/40 pt-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-foreground text-xs font-black uppercase tracking-wider font-mono">
                          Confirm Launcher Action
                        </h4>
                        <p className="text-muted-foreground text-[11px] leading-normal mt-0.5">
                          Tap <span className="text-blue-500 font-extrabold uppercase">"Add"</span> in the top-right corner. Solo's Electronics app will launch seamlessly in its own secure, standalone sandbox screen.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Desktop Specific General Guide
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      You are viewing on a desktop browser. You can install Solo's Electronics on your computer (Chrome/Edge/Brave) or scan/visit this site on your Android mobile device to install it directly.
                    </p>
                    
                    <div className="p-3 bg-foreground/5 border border-border rounded-2xl flex items-center gap-3">
                      <HelpCircle size={18} className="text-blue-500" />
                      <div>
                        <h5 className="text-foreground text-[11px] font-bold uppercase tracking-wider">
                          Ready for Android Installs
                        </h5>
                        <p className="text-muted-foreground text-[10px] leading-tight">
                          Once loaded on Android, a dedicated app prompt will assist you seamlessly to install the app.
                        </p>
                      </div>
                    </div>

                    {deferredPrompt && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> Install Desktop Application
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Panel */}
              <div className="p-4 bg-foreground/5 border-t border-border/60 flex items-center justify-end gap-2 text-right">
                <button
                  onClick={() => setShowGuideModal(false)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
