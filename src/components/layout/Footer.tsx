import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Github } from 'lucide-react';
import { motion } from 'motion/react';

export function Footer() {
  return (
    <footer className="relative z-10 bg-black/80 backdrop-blur-3xl border-t border-white/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-black tracking-tighter text-blue-500">SOLO'S</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-light">
              Premium electronics platform designed for those who demand excellence in technology. Built with passion by Solo.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Github].map((Icon, i) => (
                <a key={i} href="#" className="p-2 bg-white/5 rounded-full hover:bg-blue-600 transition-all hover:scale-110">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Connect</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <Mail size={16} /> tech@solos.io
              </li>
              <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <MapPin size={16} /> Silicon Valley, CA
              </li>
              <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer">
                <Phone size={16} /> +1 (555) 000-SOLO
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Shop</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">Latest Phones</li>
              <li className="hover:text-white transition-colors cursor-pointer">Workstations</li>
              <li className="hover:text-white transition-colors cursor-pointer">Smart Devices</li>
              <li className="hover:text-white transition-colors cursor-pointer">Staff Portal</li>
              <li className="hover:text-amber-500 transition-colors cursor-pointer text-[10px] opacity-30">Admin Systems v2.4</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Newsletter</h3>
            <p className="text-gray-500 text-xs mb-4 font-mono leading-relaxed">Join the digital elite for exclusive hardware alerts.</p>
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 overflow-hidden">
               <input 
                type="email" 
                placeholder="email@tech.com"
                className="bg-transparent border-none outline-none text-white text-xs px-4 flex-1 font-mono min-w-0"
               />
               <button className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all">
                 JOIN
               </button>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-500 font-mono">
            &copy; {new Date().getFullYear()} SOLO'S PHONES & ELECTRONICS. ALL SYSTEMS NOMINAL.
          </p>
          <div className="flex gap-8 text-[10px] items-center font-bold text-gray-500 tracking-widest uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Server Active</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
