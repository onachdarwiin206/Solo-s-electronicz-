import { motion } from 'motion/react';
import { Cpu, Shield, Zap, Globe, Smartphone, Headphones, Watch, Camera, HardDrive, Wifi } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';

const FEATURES = [
  { icon: Cpu, text: 'Custom Silicon' },
  { icon: Shield, text: 'Privacy First' },
  { icon: Zap, text: 'Hyper Charged' },
  { icon: Globe, text: 'Global Sourcing' },
  { icon: Smartphone, text: 'iOS & Android' },
  { icon: Headphones, text: 'Audio Precision' },
  { icon: Watch, text: 'Sync Ready' },
  { icon: Camera, text: 'Optics HD' },
  { icon: HardDrive, text: 'NVMe Storage' },
  { icon: Wifi, text: '6G Band' },
];

export function AuthFeatureWall() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 p-12 flex flex-col justify-center border-l border-white/10">
      {/* Decorative background scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_49%,rgba(59,130,246,0.05)_50%,transparent_51%)] bg-[length:100%_4px] pointer-events-none" />
      
      <div className="relative z-10 space-y-12">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">System Capability</span>
          <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic">Solo Force</h3>
        </div>

        <div className="h-[300px] relative overflow-hidden mask-fade">
          <motion.div 
            animate={{ y: [0, -600] }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="space-y-6 pt-4"
          >
            {[...FEATURES, ...FEATURES].map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                  <feature.icon size={20} className="text-gray-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                  {feature.text}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="pt-6">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
             <div className="flex -space-x-3 mb-4">
                {[1,2,3,4].map(n => (
                  <div key={n} className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center overflow-hidden">
                    <OptimizedImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${n}`} alt="User" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-blue-600 flex items-center justify-center text-[8px] font-black">
                  +12k
                </div>
             </div>
             <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-wider">
               Join thousands of tech enthusiasts verifying their hardware identities globally.
             </p>
          </div>
        </div>
      </div>

      <style>{`
        .mask-fade {
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
}
