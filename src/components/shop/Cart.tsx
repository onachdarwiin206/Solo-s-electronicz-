import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, MapPin, MessageCircle } from 'lucide-react';
import { CartItem, PaymentMethod } from '../../types';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (method: PaymentMethod, district: string, deliveryFee: number, phone: string, address: string, customerName: string) => void;
  orderResult: any; // Simplified for MVP
  t: any;
}

const DISTRICTS = [
  { name: 'Lira City', fee: 0 },
  { name: 'Lira Outer', fee: 5000 },
  { name: 'Gulu', fee: 10000 },
  { name: 'Kampala', fee: 20000 },
  { name: 'Other', fee: 15000 },
];

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, t }: CartProps) {
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [deliveryFee, setDeliveryFee] = useState(DISTRICTS[0].fee);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = subtotal + deliveryFee;

  useEffect(() => {
    const d = DISTRICTS.find(d => d.name === district);
    if (d) setDeliveryFee(d.fee);
  }, [district]);

  const handleWhatsAppCheckout = () => {
    if (!customerName || !customerPhone || !customerAddress) {
      alert("Please enter all details to continue.");
      return;
    }
    setIsProcessing(true);
    // Simulate a brief generation delay for UX
    setTimeout(() => {
      onCheckout('cod', district, deliveryFee, customerPhone, customerAddress, customerName);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-white/10 z-[110] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <ShoppingCart className="text-blue-500" />
                Engineering Basket
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8">
              {items.length > 0 ? (
                <>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hardware Selection</h3>
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-sm leading-tight">{item.name}</h4>
                            <button onClick={() => onRemove(item.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-blue-500 font-mono text-xs font-bold">UGX {(item.price * item.quantity).toLocaleString()}</p>
                            <div className="flex items-center gap-3">
                              <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 text-white"><Minus size={12} /></button>
                              <span className="text-white text-xs font-black">{item.quantity}</span>
                              <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 text-white"><Plus size={12} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Zone & Logistics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {DISTRICTS.map((d) => (
                        <button key={d.name} onClick={() => setDistrict(d.name)} className={cn("p-3 rounded-xl border text-left transition-all", district === d.name ? "bg-blue-600/20 border-blue-500" : "bg-white/5 border-white/10")}>
                          <p className="text-[10px] font-bold text-white">{d.name}</p>
                          <p className="text-[8px] text-blue-500 font-black tracking-widest">UGX {d.fee.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <input type="text" placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                      <input type="tel" placeholder="Active Mobile Number (WhatsApp preferred)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                      <textarea placeholder="Specific landmarks, street, or house number" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 h-24 no-scrollbar" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingCart size={48} className="text-white/10 mb-4" />
                  <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Your basket is currently empty.</p>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/80 backdrop-blur-md">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest"><span className="text-gray-500">Subtotal</span><span className="text-white">UGX {subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest"><span className="text-gray-500">Logistics</span><span className="text-blue-500">UGX {deliveryFee.toLocaleString()}</span></div>
                  <div className="flex justify-between pt-2 border-t border-white/5"><span className="text-sm font-black text-white italic uppercase">Total Estimate</span><span className="text-xl font-black text-white">UGX {grandTotal.toLocaleString()}</span></div>
                </div>
                <button 
                  onClick={handleWhatsAppCheckout}
                  disabled={isProcessing}
                  className="w-full py-5 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-900/10 active:scale-95 disabled:opacity-50"
                >
                  <MessageCircle size={20} fill="currentColor" />
                  {isProcessing ? 'Generating Summary...' : 'Place Order via WhatsApp'}
                  <ArrowRight size={16} />
                </button>
                <p className="text-[8px] text-center text-gray-500 mt-4 font-black uppercase tracking-widest">
                  Secure WhatsApp Peer-to-Peer Transaction
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
