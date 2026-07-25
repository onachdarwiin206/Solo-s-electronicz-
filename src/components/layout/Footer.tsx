import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Github, MessageSquare, Home, Navigation, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip } from '../ui/Tooltip';

interface FooterProps {
  t: any;
  onCategorySelect: (category: string | null) => void;
  onAdminPanelClick: () => void;
}

export function Footer({ t, onCategorySelect, onAdminPanelClick }: FooterProps) {
  return (
    <footer className="relative z-10 bg-neutral-950 border-t border-neutral-900 pt-16 pb-20 md:pb-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Layout: Clean balanced columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12 pb-10 border-b border-neutral-900 text-left">
          
          {/* Column 1: Outpost coordinates and description */}
          <div className="md:col-span-7 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F68B1E] animate-pulse" />
              <span className="text-[9px] font-mono tracking-widest text-[#F68B1E] font-bold uppercase">
                ACTIVE PHYSICAL HUB
              </span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-white font-sans font-extrabold text-base uppercase tracking-tight">
                Lira Central Hub
              </h4>
              <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
                Plot 18, Lira Main Street, Northern Region, Uganda. 
                Full-service physical counter pickup, hardware inspections, and secure offline order collection.
              </p>
            </div>

            {/* Coordinates and Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-zinc-400">
                <MapPin size={12} className="text-[#F68B1E]" />
                <span>2.2328° N, 32.8932° E</span>
              </div>

              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=2.2328081,32.8932380"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-2 px-4 bg-[#F68B1E] hover:bg-[#e07b12] active:scale-95 text-white rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-[#F68B1E]/10"
              >
                <Navigation size={12} />
                <span>Get Directions</span>
              </a>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('triggerPwaPrompt'));
                }}
                className="flex items-center gap-2 py-2 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 active:scale-95 text-zinc-200 rounded-lg text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                id="footer-pwa-install-btn"
              >
                <Smartphone size={12} className="text-[#F68B1E]" />
                <span>Install App</span>
              </button>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="md:col-span-5 flex flex-col items-start md:items-end justify-between space-y-6 md:space-y-0 text-left md:text-right">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-xs uppercase tracking-wider">Quick Navigation</h3>
              <ul className="flex flex-wrap md:justify-end gap-x-6 gap-y-3.5 text-xs font-sans font-medium text-zinc-400">
                <li className="hover:text-[#F68B1E] transition-colors cursor-pointer" onClick={() => onCategorySelect(null)}>
                  Home
                </li>
                <li className="hover:text-[#F68B1E] transition-colors cursor-pointer" onClick={() => onCategorySelect('Phones & Tablets')}>
                  Phones
                </li>
                <li className="hover:text-[#F68B1E] transition-colors cursor-pointer" onClick={() => onCategorySelect('Computers & Laptops')}>
                  Laptops
                </li>
                <li className="hover:text-[#F68B1E] transition-colors cursor-pointer" onClick={() => onCategorySelect('Accessories')}>
                  Accessories
                </li>
                <li className="text-[#F68B1E] hover:text-[#e07b12] transition-colors cursor-pointer font-bold" onClick={onAdminPanelClick}>
                  Staff Portal
                </li>
              </ul>
            </div>

            {/* Back to top button */}
            <button 
              onClick={() => { onCategorySelect(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-zinc-200 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Home size={12} />
              <span>Back to Top</span>
            </button>
          </div>

        </div>

        {/* Bottom copyright information */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left text-[11px] text-zinc-600 font-sans tracking-wide">
          <p>
            &copy; {new Date().getFullYear()} Lira Phones & Electronics. Authorized hardware distributors, Uganda.
          </p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-500 transition-colors cursor-default">Privacy</span>
            <span className="hover:text-zinc-500 transition-colors cursor-default">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
