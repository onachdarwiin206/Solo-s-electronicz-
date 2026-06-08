import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Github, MessageSquare, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip } from '../ui/Tooltip';

interface FooterProps {
  t: any;
  onCategorySelect: (category: string | null) => void;
  onAdminPanelClick: () => void;
}

export function Footer({ t, onCategorySelect, onAdminPanelClick }: FooterProps) {
  return (
    <footer className="relative z-10 bg-background/80 backdrop-blur-3xl border-t border-border pt-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          {/* Column 1: Info & Contact / Socials */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tighter text-blue-500 cursor-pointer" onClick={() => onCategorySelect(null)}>SOLO'S</h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs font-medium">
              Premium electronics platform designed by Solo. Serving you quality technology across Uganda.
            </p>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-2"><Phone size={14} className="text-blue-500" /> 0793405517</span>
              <span className="flex items-center gap-2"><MapPin size={14} className="text-blue-500 shrink-0" /> Fame City Building, 6/7 Lira - Gulu Rd, Lira</span>
            </div>
            <div className="flex gap-3 pt-1">
              {[
                { Icon: Facebook, name: 'Facebook' },
                { Icon: Instagram, name: 'Instagram' },
                { Icon: Twitter, name: 'X / Twitter' },
                { Icon: Github, name: 'GitHub' }
              ].map(({ Icon, name }, i) => (
                <Tooltip key={i} content={name}>
                  <a href="#" className="p-1.5 bg-foreground/5 text-foreground rounded-full hover:bg-blue-600 hover:text-white transition-all hover:scale-110 flex items-center justify-center border border-border">
                    <Icon size={14} />
                  </a>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-foreground font-black mb-4 text-xs uppercase tracking-widest font-mono">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-muted-foreground">
              <li className="hover:text-blue-500 transition-colors cursor-pointer font-bold" onClick={() => onCategorySelect(null)}>
                Home
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer" onClick={() => onCategorySelect('Phones')}>Phones</li>
              <li className="hover:text-foreground transition-colors cursor-pointer" onClick={() => onCategorySelect('Computers')}>Laptops</li>
              <li className="hover:text-foreground transition-colors cursor-pointer" onClick={() => onCategorySelect('Electronics')}>Smart Devices</li>
              <li className="hover:text-blue-500 transition-colors cursor-pointer font-bold" onClick={onAdminPanelClick}>Staff Portal</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} SOLO'S PHONES & ELECTRONICS. ALL RIGHTS RESERVED.
          </p>
          <button 
            onClick={() => { onCategorySelect(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Home size={14} />
            Return to Landing
          </button>
        </div>
      </div>
    </footer>
  );
}
