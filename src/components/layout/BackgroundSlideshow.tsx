import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../ThemeContext';
import { 
  Play, Pause, Sliders, X, Sparkles, CheckCircle, Eye, 
  Cpu, Compass, Palette, EyeOff, Layers, Settings, ChevronRight
} from 'lucide-react';

import techExperienceBg from '../../assets/images/tech_experience_bg_1783451786483.jpg';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  depth: number;
  glow: boolean;
  opacity: number;
  pulseSpeed: number;
}

interface Slide {
  id: string;
  name: string;
  description: string;
  url: string;
  tag: string;
}

const SLIDES: Slide[] = [
  {
    id: 'tech-experience-bg',
    name: 'Tech Experience',
    description: 'A premium, cinematic, futuristic electronics showroom experience center.',
    url: techExperienceBg,
    tag: 'FUTURISTIC TECH'
  }
];

type ParticleDensity = 'none' | 'low' | 'high' | 'hyper';
type SpotlightColor = 'cobalt' | 'teal' | 'fuchsia' | 'gold' | 'off';

export function BackgroundSlideshow() {
  const { theme } = useTheme();
  const bgRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);

  // States with local storage hydration - locked to 0 (the new image) per user request
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const [isSlideshowPaused, setIsSlideshowPaused] = useState<boolean>(true);

  const [particleDensity, setParticleDensity] = useState<ParticleDensity>(() => {
    try {
      const saved = localStorage.getItem('solo_bg_particle_density') as ParticleDensity | null;
      if (saved && ['none', 'low', 'high', 'hyper'].includes(saved)) return saved;
    } catch {}
    return 'high';
  });

  const [spotlightColor, setSpotlightColor] = useState<SpotlightColor>(() => {
    try {
      const saved = localStorage.getItem('solo_bg_spotlight_color') as SpotlightColor | null;
      if (saved && ['cobalt', 'teal', 'fuchsia', 'gold', 'off'].includes(saved)) return saved;
    } catch {}
    return 'cobalt';
  });

  // Save states to local storage safely
  useEffect(() => {
    try {
      localStorage.setItem('solo_bg_slide_id', SLIDES[currentSlideIndex].id);
    } catch (e) {
      console.warn('[Slideshow] LocalStorage access blocked:', e);
    }
  }, [currentSlideIndex]);

  useEffect(() => {
    try {
      localStorage.setItem('solo_bg_paused', String(isSlideshowPaused));
    } catch (e) {
      console.warn('[Slideshow] LocalStorage access blocked:', e);
    }
  }, [isSlideshowPaused]);

  useEffect(() => {
    try {
      localStorage.setItem('solo_bg_particle_density', particleDensity);
    } catch (e) {
      console.warn('[Slideshow] LocalStorage access blocked:', e);
    }
  }, [particleDensity]);

  useEffect(() => {
    try {
      localStorage.setItem('solo_bg_spotlight_color', spotlightColor);
    } catch (e) {
      console.warn('[Slideshow] LocalStorage access blocked:', e);
    }
  }, [spotlightColor]);

  // Responsive device classification
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Automatic slideshow transition sequence is disabled to maintain the second image in the background
  useEffect(() => {
    // Disabled to maintain the second image
  }, []);

  // Mouse interaction handling
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPct = (clientX / window.innerWidth - 0.5) * 2; // -1 to +1
      const yPct = (clientY / window.innerHeight - 0.5) * 2; // -1 to +1
      const pctX = (clientX / window.innerWidth) * 100;
      const pctY = (clientY / window.innerHeight) * 100;
      
      if (bgRef.current) {
        bgRef.current.style.setProperty('--mouse-x', `${xPct}`);
        bgRef.current.style.setProperty('--mouse-y', `${yPct}`);
        bgRef.current.style.setProperty('--mouse-x-pct', `${pctX}%`);
        bgRef.current.style.setProperty('--mouse-y-pct', `${pctY}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  // Scroll depth response
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (bgRef.current) {
        bgRef.current.style.setProperty('--scroll-y', `${scrollY}px`);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Spatial static grid alignments (purely visual subtle wireframe elements)
  const techIndicators = useMemo(() => {
    if (isMobile) return [];
    return [
      { top: '15%', left: '8%', label: 'GRID.POS.01' },
      { top: '35%', right: '12%', label: 'LUXURY.AURA.7' },
      { top: '75%', left: '6%', label: 'SYS.SPECTRUM.B' },
      { top: '85%', right: '15%', label: 'STANDBY.IDLE.0' },
    ];
  }, [isMobile]);

  // Dynamically configure spotlight halo color gradients
  const selectSpotlightStyle = () => {
    if (spotlightColor === 'off') return 'transparent';
    const colorMap: Record<Exclude<SpotlightColor, 'off'>, string> = {
      cobalt: theme === 'light' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.16)',
      teal: theme === 'light' ? 'rgba(20, 184, 166, 0.09)' : 'rgba(13, 148, 136, 0.17)',
      fuchsia: theme === 'light' ? 'rgba(217, 70, 239, 0.07)' : 'rgba(162, 28, 175, 0.16)',
      gold: theme === 'light' ? 'rgba(234, 179, 8, 0.06)' : 'rgba(161, 98, 7, 0.14)'
    };
    const activeColor = colorMap[spotlightColor];
    return `radial-gradient(circle 380px at var(--mouse-x-pct, 50%) var(--mouse-y-pct, 50%), ${activeColor}, transparent 80%)`;
  };

  // Memoize floating particles to avoid high frequency re-renders
  const particles = useMemo<Particle[]>(() => {
    if (particleDensity === 'none') return [];
    let count = isMobile ? 8 : 28;
    if (particleDensity === 'low') count = Math.floor(count * 0.4);
    if (particleDensity === 'hyper') count = Math.floor(count * 1.8);

    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.2 + 0.8, // 0.8px to 3px
      depth: (Math.random() * 1.6) + 0.4, 
      glow: Math.random() > 0.45,
      opacity: Math.random() * 0.28 + 0.08,
      pulseSpeed: Math.random() * 4.5 + 1.5, // 1.5s to 6s
    }));
  }, [isMobile, particleDensity]);

  return (
    <div 
      ref={bgRef}
      className="fixed inset-0 z-[-1] overflow-hidden select-none pointer-events-none"
      style={{
        backgroundColor: theme === 'light' ? '#fbfcfe' : '#020207',
        '--mouse-x': '0',
        '--mouse-y': '0',
        '--scroll-y': '0px',
      } as React.CSSProperties}
    >
      {/* Embedded High-Performance Animations Styles */}
      <style>{`
        @keyframes meshOrbitPrimary {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          50% { transform: translate(40px, -35px) scale(1.1) rotate(180deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }

        @keyframes meshOrbitSecondary {
          0% { transform: translate(0px, 0px) scale(1.05) rotate(180deg); }
          50% { transform: translate(-45px, 25px) scale(0.95) rotate(360deg); }
          100% { transform: translate(0px, 0px) scale(1.05) rotate(540deg); }
        }

        @keyframes particlePulse {
          0%, 100% { opacity: 0.06; transform: scale(0.9); }
          50% { opacity: 0.45; transform: scale(1.2); }
        }

        @keyframes auroraWavelength {
          0% { transform: translate(0px, 0px) scaleY(1); opacity: 0.01; }
          50% { transform: translate(25px, -15px) scaleY(1.05); opacity: 0.025; }
          100% { transform: translate(0px, 0px) scaleY(1); opacity: 0.01; }
        }

        .animated-mesh-primary {
          animation: meshOrbitPrimary 50s infinite ease-in-out;
        }

        .animated-mesh-secondary {
          animation: meshOrbitSecondary 65s infinite ease-in-out;
        }

        .glass-contrast-overlay {
          background-image: radial-gradient(circle at 50% 50%, transparent 15%, ${theme === 'light' ? '#ffffff' : '#020207'} 98%);
        }

        .tech-fineline-grid {
          background-image: 
            linear-gradient(${theme === 'light' ? 'rgba(30, 41, 59, 0.035)' : 'rgba(255, 255, 255, 0.006)'} 1px, transparent 1px),
            linear-gradient(90deg, ${theme === 'light' ? 'rgba(30, 41, 59, 0.035)' : 'rgba(255, 255, 255, 0.006)'} 1px, transparent 1px);
          background-size: 60px 60px;
          background-position: center center;
          mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.1) 90%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0.1) 90%);
        }

        .custom-glass-panel {
          background: ${theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(9, 9, 14, 0.85)'};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        @keyframes customZoomEvery5s {
          0%, 100% {
            transform: scale(1.0);
          }
          50% {
            transform: scale(1.15);
          }
        }

        .animated-custom-zoom {
          animation: customZoomEvery5s 5s infinite ease-in-out;
          will-change: transform;
        }
      `}</style>

      {/* LAYER 1: CINEMATIC IMAGES CROSSFADE WITH ZOOM EFFECT */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none"
        style={{
          transform: 'translate(calc(var(--mouse-x) * 14px), calc(var(--mouse-y) * 14px))',
          willChange: 'transform',
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <img
          src={SLIDES[0].url}
          alt={SLIDES[0].name}
          className="absolute inset-0 w-full h-full object-cover select-none animated-custom-zoom"
          referrerPolicy="no-referrer"
          style={{
            filter: theme === 'light'
              ? 'contrast(0.4) brightness(1.28) saturate(0.5)'
              : 'contrast(0.55) brightness(0.68) saturate(0.85)',
            transition: 'filter 0.6s ease-in-out',
          }}
        />
      </div>

      {/* LAYER 2: BLUR SPATIAL GLOWS MESH */}
      <div 
        className={`absolute inset-0 z-0 overflow-hidden blur-[120px] md:blur-[160px] pointer-events-none transition-all duration-1000 ${
          theme === 'light' ? 'opacity-[0.45] mix-blend-multiply' : 'opacity-[0.38] mix-blend-screen'
        }`}
        style={{
          transform: 'translate(calc(var(--mouse-x) * 7px), calc(var(--mouse-y) * 7px))',
          willChange: 'transform',
        }}
      >
        {/* Neon Blob A */}
        <div 
          className={`animated-mesh-primary absolute w-[260px] h-[260px] md:w-[500px] md:h-[500px] rounded-full transition-colors duration-1000 ${
            theme === 'light' ? 'bg-blue-300/30' : 'bg-cyan-500/10'
          } top-[-5%] left-[-5%]`} 
          style={{ willChange: 'transform' }}
        />
        
        {/* Neon Blob B */}
        <div 
          className={`animated-mesh-secondary absolute w-[300px] h-[300px] md:w-[650px] md:h-[650px] rounded-full transition-colors duration-1000 ${
            theme === 'light' ? 'bg-indigo-200/30' : 'bg-indigo-500/15'
          } bottom-[-10%] right-[-5%]`} 
          style={{ willChange: 'transform' }}
        />

        {/* Neon Blob C */}
        <div 
          className="animated-mesh-primary absolute w-[180px] h-[180px] md:w-[420px] md:h-[420px] rounded-full bg-violet-600/8 top-[20%] left-[35%] blur-[120px]"
          style={{ 
            animationDelay: '-18s',
            willChange: 'transform' 
          }}
        />
      </div>

      {/* LAYER 3: INTERACTIVE MOUSE HALO GRADIENT */}
      {!isMobile && spotlightColor !== 'off' && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none mix-blend-screen transition-all duration-1000"
          style={{
            background: selectSpotlightStyle(),
            willChange: 'background',
          }}
        />
      )}

      {/* LAYER 4: FLOATING CYBERPUNK PARTICLES */}
      {particles.length > 0 && (
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          {particles.map((p) => {
            const depthMultiplier = p.depth;
            return (
              <div
                key={p.id}
                className={`absolute rounded-full bg-white transition-all duration-1000 ${theme === 'light' ? 'bg-zinc-800' : 'bg-white'}`}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  opacity: p.opacity,
                  boxShadow: p.glow && theme !== 'light' ? '0 0 8px rgba(147, 51, 234, 0.4)' : undefined,
                  transform: `translate(
                    calc(var(--mouse-x) * ${depthMultiplier * 16}px),
                    calc(var(--mouse-y) * ${depthMultiplier * 16}px + var(--scroll-y) * ${depthMultiplier * -0.06})
                  )`,
                  animation: `particlePulse ${p.pulseSpeed}s ease-in-out ${p.id * 0.2}s infinite`,
                  willChange: 'transform',
                }}
              />
            );
          })}
        </div>
      )}

      {/* LAYER 5: TECH LINEWIRE GRID */}
      <div 
        className="absolute inset-0 z-0 tech-fineline-grid opacity-[0.14] md:opacity-[0.18] pointer-events-none"
        style={{
          transform: 'translateY(calc(var(--scroll-y) * -0.03))',
          willChange: 'transform',
        }}
      />

      {/* LAYER 6: ALIGNMENTS CUES CROSSHAIRS */}
      {!isMobile && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          {techIndicators.map((ti, index) => (
            <div 
              key={index} 
              className="absolute text-[8px] font-mono tracking-[0.2em] select-none flex items-center gap-2 transition-colors duration-1000 text-blue-500/50"
              style={{
                top: ti.top,
                left: ti.left,
                right: ti.right,
                transform: 'translate(calc(var(--mouse-x) * 3px), calc(var(--mouse-y) * 3px))',
                willChange: 'transform',
              }}
            >
              <span className="font-extrabold text-[10px] text-blue-400">+</span>
              <span>{ti.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* LAYER 7: AMBIENT OPTICS STREAKS */}
      <div className="absolute inset-x-0 bottom-[15%] top-[35%] z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-[0.02] filter blur-[80px]"
           style={{
             animation: 'auroraWavelength 28s infinite ease-in-out',
             willChange: 'transform',
           }}>
        <svg viewBox="0 0 1440 400" className="w-full h-full text-blue-500 fill-none opacity-45">
          <path 
            d="M-50,180 C200,300 400,100 750,260 C1100,420 1250,80 1590,220 L1590,400 L-50,400 Z" 
            stroke="rgba(59, 130, 246, 0.2)" 
            strokeWidth="2.5"
            fill="url(#optic-grad)"
          />
          <defs>
            <linearGradient id="optic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(37, 99, 235, 0.12)" />
              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.1)" />
              <stop offset="100%" stopColor="rgba(14, 165, 233, 0.12)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* RADIAL SCREEN VIGNETTE GLASS CONTRAST */}
      <div className="absolute inset-0 z-0 glass-contrast-overlay pointer-events-none opacity-[0.3]" />


      {/* INTERACTIVE CONTROLLER FLOATING TRIGGER — BOTTOM-LEFT */}
      <div className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 flex flex-col items-start gap-4 pointer-events-auto">
        <AnimatePresence>
          {hudOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-[320px] rounded-3xl border border-zinc-150 dark:border-zinc-800/80 p-5 shadow-2xl custom-glass-panel flex flex-col gap-4 text-left pointer-events-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-1.5 bg-blue-600/10 text-blue-500 rounded-lg">
                    <Sliders size={13} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black tracking-[0.15em] uppercase text-zinc-400">Atmosphere Engine</h4>
                    <span className="text-[8px] font-mono leading-none flex items-center gap-1 text-emerald-500 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      LIVE CALIBRATION
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setHudOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-100 bg-zinc-100/50 dark:bg-zinc-800/50 p-1.5 rounded-full hover:scale-105 transition-all cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Theme Slides selection list */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-black uppercase text-zinc-400 flex items-center gap-1">
                  <Layers size={10} />
                  Vignette Background Canvas
                </span>
                <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
                  {SLIDES.map((slide, idx) => {
                    const isSelected = idx === currentSlideIndex;
                    return (
                      <button
                        key={slide.id}
                        onClick={() => {
                          setCurrentSlideIndex(idx);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs cursor-pointer border ${
                          isSelected 
                            ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold' 
                            : 'bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-850 hover:bg-zinc-100/40 dark:hover:bg-zinc-900/40 hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{slide.name}</span>
                            <span className="text-[7.5px] px-1 bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 rounded font-mono font-bold leading-relaxed whitespace-nowrap uppercase">
                              {slide.tag}
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-400 leading-tight mt-0.5 truncate max-w-[210px]">
                            {slide.description}
                          </p>
                        </div>
                        {isSelected ? <CheckCircle size={12} className="shrink-0 text-blue-500" /> : <Eye size={11} className="text-zinc-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider panel properties */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Control particle density */}
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-zinc-400 flex items-center gap-1">
                    <Sparkles size={10} />
                    Aether Particles
                  </label>
                  <select
                    value={particleDensity}
                    onChange={(e) => setParticleDensity(e.target.value as ParticleDensity)}
                    className="w-full bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2 text-[10px] font-bold focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-200"
                  >
                    <option value="none">Disabled</option>
                    <option value="low">Sparse Sparse</option>
                    <option value="high">Luminescent High</option>
                    <option value="hyper">Hyper Solar Flow</option>
                  </select>
                </div>

                {/* Spotlight following selection */}
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black uppercase text-zinc-400 flex items-center gap-1 font-sans">
                    <Palette size={10} />
                    Cursor Streak
                  </label>
                  <select
                    value={spotlightColor}
                    onChange={(e) => setSpotlightColor(e.target.value as SpotlightColor)}
                    className="w-full bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2 text-[10px] font-bold focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-200"
                  >
                    <option value="off">Off</option>
                    <option value="cobalt">Cobalt Blue</option>
                    <option value="teal">Minty Teal</option>
                    <option value="fuchsia">Tech Fuchsia</option>
                    <option value="gold">Optic Gold</option>
                  </select>
                </div>
              </div>

              {/* Bottom control play-pause */}
              <div className="flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3 flex-wrap gap-2 text-xs">
                <button
                  onClick={() => setIsSlideshowPaused(!isSlideshowPaused)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9.5px] font-black uppercase font-mono tracking-widest cursor-pointer transition-all border ${
                    isSlideshowPaused 
                      ? 'bg-zinc-100 hover:bg-zinc-150 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 dark:text-zinc-300 dark:border-zinc-800' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-600/10'
                  }`}
                >
                  {isSlideshowPaused ? (
                    <>
                      <Play size={10} />
                      SLIDE ROTATION: PAUSED
                    </>
                  ) : (
                    <>
                      <Pause size={10} />
                      SLIDE ROTATION: ACTIVE
                    </>
                  )}
                </button>
                <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                  V2.4 // 60FPS
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shutter Toggle button */}
        {!hudOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setHudOpen(true)}
            className="w-10 h-10 md:w-11 md:h-11 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-md rounded-full shadow-lg border border-zinc-150 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-blue-500 hover:dark:text-blue-400 transition-all cursor-pointer group pointer-events-auto"
            title="Atmosphere Optimization"
          >
            <Compass size={18} className="group-hover:rotate-[45deg] transition-transform duration-500 ease-out shrink-0" />
            
            {/* Ambient tiny blinking notification badge */}
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
