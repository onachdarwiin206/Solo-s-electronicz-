import { HelpCircle, Sparkles, Zap, ShieldAlert } from 'lucide-react';

export function WhyChooseSolo() {
  const reasons = [
    {
      num: "01",
      title: "STUDENT & BODA FRIENDLY PRICES",
      subtitle: "AFFORDABLE FOR EVERYONE",
      desc: "We understand that money is hard to earn. That's why we offer the lowest prices in Lira City, student discounts, and flexible payment options on phones, solar power banks, and subwoofers."
    },
    {
      num: "02",
      title: "SAME-DAY TECH REPAIRS",
      subtitle: "ZERO TIME WASTED",
      desc: "Our on-site engineers fix cracked screens, charging ports, and dead laptop batteries while you wait. We use certified parts so your phone or TV is back to work the very same day."
    },
    {
      num: "03",
      title: "REAL LOCAL WARRANTY & TRUST",
      subtitle: "WE ARE PHYSICAL, WE ARE REAL",
      desc: "Don't risk your money on street sellers. Solo's is a fully registered physical shop in Lira City Center. Every single phone and laptop comes with a stamped 1-year warranty receipt."
    }
  ];

  return (
    <section className="my-16 font-mono text-left">
      {/* Header border banner */}
      <div className="border-2 border-brand-blue bg-black/60 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-brand-green text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
            <HelpCircle size={12} className="text-brand-green" />
            LIRA LOCAL ADVANTAGE // CORE-SPEC
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 uppercase tracking-tight">
            WHY BUY FROM SOLO'S ELECTRONICS?
          </h2>
        </div>
        <div className="text-[10px] text-zinc-400 bg-brand-blue/10 border border-brand-blue/30 px-3 py-1.5 uppercase font-bold">
          [ DEPLOYED IN NORTHERN UGANDA // PHYSICAL HUBS ]
        </div>
      </div>

      {/* Grid of Reasons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reasons.map((item, idx) => (
          <div 
            key={idx}
            className="border-2 border-brand-blue bg-zinc-950/80 p-6 relative flex flex-col justify-between hover:bg-brand-blue/10 transition-colors duration-150"
          >
            {/* Background Number Decal */}
            <div className="absolute top-2 right-4 text-brand-green/10 text-5xl font-black select-none pointer-events-none">
              {item.num}
            </div>

            <div>
              <div className="flex items-center gap-2 text-[10px] text-brand-green font-bold tracking-widest uppercase mb-1">
                <span>[ {item.subtitle} ]</span>
              </div>
              <h3 className="text-[14px] font-black text-white uppercase tracking-tight mb-4 border-b border-brand-blue/20 pb-2">
                {item.num}. {item.title}
              </h3>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans font-normal">
                {item.desc}
              </p>
            </div>

            {/* Spec details bottom bar */}
            <div className="mt-6 pt-3 border-t border-brand-blue/20 flex justify-between items-center text-[9px] text-zinc-500 uppercase">
              <span>PILLAR_ID: SL-0{idx + 1}</span>
              <span className="text-brand-green font-bold">[ VERIFIED ]</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
