import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Github, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip } from '../ui/Tooltip';

interface FooterProps {
  t: any;
  onCategorySelect: (category: string | null) => void;
  onAdminPanelClick: () => void;
}

export function Footer({ t, onCategorySelect, onAdminPanelClick }: FooterProps) {
  return (
    <footer className="relative z-10 bg-background/80 backdrop-blur-3xl border-t border-border pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tighter text-blue-500 cursor-pointer" onClick={() => onCategorySelect(null)}>SOLO'S</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-light">
              Premium electronics platform designed for those who demand excellence in technology. Built with passion by Solo.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Facebook, name: 'Facebook' },
                { Icon: Instagram, name: 'Instagram' },
                { Icon: Twitter, name: 'X / Twitter' },
                { Icon: Github, name: 'GitHub' }
              ].map(({ Icon, name }, i) => (
                <Tooltip key={i} content={name}>
                  <a href="#" className="p-2 bg-foreground/5 text-foreground rounded-full hover:bg-blue-600 hover:text-white transition-all hover:scale-110 flex items-center justify-center border border-border">
                    <Icon size={18} />
                  </a>
                </Tooltip>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-foreground font-bold mb-6 text-sm uppercase tracking-widest">Connect</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-3 hover:text-foreground transition-colors cursor-pointer underline decoration-blue-500/30 underline-offset-4">
                <Mail size={16} /> onachdarwiin@gmail.com
              </li>
              <li className="flex items-center gap-3 hover:text-foreground transition-colors cursor-pointer text-[11px]">
                <MapPin size={16} className="shrink-0" /> Fame City Building, 6/7 Lira - Gulu Rd, Lira
              </li>
              <li className="flex items-center gap-3 hover:text-foreground transition-colors cursor-pointer">
                <Phone size={16} /> 0793405517
              </li>
              <li className="flex items-center gap-3 hover:text-foreground transition-colors cursor-pointer">
                <MessageSquare size={16} /> WhatsApp: 0793405517
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-bold mb-6 text-sm uppercase tracking-widest">Shop</h3>
            <ul className="space-y-4 text-sm text-muted-foreground font-mono">
              <li className="hover:text-blue-500 transition-colors cursor-pointer font-bold flex items-center gap-2" onClick={() => onCategorySelect(null)}>
                <span>&laquo;</span> Return Home
              </li>
              <li className="hover:text-foreground transition-colors cursor-pointer" onClick={() => onCategorySelect('Phones')}>Latest Phones</li>
              <li className="hover:text-foreground transition-colors cursor-pointer" onClick={() => onCategorySelect('Computers')}>Workstations</li>
              <li className="hover:text-foreground transition-colors cursor-pointer" onClick={() => onCategorySelect('Electronics')}>Smart Devices</li>
              <li className="hover:text-blue-500 transition-colors cursor-pointer font-black" onClick={onAdminPanelClick}>Staff Portal</li>
              <li className="hover:text-amber-500 transition-colors cursor-pointer text-[10px] opacity-30">Admin Systems v2.4</li>
            </ul>
          </div>

          <div>
            <h3 className="text-foreground font-bold mb-6 text-sm uppercase tracking-widest">Newsletter</h3>
            <p className="text-muted-foreground text-xs mb-4 font-mono leading-relaxed">{t.newsletter_desc}</p>
            <div className="flex bg-foreground/5 border border-border rounded-2xl p-1 overflow-hidden focus-within:border-blue-500/50 transition-colors">
               <input 
                type="email" 
                placeholder="email@tech.com"
                className="bg-transparent border-none outline-none text-foreground text-xs px-4 flex-1 font-mono min-w-0"
               />
               <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all">
                 {t.join_newsletter}
               </button>
            </div>
          </div>
        </div>


        <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} SOLO'S PHONES & ELECTRONICS. ALL SYSTEMS NOMINAL.
          </p>
          <div className="flex gap-8 text-[10px] items-center font-bold text-muted-foreground tracking-widest uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Server Active</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
