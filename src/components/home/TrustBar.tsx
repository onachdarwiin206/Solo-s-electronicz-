import { ShieldCheck, BadgeCheck, Store, Wrench, Coins } from 'lucide-react';

export function TrustBar() {
  const pillars = [
    {
      icon: <ShieldCheck size={20} className="text-brand-green" />,
      label: "1-YEAR WARRANTY",
      desc: "Full coverage & parts backup on all gadgets"
    },
    {
      icon: <BadgeCheck size={20} className="text-brand-green" />,
      label: "100% GENUINE STOCK",
      desc: "Direct import from certified manufacturers"
    },
    {
      icon: <Store size={20} className="text-brand-green" />,
      label: "LOCAL LIRA CITY SHOP",
      desc: "Visit us at Lira City Center, walk-in today"
    },
    {
      icon: <Wrench size={20} className="text-brand-green" />,
      label: "EXPRESS TECH REPAIR",
      desc: "Expert repairs & screen fixes done on-site"
    },
    {
      icon: <Coins size={20} className="text-brand-green" />,
      label: "FAIR UGX PRICING",
      desc: "No hidden fees, best local rates guaranteed"
    }
  ];

  return (
    <div className="w-full bg-black/90 border-2 border-brand-blue text-foreground font-mono select-none my-8">
      {/* Decorative top ribbon */}
      <div className="bg-brand-blue text-black font-black text-[9px] tracking-[0.2em] px-4 py-1.5 flex justify-between items-center border-b-2 border-brand-blue uppercase">
        <span>[ SOLO'S ELECTRONICS // TRUST VERIFICATION PANEL ]</span>
        <span className="animate-pulse text-brand-green font-mono">● LIVE CONNECTION</span>
      </div>

      {/* Main Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 divide-y-2 md:divide-y-0 md:divide-x-2 divide-brand-blue">
        {pillars.map((item, idx) => (
          <div 
            key={idx} 
            className="p-5 flex flex-col justify-start items-start text-left hover:bg-brand-blue/10 transition-colors duration-150 relative group"
          >
            {/* Index label in top-right */}
            <span className="absolute top-2 right-3 text-[9px] text-zinc-500 font-bold">
              [0{idx + 1}]
            </span>

            {/* Icon */}
            <div className="mb-3 p-1 bg-brand-blue/10 border border-brand-blue/30 inline-block">
              {item.icon}
            </div>

            {/* Title / Label */}
            <h4 className="text-[12px] font-black text-brand-green tracking-wider uppercase mb-1">
              {item.label}
            </h4>

            {/* Subtext description */}
            <p className="text-[10px] text-zinc-400 leading-normal font-sans">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
