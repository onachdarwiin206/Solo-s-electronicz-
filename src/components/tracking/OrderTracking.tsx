import { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Search, MapPin, CheckCircle2, ArrowLeft, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Order, OrderStatus } from '../../types';

export function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    
    // Simulated delay
    await new Promise(r => setTimeout(r, 1000));
    
    setError("Logistics Database is currently in offline mode (Local). Please use your WhatsApp confirmation receipt for tracking details.");
    setLoading(false);
  };

  const statusList: OrderStatus[] = ['pending', 'confirmed', 'delivering', 'delivered'];
  
  const currentStepIndex = trackingData ? statusList.indexOf(trackingData.status) : -1;

  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <button onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }))} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-black uppercase tracking-widest group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Return to Shop
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 p-12 overflow-hidden pointer-events-none">
           <Truck size={120} />
        </div>
        
        <div className="text-center mb-12">
          <Truck className="text-blue-500 mx-auto mb-6" size={48} />
          <h2 className="text-4xl font-black tracking-tighter mb-4 italic uppercase">Real-Time Logistics</h2>
          <p className="text-gray-400 text-sm">Tracking is temporarily handled directly via WhatsApp for verified hardware orders.</p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input type="text" placeholder="SOLO-ORD-XXXXXX" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 transition-all font-mono text-sm" />
          </div>
          <button onClick={handleTrack} disabled={!orderId || loading} className="px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs">{loading ? 'Scanning...' : 'Track'}</button>
        </div>

        {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mb-8 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>}

        {trackingData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 text-center text-gray-500 font-bold uppercase text-[10px]">
             Local View Ready
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
