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
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          {/* Column 2: Quick Links */}
          <div className="max-w-md">
            <h3 className="text-foreground font-black mb-4 text-xs uppercase tracking-widest font-mono">Quick Links</h3>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-xs text-muted-foreground">
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
