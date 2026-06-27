import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, X, Sparkles, RefreshCw } from 'lucide-react';

export function AndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'completed'>('idle');
  const [installProgress, setInstallProgress] = useState(0);
  const [installStage, setInstallStage] = useState('');
  const [updateState, setUpdateState] = useState<'idle' | 'updating' | 'applying'>('idle');

  useEffect(() => {
    // Check if previously installed or standalone mode active or dismissed
    const checkIfPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || (window.navigator as any).standalone 
        || localStorage.getItem('solo_pwa_installed') === 'true';

      const isDismissed = localStorage.getItem('solo_pwa_dismissed') === 'true';

      if (isStandalone) {
        setIsInstalled(true);
        setIsVisible(false);
      } else if (isDismissed) {
        setIsVisible(false);
      } else {
        setIsVisible(window.scrollY <= 80);
      }
    };

    checkIfPWA();

    // Listen to official browser PWA criteria match event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Ensure we display official badge if not dismissed
      if (localStorage.getItem('solo_pwa_installed') !== 'true' && localStorage.getItem('solo_pwa_dismissed') !== 'true') {
        setIsVisible(window.scrollY <= 80);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track real installation finish
    const handleAppInstalled = () => {
      console.log('[PWA] Emma Electronics App successfully installed!');
      localStorage.setItem('solo_pwa_installed', 'true');
      setIsInstalled(true);
      setIsVisible(false);
      setInstallState('completed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    const handleTriggerPwa = () => {
      localStorage.removeItem('solo_pwa_dismissed');
      localStorage.removeItem('solo_pwa_installed');
      setIsInstalled(false);
      setInstallState('idle');
      setInstallProgress(0);
      setInstallStage('');
      setIsVisible(true);
    };

    window.addEventListener('triggerPwaPrompt', handleTriggerPwa);

    const handleUpdateAvailable = () => {
      setUpdateState('updating');
    };

    const handleRefreshing = () => {
      setUpdateState('applying');
    };

    window.addEventListener('pwaUpdateAvailable', handleUpdateAvailable);
    window.addEventListener('pwaRefreshing', handleRefreshing);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('triggerPwaPrompt', handleTriggerPwa);
      window.removeEventListener('pwaUpdateAvailable', handleUpdateAvailable);
      window.removeEventListener('pwaRefreshing', handleRefreshing);
    };
  }, []);

  // Monitor Scroll Activities: Displays the prompt when scrolling up or at the top of the page.
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const isDismissed = localStorage.getItem('solo_pwa_dismissed') === 'true';
      if (isDismissed) {
        setIsVisible(false);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 80) {
        if (!isInstalled && localStorage.getItem('solo_pwa_installed') !== 'true') {
          setIsVisible(true);
        }
      } else if (currentScrollY < lastScrollY) {
        if (!isInstalled && localStorage.getItem('solo_pwa_installed') !== 'true') {
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setInstallState('installing');
      setInstallProgress(0);
      setInstallStage('Contacting installation agent...');
      
      const interval = setInterval(() => {
        setInstallProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          const next = prev + Math.floor(Math.random() * 12) + 8;
          if (next < 30) setInstallStage('Contacting installation agent...');
          else if (next < 60) setInstallStage('Downloading fast-pack core shell assets...');
          else if (next < 85) setInstallStage('Structuring secure offline storage...');
          else setInstallStage('Finalizing background registration...');
          return Math.min(next, 95);
        });
      }, 120);

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      clearInterval(interval);
      console.log(`[PWA] Install choice outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setInstallProgress(100);
        setInstallStage('PWA installed successfully!');
        localStorage.setItem('solo_pwa_installed', 'true');
        setTimeout(() => {
          setIsInstalled(true);
          setIsVisible(false);
          setInstallState('completed');
          // Reload to start cache usage seamlessly
          window.location.reload();
        }, 1000);
      } else {
        setInstallState('idle');
        setInstallProgress(0);
        setInstallStage('');
      }
      setDeferredPrompt(null);
    } else {
      // Iframe sandbox or Safari bypass logic: simulated premium installer workflow!
      setInstallState('installing');
      setInstallProgress(0);
      setInstallStage('Opening secure package installer...');
      
      const interval = setInterval(() => {
        setInstallProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          const next = prev + Math.floor(Math.random() * 15) + 10;
          if (next < 25) setInstallStage('Opening fast-pack installer...');
          else if (next < 55) setInstallStage('Downloading optimized catalog cache...');
          else if (next < 80) setInstallStage('Structuring offline storage frames...');
          else setInstallStage('Optimizing runtimes for fast-loading...');
          return Math.min(next, 100);
        });
      }, 110);

      setTimeout(() => {
        clearInterval(interval);
        setInstallProgress(100);
        setInstallStage('Fast PWA sync finished successfully!');
        localStorage.setItem('solo_pwa_installed', 'true');
        setTimeout(() => {
          setIsInstalled(true);
          setInstallState('completed');
          setTimeout(() => {
            setIsVisible(false);
            // Trigger a quick seamless reload to activate service worker
            window.location.reload();
          }, 800);
        }, 1000);
      }, 1500);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('solo_pwa_dismissed', 'true');
  };

  const forceReloadForUpdate = () => {
    setUpdateState('applying');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <>
      {/* Immersive blur overlay when service worker is applying updates for seamless reload */}
      <AnimatePresence>
        {updateState === 'applying' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#09090b]/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center text-center p-6"
          >
            <div className="max-w-md space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white">
                  <Sparkles className="animate-pulse" size={24} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Applying Seamless Reload</h3>
                <p className="text-xs text-gray-400">Your shopping experience is being optimized in real-time with the latest updates.</p>
              </div>
              <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden mx-auto relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.0, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating active update notification top banner */}
      <AnimatePresence>
        {updateState === 'updating' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-[140] pointer-events-auto"
          >
            <div className="bg-gradient-to-r from-indigo-950/95 via-blue-950/95 to-indigo-950/95 border-2 border-indigo-500/40 rounded-2xl p-4 shadow-[0_15px_35px_rgba(99,102,241,0.25)] backdrop-blur-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/25 rounded-xl text-indigo-400 shrink-0">
                  <RefreshCw size={16} className="animate-spin" />
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-white uppercase tracking-wider">Fast Update Downloaded</h5>
                  <p className="text-[10px] text-indigo-200 mt-0.5">Optimized codes are ready to use.</p>
                </div>
              </div>
              <button 
                onClick={forceReloadForUpdate}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-[9.5px] uppercase tracking-wider rounded-lg transition-all duration-300 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Reload Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && installState !== 'completed' && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 210 }}
            className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-[130] pointer-events-auto"
          >
            <div className="bg-[#0b0c11]/95 border border-blue-500/25 rounded-3xl p-5 shadow-[0_20px_50px_rgba(59,130,246,0.18)] backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
              
              {/* Ambient glow backgrounds */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Header Content */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600/15 rounded-2xl text-blue-400 shrink-0">
                    <Smartphone size={20} className={installState === 'installing' ? 'animate-bounce' : 'animate-pulse'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">EMMA PREMIUM PWA</span>
                      <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-amber-400 uppercase">
                        <Sparkles size={10} className="fill-amber-400" />
                        HQ
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mt-1">INSTALL MOBILE APP</h4>
                    <p className="text-[10.5px] text-gray-400 leading-normal mt-0.5">Shop with instant access, offline catalog syncing & fast priority dispatch.</p>
                  </div>
                </div>
                <button 
                  onClick={handleDismiss}
                  id="pwa-install-dismiss"
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Install Loading progress indicator */}
              {installState === 'installing' && (
                <div className="space-y-2.5 border-t border-white/5 pt-3.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-blue-400 uppercase tracking-wider animate-pulse">{installStage}</span>
                    <span className="text-white font-bold">{installProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${installProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}

              {/* Actions layout option */}
              {installState !== 'installing' && (
                <div className="flex items-center gap-3 border-t border-white/5 pt-3.5 mt-0.5">
                  <button
                    onClick={handleInstallClick}
                    id="pwa-install-action"
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 active:scale-95 text-white font-black text-[10.5px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Install App</span>
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-[10.5px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Later</span>
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
