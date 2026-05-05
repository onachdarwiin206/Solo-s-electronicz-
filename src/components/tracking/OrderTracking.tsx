import { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Search, MapPin, CheckCircle2, Circle, ArrowLeft, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
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
    try {
      const docRef = doc(db, 'orders', orderId.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrackingData({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        setError("Order ID not found. Verify with your WhatsApp receipt.");
        setTrackingData(null);
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.GET, `orders/${orderId}`);
      setError("An error occurred. Check your connection.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-400 text-sm">Enter the tracking code from your WhatsApp confirmation.</p>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="relative">
              <div className="absolute top-5 left-0 w-full h-0.5 bg-white/5" />
              <div className="relative flex justify-between">
                {statusList.map((status, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={status} className="flex flex-col items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-black transition-all", isCompleted ? "bg-blue-500" : "bg-gray-900 border-white/5")}>
                        {isCompleted ? <CheckCircle2 size={18} /> : <div className="w-2 h-2 rounded-full bg-gray-700" />}
                      </div>
                      <span className={cn("text-[9px] uppercase font-black tracking-widest", isCurrent ? "text-blue-500" : isCompleted ? "text-white" : "text-gray-700")}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
                <MapPin className="text-blue-500 mt-1" size={18} />
                <div>
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Shipping Target</h4>
                   <p className="text-xs font-bold text-gray-200">{trackingData.deliveryAddress}</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
                <Clock className="text-blue-500 mt-1" size={18} />
                <div>
                   <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status Report</h4>
                   <p className="text-xs font-bold text-blue-400 uppercase italic">{trackingData.status}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
