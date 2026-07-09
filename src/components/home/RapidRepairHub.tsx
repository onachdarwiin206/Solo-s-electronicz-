import { Wrench, Smartphone, Laptop, Tv, BatteryCharging, ShieldAlert } from 'lucide-react';

export function RapidRepairHub() {
  const services = [
    {
      icon: <Smartphone size={18} className="text-brand-green" />,
      name: "PHONE SCREEN REPLACEMENT",
      estTime: "30-45 MINS ON-SITE",
      estPrice: "From UGX 45,000",
      target: "Boda riders & students"
    },
    {
      icon: <BatteryCharging size={18} className="text-brand-green" />,
      name: "BATTERY SWAP & BATTERY BOOST",
      estTime: "15-20 MINS ON-SITE",
      estPrice: "From UGX 20,000",
      target: "All devices & phones"
    },
    {
      icon: <Wrench size={18} className="text-brand-green" />,
      name: "CHARGING PORT & SPEAKER FIX",
      estTime: "20-30 MINS ON-SITE",
      estPrice: "From UGX 15,000",
      target: "Immediate soldering"
    },
    {
      icon: <Laptop size={18} className="text-brand-green" />,
      name: "LAPTOP DIAGNOSTIC & WINDOWS INSTALL",
      estTime: "Same-Day service",
      estPrice: "From UGX 30,000",
      target: "Students & businesses"
    }
  ];

  const handleBookRepair = (serviceName: string) => {
    const text = encodeURIComponent(`Hello Solo's Electronics! I want to book a same-day repair for my device. Service: ${serviceName}. Please give me a quick estimate.`);
    window.open(`https://wa.me/256793405517?text=${text}`, '_blank');
  };

  return (
    <section className="my-16 font-mono text-left border-2 border-brand-blue bg-black/85 relative overflow-hidden">
      {/* Decorative Blueprint Lines */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#0047AB 1px, transparent 1px), linear-gradient(90deg, #0047AB 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Title Header */}
      <div className="bg-brand-blue text-black p-4 font-black flex justify-between items-center flex-wrap gap-2 border-b-2 border-brand-blue">
        <span className="text-[11px] tracking-[0.2em] uppercase flex items-center gap-2">
          <Wrench size={14} />
          [ ON-SITE REPAIR STATION // LIVE WORKBENCH ]
        </span>
        <span className="text-[9px] bg-black text-brand-green px-2 py-0.5 font-bold">
          EXPERT ENGINEERS ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y-2 lg:divide-y-0 lg:divide-x-2 divide-brand-blue">
        {/* Left Column - Promotion Info */}
        <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-brand-green text-[10px] font-bold tracking-widest block">[ SAME-DAY TECH RESCUE ]</span>
            <h3 className="text-2xl font-black text-white leading-tight uppercase">
              DON'T THROW IT AWAY. WE FIX IT TODAY!
            </h3>
            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
              Cracked screen? Battery draining fast? Solo's experienced hardware engineers fix all phone brands (Infinix, Tecno, Samsung, iPhone) and laptops right here in Lira City. No long waits, no fake replacement parts.
            </p>
          </div>

          <div className="border border-dashed border-brand-blue/40 p-4 bg-brand-blue/5">
            <div className="flex items-start gap-2.5 text-brand-green text-[9px] font-bold uppercase mb-1">
              <ShieldAlert size={14} className="shrink-0" />
              <span>THE SOLO'S WARRANTY</span>
            </div>
            <p className="text-[9px] text-zinc-400 font-sans leading-normal">
              All screen and battery repairs are backed by our local 30-day warranty. If it fails due to our parts, we fix it again for free!
            </p>
          </div>
        </div>

        {/* Right Column - Repair Rates Grid */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-zinc-500 text-[10px] font-bold tracking-wider block">// ACTIVE ON-SITE SERVICE RATE CARD</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((svc, i) => (
                <div 
                  key={i} 
                  className="border border-brand-blue/30 bg-zinc-950 p-4 flex flex-col justify-between hover:border-brand-green/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-brand-blue/15 border border-brand-blue/30">
                        {svc.icon}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold">[ {svc.target} ]</span>
                    </div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">{svc.name}</h4>
                  </div>

                  <div className="mt-4 pt-2 border-t border-brand-blue/15 flex justify-between items-baseline">
                    <div className="text-[9px] font-bold text-brand-green">{svc.estTime}</div>
                    <div className="text-xs font-black text-white">{svc.estPrice}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-brand-blue flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">WANT A CUSTOM ESTIMATE?</div>
              <div className="text-[11px] text-zinc-300 font-sans mt-0.5">Bring your device to Lira City Center or request a price estimate on WhatsApp.</div>
            </div>
            <button
              onClick={() => handleBookRepair("General Custom Repair")}
              className="bg-brand-green text-black hover:bg-white border-2 border-brand-green font-black tracking-wider px-6 py-3.5 uppercase text-[10px] cursor-pointer shrink-0 transition-colors duration-150 flex items-center gap-2"
            >
              <Wrench size={12} />
              Book Repair via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
