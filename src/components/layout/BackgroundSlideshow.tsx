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
        backgroundColor: '#000002',
        '--mouse-x': '0',
        '--mouse-y': '0',
        '--scroll-y': '0px',
      } as React.CSSProperties}
    >
      {/* Embedded High-Performance Animations Styles */}
      <style>{`
        @keyframes bgBaseBreath {
          0% { background-position: 0% 50%; opacity: 0.96; }
          50% { background-position: 100% 50%; opacity: 1; }
          100% { background-position: 0% 50%; opacity: 0.96; }
        }

        @keyframes meshOrbitPrimary {
          0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -45px) scale(1.08) rotate(120deg); }
          66% { transform: translate(-20px, 30px) scale(0.97) rotate(240deg); }
          100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
        }

        @keyframes meshOrbitSecondary {
          0% { transform: translate(0px, 0px) scale(1.02) rotate(180deg); }
          50% { transform: translate(-35px, 35px) scale(0.95) rotate(360deg); }
          100% { transform: translate(0px, 0px) scale(1.02) rotate(540deg); }
        }

        @keyframes particlePulse {
          0%, 100% { opacity: 0.05; transform: scale(0.85); }
          50% { opacity: 0.45; transform: scale(1.15); }
        }

        @keyframes auroraWavelength {
          0% { transform: translate(0px, 0px) scaleY(1); opacity: 0.01; }
          50% { transform: translate(15px, -10px) scaleY(1.04); opacity: 0.02; }
          100% { transform: translate(0px, 0px) scaleY(1); opacity: 0.01; }
        }

        .animated-mesh-primary {
          animation: meshOrbitPrimary 45s infinite ease-in-out;
        }

        .animated-mesh-secondary {
          animation: meshOrbitSecondary 52s infinite ease-in-out;
        }

        .glass-contrast-overlay {
          background-image: radial-gradient(circle at 50% 50%, transparent 20%, #000002 95%);
        }

        .tech-fineline-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.007) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.007) 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: center center;
          mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 15%, rgba(0,0,0,0.1) 90%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 15%, rgba(0,0,0,0.1) 90%);
        }
      `}</style>

      {/* LAYER 1: DEEP GRADIENT COLD SOLID BASE */}
      <div 
        className="absolute inset-0 bg-gradient-to-tr from-[#000002] via-[#010104] to-[#03030b] bg-[length:200%_200%] transition-colors duration-1000"
        style={{
          animation: 'bgBaseBreath 40s infinite ease-in-out',
        }}
      />

      {/* LAYER 2: LARGE MORPHING BLURRED COGNITIVE MESHES */}
      <div 
        className="absolute inset-0 z-0 overflow-hidden opacity-[0.35] blur-[110px] md:blur-[150px] mix-blend-screen"
        style={{
          transform: 'translate(calc(var(--mouse-x) * 8px), calc(var(--mouse-y) * 8px))',
          willChange: 'transform',
        }}
      >
        {/* Blob A - Electric Blue */}
        <div 
          className="animated-mesh-primary absolute w-[240px] h-[240px] md:w-[480px] md:h-[480px] rounded-full bg-blue-600/6 top-[-10%] left-[-5%]" 
          style={{ willChange: 'transform' }}
        />
        
        {/* Blob B - Dark Navy Accent */}
        <div 
          className="animated-mesh-secondary absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-indigo-950/20 bottom-[-15%] right-[-5%]" 
          style={{ willChange: 'transform' }}
        />

        {/* Blob C - Soft Purple Glow */}
        <div 
          className="animated-mesh-primary absolute w-[200px] h-[200px] md:w-[450px] md:h-[450px] rounded-full bg-purple-900/4 top-[25%] left-[30%]" 
          style={{ 
            animationDelay: '-15s',
            willChange: 'transform' 
          }}
        />

        {/* Dynamic theme-specific supplemental blur in Glass Mode for rich refraction */}
        {theme === 'glass' && (
          <div 
            className="absolute w-[350px] h-[350px] md:w-[550px] md:h-[550px] rounded-full bg-blue-500/8 top-[15%] right-[20%] blur-[130px]" 
          />
        )}
      </div>

      {/* LAYER 3: INTERACTIVE PARTICLE FIELD */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {particles.map((p) => {
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
                boxShadow: p.glow ? '0 0 6px rgba(147, 51, 234, 0.3)' : undefined,
                transform: `translate(
                  calc(var(--mouse-x) * ${depthMultiplier * 15}px),
                  calc(var(--mouse-y) * ${depthMultiplier * 15}px + var(--scroll-y) * ${depthMultiplier * -0.08})
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
        className="absolute inset-0 z-0 tech-fineline-grid opacity-[0.12] md:opacity-[0.16]"
        style={{
          transform: 'translateY(calc(var(--scroll-y) * -0.02))',
          willChange: 'transform',
        }}
      />

      {/* SUBTLE LOGISTICS MATRIX CORNER ALIGNMENTS OR INDICATORS (Layer 4 Continued) */}
      {!isMobile && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
          {techIndicators.map((ti, index) => (
            <div 
              key={index} 
              className="absolute text-[8px] font-mono tracking-widest text-blue-500/50 select-none flex items-center gap-2"
              style={{
                top: ti.top,
                left: ti.left,
                right: ti.right,
                transform: 'translate(calc(var(--mouse-x) * 2px), calc(var(--mouse-y) * 2px))',
                willChange: 'transform',
              }}
            >
              {/* Corner crosshairs */}
              <span className="font-extrabold text-[10px] text-blue-500/70">+</span>
              <span>{ti.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* LAYER 5: AMBIENT AURORA ENERGY STREAKS */}
      <div className="absolute inset-x-0 bottom-[10%] top-[40%] z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-[0.015] filter blur-[70px]"
           style={{
             animation: 'auroraWavelength 32s infinite ease-in-out',
             willChange: 'transform',
           }}>
        <svg viewBox="0 0 1440 400" className="w-full h-full text-blue-500 fill-none opacity-40">
          <path 
            d="M-100,200 C150,320 350,120 700,280 C1050,440 1200,100 1540,240 L1540,400 L-100,400 Z" 
            stroke="rgba(37, 99, 235, 0.2)" 
            strokeWidth="2"
            fill="url(#aurora-gradient)"
          />
          <defs>
            <linearGradient id="aurora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(29, 78, 216, 0.1)" />
              <stop offset="50%" stopColor="rgba(147, 51, 234, 0.08)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* RADIAL SCREEN VIGNETTE GLASS CONTRAST */}
      <div className="absolute inset-0 z-0 glass-contrast-overlay pointer-events-none opacity-[0.95]" />
    </div>
  );
}
