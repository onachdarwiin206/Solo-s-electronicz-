import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Smartphone, X, Sparkles, Check } from 'lucide-react';

export function AndroidInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'completed'>('idle');

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
      setIsVisible(true);
    };

    window.addEventListener('triggerPwaPrompt', handleTriggerPwa);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('triggerPwaPrompt', handleTriggerPwa);
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
        // At or near the top: Show if not already installed/dismissed
        if (!isInstalled && localStorage.getItem('solo_pwa_installed') !== 'true') {
          setIsVisible(true);
        }
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up: Show prompt if not already installed/dismissed
        if (!isInstalled && localStorage.getItem('solo_pwa_installed') !== 'true') {
          setIsVisible(true);
        }
      } else {
        // Scrolling down: Hide prompt
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
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install choice outcome: ${outcome}`);
      if (outcome === 'accepted') {
        localStorage.setItem('solo_pwa_installed', 'true');
        setIsInstalled(true);
        setIsVisible(false);
        setInstallState('completed');
      } else {
        setInstallState('idle');
      }
      setDeferredPrompt(null);
    } else {
      // Iframe sandbox or Safari bypass logic: simulated premium installer workflow!
      setInstallState('installing');
      setTimeout(() => {
        localStorage.setItem('solo_pwa_installed', 'true');
        setIsInstalled(true);
        setInstallState('completed');
        setTimeout(() => {
          setIsVisible(false);
        }, 1500);
      }, 2000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('solo_pwa_dismissed', 'true');
  };

  if (isInstalled || installState === 'completed') {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
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
                  <Smartphone size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">[BUSINESS NAME] PREMIUM PWA</span>
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

            {/* Layout options */}
            <div className="flex items-center gap-3 border-t border-white/5 pt-3.5 mt-0.5">
              <button
                onClick={handleInstallClick}
                disabled={installState === 'installing'}
                id="pwa-install-action"
                className="flex-1 py-3 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 active:scale-95 disabled:hover:scale-100 disabled:opacity-50 text-white font-black text-[10.5px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {installState === 'installing' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>INSTALLING...</span>
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    <span>Install App</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black text-[10.5px] uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Later</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
