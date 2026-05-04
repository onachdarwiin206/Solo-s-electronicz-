import { useState } from 'react';
import { motion } from 'motion/react';
import { Truck, Search, Package, MapPin, Calendar, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
import { Order } from '../../types';

export function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    const path = `orders/${orderId.trim()}`;
    try {
      const docRef = doc(db, 'orders', orderId.trim());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTrackingData({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        setError("Order not found. Please verify the ID.");
        setTrackingData(null);
      }
    } catch (e: any) {
      if (e.message?.includes('offline') || e.code === 'unavailable') {
        setError("System is synchronizing connection... Please wait 5 seconds and try again.");
      } else {
        handleFirestoreError(e, OperationType.GET, path);
        setError("An error occurred while tracking your order.");
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { name: 'Pending', status: 'completed' },
    { name: 'Processing', status: 'current' },
    { name: 'Shipped', status: 'upcoming' },
    { name: 'Delivered', status: 'upcoming' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }))}
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Return to Shop
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl"
      >
        <div className="text-center mb-12">
          <Truck className="text-blue-500 mx-auto mb-6" size={48} />
          <h2 className="text-4xl font-black tracking-tighter mb-4">TRACK YOUR GEAR</h2>
          <p className="text-gray-400">Enter your order ID to see exactly where your tech is in the system.</p>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Order ID (e.g. SOLO-ORD-1234)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            />
          </div>
          <button
            onClick={handleTrack}
            disabled={!orderId || loading}
            className="px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all"
          >
            {loading ? 'Scanning...' : 'Track'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center mb-8 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
            {error}
          </p>
        )}

        {trackingData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Tracking Progress */}
            <div className="relative">
              <div className="absolute top-5 left-0 w-full h-0.5 bg-white/10" />
              <div className="relative flex justify-between">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-black transition-colors duration-500",
                      step.status === 'completed' ? "bg-blue-500" : step.status === 'current' ? "bg-blue-500/20 border-blue-500" : "bg-gray-800"
                    )}>
                      {step.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-gray-500" />}
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-widest",
                      step.status === 'upcoming' ? "text-gray-600" : "text-white"
                    )}>
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-4">
                <MapPin className="text-blue-500 shrink-0" size={24} />
                <div>
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Destination</h4>
                   <p className="text-sm font-medium text-gray-200">{trackingData.deliveryAddress}</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-4">
                <Package className="text-blue-500 shrink-0" size={24} />
                <div>
                   <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Order Details</h4>
                   <p className="text-sm font-bold text-blue-400 capitalize">{trackingData.status}</p>
                   <p className="text-[10px] text-gray-500 mt-1 uppercase font-mono tracking-tighter">Paid UGX {trackingData.total.toLocaleString()} via {trackingData.paymentMethod || 'Wallet'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
