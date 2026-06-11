import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Github, MessageSquare, Home, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip } from '../ui/Tooltip';

interface FooterProps {
  t: any;
  onCategorySelect: (category: string | null) => void;
  onAdminPanelClick: () => void;
}

export function Footer({ t, onCategorySelect, onAdminPanelClick }: FooterProps) {
  return (
    <footer className="relative z-10 bg-[#020202] border-t border-white/[0.04] pt-10 pb-20 md:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Layout: 2 Columns for Space Efficiency */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10 pb-8 border-b border-white/[0.03] text-left">
          
          {/* Column 1: Physical Station Hub & Coordinates (2.2328081, 32.8932380) */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-mono tracking-[0.3em] text-blue-400 font-extrabold uppercase">
                ACTIVE PHYSICAL OUTPOST
              </span>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-white font-black text-sm uppercase italic tracking-tight">
                Lira Central Hub
              </h4>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                Plot 18, Lira Main Street, Northern Region, Uganda. 
                Sealed warehouse collection & direct counter pickup.
              </p>
            </div>

            {/* Micro-telemetry details and direction link */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[10px] font-mono text-gray-400 font-black">
                <MapPin size={12} className="text-blue-500" />
                2.2328081° N, 32.8932380° E
              </div>

              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=2.2328081,32.8932380"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3- py-1.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
              >
                <Navigation size={11} className="animate-pulse" />
                GET DIRECTIONS
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-5 flex flex-col items-start md:items-end justify-between space-y-4 md:space-y-0 text-left md:text-right">
            <div>
              <h3 className="text-white font-black text-xs uppercase tracking-widest font-mono mb-2 md:mb-3">Quick Navigation</h3>
              <ul className="flex flex-wrap md:justify-end gap-x-4 gap-y-2 text-xs text-gray-400 font-mono">
                <li className="hover:text-blue-500 transition-colors cursor-pointer font-bold" onClick={() => onCategorySelect(null)}>
                  [ HOME ]
                </li>
                <li className="hover:text-white transition-colors cursor-pointer" onClick={() => onCategorySelect('Phones')}>PHONES</li>
                <li className="hover:text-white transition-colors cursor-pointer" onClick={() => onCategorySelect('Computers')}>LAPTOPS</li>
                <li className="hover:text-white transition-colors cursor-pointer" onClick={() => onCategorySelect('Electronics')}>DEVICES</li>
                <li className="hover:text-blue-500 transition-colors cursor-pointer font-bold" onClick={onAdminPanelClick}>
                  [ STAFF ]
                </li>
              </ul>
            </div>

            {/* Back to top mini button */}
            <button 
              onClick={() => { onCategorySelect(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-white rounded-xl text-[9px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
            >
              <Home size={11} />
              TOP SLIDE
            </button>
          </div>

        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <p className="text-[9px] text-gray-600 font-mono tracking-widest uppercase">
            &copy; {new Date().getFullYear()} SOLO'S PHONES & ELECTRONICS. CODESYNCED TRANSIT NODES Uganda.
          </p>
        </div>
      </div>
    </footer>
  );
}
