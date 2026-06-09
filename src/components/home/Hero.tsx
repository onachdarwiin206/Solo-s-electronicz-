import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ShieldCheck, 
  Laptop, 
  Headphones, 
  Star, 
  Cpu, 
  Clock, 
  MapPin, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Search,
  CheckCircle,
  Sparkles,
  Watch,
  MessageCircle,
  Truck
} from 'lucide-react';

interface HeroProps {
  onShopNow: () => void;
  onMarketingClick: () => void;
  t: any;
}

export function Hero({ onShopNow, onMarketingClick, t }: HeroProps) {
  // Particles for ambient glow depth
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);
  
  // Interactive mini order tracking simulator state inside the hero
  const [activeTab, setActiveTab] = useState<'featured' | 'track'>('featured');
  const [typedOrderId, setTypedOrderId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Simulated statistics count-up
  const [stats, setStats] = useState({ sold: 8200, users: 3800, rate: 97 });

  useEffect(() => {
    // Generate particles
    const items = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 10,
      size: 2 + Math.random() * 3,
    }));
    setParticles(items);

    // Count up stat intervals
    const interval = setInterval(() => {
      setStats(prev => ({
        sold: prev.sold < 10000 ? prev.sold + 185 : 10000,
        users: prev.users < 4500 ? prev.users + 65 : 4500,
        rate: prev.rate < 99 ? prev.rate + 1 : 99.8
      }));
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleTrackSearch = () => {
    const code = typedOrderId.trim().toUpperCase();
    if (!code) {
      setErrorMessage('Please supply an Active Requisition ID (e.g. SOLO-DEMO).');
      setTrackingResult(null);
      return;
    }
    setErrorMessage('');

    if (code === 'SOLO-DEMO' || code === 'DEMO' || code === 'SOLO-SAMPLE' || code === 'SOLO-SAMPLE-UG') {
      setTrackingResult({
        id: 'SOLO-9844-LIRA',
        recipient: 'Darwin Onach',
        destination: 'Lira City West, Uganda',
        status: 'In Transit',
        eta: '35 mins (Express Route)',
        carrier: 'Solo Fleet Dispatch Unit 3',
        item: 'MacBook Pro M3 Max & AirPods Pro',
        logs: [
          { time: '11:30 AM', msg: 'Requisition committed & inventory verified' },
          { time: '12:15 PM', msg: 'Assurance certificate stamped by quality control' },
          { time: '02:40 PM', msg: 'Dispatched from Lira City Central Hub' }
        ]
      });
    } else {
      setErrorMessage(`No matching requisition for "${code}". Try entering 'SOLO-DEMO' to preview tracker logs!`);
      setTrackingResult(null);
    }
  };

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#030307]">
      
      {/* 1. Subtle Grid Overlay & Ambient Purple-Blue Spotlights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d0d18_1px,transparent_1px),linear-gradient(to_bottom,#0d0d18_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_65%,transparent_100%)] opacity-80 pointer-events-none" />
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(37,99,235,0.08),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(139,92,246,0.07),transparent_55%)] pointer-events-none" />
      
      {/* Animated Light Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 2. Floating Atmospheric Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: '105vh', x: `${p.left}vw`, opacity: 0 }}
            animate={{ y: '-10vh', opacity: [0, 0.5, 0.5, 0] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'linear'
            }}
            style={{ width: p.size, height: p.size }}
            className="absolute rounded-full bg-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* 3. Left Hand Side: Direct High-Performance Value Pitch */}
        <div className="lg:col-span-7 flex flex-col text-left space-y-6">
          
          {/* Environment and Status Badges */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-[9px] font-mono font-black text-blue-400 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
              SOLO-FLOW // SANDBOX-SECURE
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-900 border border-white/10 rounded-full text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest">
              <Award size={10} className="text-yellow-500" />
              STABLE VERIFICATION LOGS
            </span>
          </div>

          {/* Large Premium Typographic Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-100 to-neutral-400">
                Premium Tech Feed
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-white italic">
                Directly to Lira City
              </span>
            </h1>
          </div>

          {/* Informative Conversion-focused Sub-headline */}
          <p className="text-sm sm:text-base text-gray-400 font-normal leading-relaxed max-w-xl">
            Acquire 100% authentic international smartphones, high-efficiency laptops, smartwatches, and ANC accessories. Fully protected by our 12-month Solo Assurance warranty and rapid local desk-hand delivery.
          </p>

          {/* Action-Driving Button Structure */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={onShopNow}
              id="hero-primary-cta"
              className="px-8 py-4.5 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_35px_rgba(37,99,235,0.35)] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
            >
              <span>Explore Hardware Catalog</span>
              <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
            
            <button 
              onClick={() => {
                setActiveTab('track');
                document.getElementById('tech-bento-cabinet')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4.5 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={13} className="text-indigo-400" />
              <span>Interactive Tech Radar</span>
            </button>
          </div>

          {/* Trust indicators placed directly above the fold */}
          <div className="pt-6 border-t border-white/5">
            <p className="text-[10px] font-mono font-black uppercase text-gray-500 tracking-[0.15em] mb-4">
              SECURE DISTRIBUTION PARADIGM
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-start gap-2">
                <div className="p-1 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400 mt-0.5">
                  <ShieldCheck size={13} />
                </div>
                <div>
                  <p className="text-[10.5px] font-black text-white uppercase tracking-tight">100% Authentic</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Verified Serial Logs</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1 bg-blue-500/10 rounded border border-blue-500/20 text-blue-400 mt-0.5">
                  <Truck size={13} />
                </div>
                <div>
                  <p className="text-[10.5px] font-black text-white uppercase tracking-tight">Rapid Sourcing</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">Express Dispatch Pool</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1 bg-indigo-500/10 rounded border border-indigo-500/20 text-indigo-400 mt-0.5">
                  <Cpu size={13} />
                </div>
                <div>
                  <p className="text-[10.5px] font-black text-white uppercase tracking-tight">Full Warranty</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">12-Month Coverage</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1 bg-orange-400/10 rounded border border-orange-500/20 text-orange-400 mt-0.5">
                  <Star size={13} className="fill-orange-400/20" />
                </div>
                <div>
                  <p className="text-[10.5px] font-black text-white uppercase tracking-tight">4.9/5 Rating</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">1,240+ Verified Users</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4. Right Hand Side: Interactive Bento Showcase and Operations Cabin */}
        <div id="tech-bento-cabinet" className="lg:col-span-5 h-full relative">
          
          <div className="bg-gradient-to-br from-white/10 to-white/[0.01] border border-white/10 rounded-[2.5rem] p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col min-h-[480px]">
            {/* Corner soft glow effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            
            {/* Bento Tab Buttons - Switch between visual cabinet and real-time verification simulator */}
            <div className="grid grid-cols-2 bg-black/45 border border-white/10 rounded-2xl p-1 relative z-10 mb-5">
              <button 
                onClick={() => setActiveTab('featured')}
                className={`py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                  activeTab === 'featured' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-white'
                }`}
              >
                Hardware Cabinet
              </button>
              <button 
                onClick={() => setActiveTab('track')}
                className={`py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'track' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                <TrendingUp size={11} />
                Live Logistics Radar
              </button>
            </div>

            {/* TAB CONTENT: CABINET */}
            <AnimatePresence mode="wait">
              {activeTab === 'featured' && (
                <motion.div 
                  key="featured"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 flex flex-col justify-between relative"
                >
                  {/* Floating Devices Grid visual layout */}
                  <div className="relative h-64 flex items-center justify-center w-full my-4">
                    
                    {/* Layer 1: Notebook Showcase */}
                    <motion.div 
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute z-10 w-52 h-32 bg-neutral-900 border border-white/15 rounded-2xl p-3 shadow-xl flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Laptop size={14} className="text-blue-500" />
                          <span className="text-[8px] font-mono font-bold text-gray-300">MACBOOK PRO M3</span>
                        </div>
                        <span className="text-[6.5px] font-mono font-black text-blue-400 bg-blue-500/10 px-1 rounded">M3 MAX</span>
                      </div>
                      <div className="w-full h-11 bg-black/60 rounded-lg p-2 flex flex-col justify-between">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500/80" />
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                        </div>
                        <p className="text-[7.5px] font-mono text-gray-400 font-bold">LIRA RESORT HARDWARE FEED</p>
                      </div>
                      <div className="w-full h-1 bg-white/30 rounded-full mt-1 shrink-0" />
                    </motion.div>

                    {/* Layer 2: Smartphone Overlapping floating card */}
                    <motion.div 
                      animate={{ y: [-5, 5, -5], x: [-2, 2, -2] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute z-20 left-4 top-4 w-28 h-48 bg-neutral-950 border border-white/20 rounded-[1.75rem] p-2.5 shadow-2xl flex flex-col justify-between"
                    >
                      {/* Dynamic Notch */}
                      <div className="w-14 h-3 bg-black border border-white/10 rounded-full mx-auto flex items-center justify-center shrink-0">
                        <div className="w-1 h-1 rounded-full bg-neutral-800" />
                      </div>
                      <div className="flex-1 w-full bg-gradient-to-b from-blue-950/40 to-neutral-900/60 rounded-2xl p-2 flex flex-col justify-between overflow-hidden mt-1">
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-[6px] font-mono text-gray-500 uppercase tracking-widest">GENUINE SECURE</span>
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-white tracking-tight uppercase">iPhone 15 Pro Max</p>
                          <p className="text-[7px] text-blue-400 font-mono font-bold">12-MO WARRANTY</p>
                        </div>
                      </div>
                      <div className="h-0.5" />
                    </motion.div>

                    {/* Layer 3: Audio Buds Box floating card */}
                    <motion.div 
                      animate={{ y: [6, -6, 6], x: [3, -3, 3] }}
                      transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute z-20 -right-6 bottom-4 w-32 h-24 bg-neutral-900/90 border border-white/15 rounded-2.5xl p-3 shadow-2xl flex flex-col justify-between backdrop-blur-md"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1">
                          <Headphones size={13} className="text-purple-400" />
                          <span className="text-[7px] font-mono text-gray-400 uppercase">PODS ULTRA</span>
                        </div>
                        <span className="text-[8px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">98% STABLE</span>
                      </div>
                      <p className="text-[9px] font-bold text-white uppercase italic truncate">Active Sound Isolation</p>
                      <div className="flex items-center gap-1 text-[7px] font-mono text-gray-500 mt-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span>Ready to dispatch</span>
                      </div>
                    </motion.div>

                  </div>

                  {/* Glassmorphic active terminal log readout nested at bento bottom */}
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-3 font-mono text-[9px] text-gray-400 space-y-1.5 relative mt-auto">
                    <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                      <span className="text-[7px] font-bold text-emerald-500 uppercase">TELEMETRY ON</span>
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <p className="font-bold text-[10px] text-white uppercase">ACTIVATED POOL STATS</p>
                    <div className="flex justify-between"><span className="text-gray-500">&gt; STABLE DISPATCH:</span><span className="text-blue-400">100% IN LIRA CITY</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">&gt; TEST ASSURANCES:</span><span className="text-white">VERIFIED IMPORTER CHANNEL</span></div>
                  </div>
                </motion.div>
              )}

              {/* TAB CONTENT: REAL TIME LOGISTICS SIMULATOR (RADAR) */}
              {activeTab === 'track' && (
                <motion.div 
                  key="track"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex-1 flex flex-col"
                >
                  <p className="text-[8px] font-mono font-black uppercase text-indigo-400 tracking-[0.2em] mb-4">
                    SECURE REQUISITION TRACKING NODE
                  </p>

                  {/* Mock search interface */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-1 flex focus-within:border-indigo-500/40 transition-colors mb-4 relative z-10">
                    <input 
                      type="text"
                      className="bg-transparent text-white font-mono uppercase text-[9px] p-3 border-none outline-none flex-1 tracking-widest"
                      placeholder="Enter ID (Try 'SOLO-DEMO')"
                      value={typedOrderId}
                      onChange={(e) => setTypedOrderId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTrackSearch();
                      }}
                    />
                    <button 
                      onClick={handleTrackSearch}
                      className="bg-indigo-600 hover:bg-indigo-500 transition-all font-mono font-black text-[9px] text-white uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search size={10} />
                      <span>Radar Lock</span>
                    </button>
                  </div>

                  {errorMessage && (
                    <p className="text-red-400 font-mono text-[8.5px] uppercase tracking-wide mb-3 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full animate-ping shrink-0" />
                      <span>{errorMessage}</span>
                    </p>
                  )}

                  {!trackingResult ? (
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center py-8">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                        <Truck size={16} />
                      </div>
                      <p className="text-[10px] text-white uppercase font-black tracking-widest">Active Dispatch Log Feed</p>
                      <p className="text-[9px] text-gray-500 mt-1 max-w-[220px] leading-relaxed">
                        Insert <span className="text-indigo-400 font-mono font-bold bg-indigo-950/40 px-1 py-0.5 border border-indigo-500/10 rounded">SOLO-DEMO</span> to inspect simulated express logistics flow logs.
                      </p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="space-y-4"
                    >
                      {/* Active Info */}
                      <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex justify-between items-center text-[9.5px]">
                        <div>
                          <span className="text-[7.5px] font-mono text-gray-500 block">REQUISITION REF</span>
                          <span className="font-mono text-white font-bold">{trackingResult.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] font-mono text-gray-500 block">ESTIMATED COMPLEMENT</span>
                          <span className="font-mono text-indigo-400 font-bold">{trackingResult.eta}</span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="relative pl-4 space-y-3.5 before:content-[''] before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-white/10 text-[9px] font-mono select-none">
                        {trackingResult.logs.map((log: any, i: number) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-black" />
                            <div className="flex gap-2 items-center">
                              <span className="text-gray-500">{log.time}</span>
                              <span className="text-white font-bold leading-none">{log.msg}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl flex items-center gap-2">
                        <MapPin size={11} className="text-red-400 shrink-0" />
                        <span className="text-[8px] font-mono text-gray-400 truncate">
                          Currently managed by: <span className="text-white font-bold">{trackingResult.carrier}</span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Static Count-Up Counters row */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 mt-4">
              <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <p className="text-base sm:text-lg font-black text-white font-mono tracking-tight">{(stats.sold).toLocaleString()}+</p>
                <p className="text-[7.5px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Units Sourced</p>
              </div>
              <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <p className="text-base sm:text-lg font-black text-indigo-400 font-mono tracking-tight">{(stats.users).toLocaleString()}+</p>
                <p className="text-[7.5px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Active Desk Logs</p>
              </div>
              <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <p className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight">{stats.rate}%+</p>
                <p className="text-[7.5px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Success Trace</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
