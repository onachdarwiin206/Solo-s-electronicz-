import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../ThemeContext';

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

export function BackgroundSlideshow() {
  const { theme } = useTheme();
  const bgRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive device classification
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parallax interaction handling (pure CSS custom property updates for 60fps performance)
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const xPct = (clientX / window.innerWidth - 0.5) * 2; // -1 to +1
      const yPct = (clientY / window.innerHeight - 0.5) * 2; // -1 to +1
      
      if (bgRef.current) {
        bgRef.current.style.setProperty('--mouse-x', `${xPct}`);
        bgRef.current.style.setProperty('--mouse-y', `${yPct}`);
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

  // Floating Particles coordinates (statically memoized for stability across render frames)
  const particles = useMemo<Particle[]>(() => {
    const count = isMobile ? 8 : 28;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1, // 1px to 3px
      depth: (Math.random() * 1.5) + 0.5, // 0.5x to 2.0x translation intensity
      glow: Math.random() > 0.6,
      opacity: Math.random() * 0.25 + 0.1,
      pulseSpeed: Math.random() * 4 + 2, // 2s to 6s
    }));
  }, [isMobile]);

  // Static tech marker grid coordinates
  const techIndicators = useMemo(() => {
    if (isMobile) return [];
    return [
      { top: '15%', left: '8%', label: 'GRID.POS.01' },
      { top: '35%', right: '12%', label: 'LOGIS.CHAN.7' },
      { top: '75%', left: '6%', label: 'SYS.NOD.B' },
      { top: '85%', right: '15%', label: 'TERM.CON.0' },
    ];
  }, [isMobile]);

  return (
    <div 
      ref={bgRef}
      className="fixed inset-0 z-[-1] overflow-hidden select-none pointer-events-none"
      style={{
        backgroundColor: '#030303',
        '--mouse-x': '0',
        '--mouse-y': '0',
        '--scroll-y': '0px',
      } as React.CSSProperties}
    >
      {/* Embedded High-Performance Animations Styles */}
      <style>{`
        @keyframes bgBaseBreath {
          0% { background-position: 0% 50%; opacity: 0.94; }
          50% { background-position: 100% 50%; opacity: 1; }
          100% { background-position: 0% 50%; opacity: 0.94; }
        }

        @keyframes meshOrbitPrimary {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate(40px, -60px) scale(1.1) rotate(120deg); }
          66% { transform: translate(-30px, 40px) scale(0.95) rotate(240deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }

        @keyframes meshOrbitSecondary {
          0% { transform: translate(0px, 0px) scale(1.05) rotate(180deg); }
          50% { transform: translate(-50px, 50px) scale(0.9) rotate(360deg); }
          100% { transform: translate(0px, 0px) scale(1.05) rotate(540deg); }
        }

        @keyframes particlePulse {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 0.65; transform: scale(1.2); }
        }

        @keyframes auroraWavelength {
          0% { transform: translate(0px, 0px) scaleY(1); opacity: 0.015; }
          50% { transform: translate(25px, -15px) scaleY(1.08); opacity: 0.035; }
          100% { transform: translate(0px, 0px) scaleY(1); opacity: 0.015; }
        }

        .animated-mesh-primary {
          animation: meshOrbitPrimary 35s infinite ease-in-out;
        }

        .animated-mesh-secondary {
          animation: meshOrbitSecondary 42s infinite ease-in-out;
        }

        .glass-contrast-overlay {
          background-image: radial-gradient(circle at 50% 50%, transparent 15%, #030303 90%);
        }

        .tech-fineline-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: center center;
          mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.15) 85%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.15) 85%);
        }
      `}</style>

      {/* LAYER 1: DEEP GRADIENT COLD SOLID BASE */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-[#020204] via-[#04040a] to-[#070712] bg-[length:200%_200%] transition-colors duration-1000"
        style={{
          animation: 'bgBaseBreath 30s infinite ease-in-out',
        }}
      />

      {/* LAYER 2: LARGE MORPHING BLURRED COGNITIVE MESHES */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden opacity-[0.45] md:opacity-[0.55] blur-[100px] md:blur-[140px] mix-blend-screen"
        style={{
          transform: 'translate(calc(var(--mouse-x) * 12px), calc(var(--mouse-y) * 12px))',
          willChange: 'transform',
        }}
      >
        {/* Blob A - Electric Cyan */}
        <div 
          className="animated-mesh-primary absolute w-[240px] h-[240px] md:w-[480px] md:h-[480px] rounded-full bg-cyan-500/10 top-[-10%] left-[-5%]" 
          style={{ willChange: 'transform' }}
        />
        
        {/* Blob B - Quantum Blue / Indigo */}
        <div 
          className="animated-mesh-secondary absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-blue-600/12 bottom-[-15%] right-[-5%]" 
          style={{ willChange: 'transform' }}
        />

        {/* Blob C - Electric Violet / Purple */}
        <div 
          className="animated-mesh-primary absolute w-[200px] h-[200px] md:w-[450px] md:h-[450px] rounded-full bg-indigo-500/8 top-[25%] left-[30%]" 
          style={{ 
            animationDelay: '-12s',
            willChange: 'transform' 
          }}
        />

        {/* Dynamic theme-specific supplemental blur in Glass Mode for rich refraction */}
        {theme === 'glass' && (
          <div 
            className="absolute w-[350px] h-[350px] md:w-[550px] md:h-[550px] rounded-full bg-blue-400/15 top-[15%] right-[20%] blur-[120px]" 
          />
        )}
      </div>

      {/* LAYER 3: INTERACTIVE PARTICLE FIELD */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {particles.map((p) => {
          // Calculate motion combining parallax mouse tilt and scroll push relative to particle depth
          const depthMultiplier = p.depth;
          return (
            <div
              key={p.id}
              className="absolute bg-white rounded-full transition-shadow duration-300"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                boxShadow: p.glow ? '0 0 8px rgba(255, 255, 255, 0.8)' : undefined,
                transform: `translate(
                  calc(var(--mouse-x) * ${depthMultiplier * 24}px),
                  calc(var(--mouse-y) * ${depthMultiplier * 24}px + var(--scroll-y) * ${depthMultiplier * -0.12})
                )`,
                animation: `particlePulse ${p.pulseSpeed}s ease-in-out ${p.id * 0.3}s infinite`,
                willChange: 'transform',
              }}
            />
          );
        })}
      </div>

      {/* LAYER 4: LOGISTICS TECHNICAL GRID OVERLAY */}
      <div 
        className="absolute inset-0 z-0 tech-fineline-grid opacity-[0.22] md:opacity-[0.32]"
        style={{
          transform: 'translateY(calc(var(--scroll-y) * -0.04))',
          willChange: 'transform',
        }}
      />

      {/* SUBTLE LOGISTICS MATRIX CORNER ALIGNMENTS OR INDICATORS (Layer 4 Continued) */}
      {!isMobile && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          {techIndicators.map((ti, index) => (
            <div 
              key={index} 
              className="absolute text-[8px] font-mono tracking-widest text-blue-400/80 select-none flex items-center gap-2"
              style={{
                top: ti.top,
                left: ti.left,
                right: ti.right,
                transform: 'translate(calc(var(--mouse-x) * 4px), calc(var(--mouse-y) * 4px))',
                willChange: 'transform',
              }}
            >
              {/* Corner crosshairs */}
              <span className="font-extrabold text-[10px] text-blue-500">+</span>
              <span>{ti.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* LAYER 5: AMBIENT AURORA ENERGY STREAKS */}
      <div className="absolute inset-x-0 bottom-[10%] top-[40%] z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-[0.025] filter blur-[60px]"
           style={{
             animation: 'auroraWavelength 24s infinite ease-in-out',
             willChange: 'transform',
           }}>
        <svg viewBox="0 0 1440 400" className="w-full h-full text-blue-500 fill-none opacity-50">
          <path 
            d="M-100,200 C150,320 350,120 700,280 C1050,440 1200,100 1540,240 L1540,400 L-100,400 Z" 
            stroke="rgba(6, 182, 212, 0.4)" 
            strokeWidth="3"
            fill="url(#aurora-gradient)"
          />
          <defs>
            <linearGradient id="aurora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(37, 99, 235, 0.3)" />
              <stop offset="50%" stopColor="rgba(168, 85, 247, 0.15)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.3)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* RADIAL SCREEN VIGNETTE GLASS CONTRAST */}
      <div className="absolute inset-0 z-0 glass-contrast-overlay pointer-events-none opacity-[0.85]" />
    </div>
  );
}
