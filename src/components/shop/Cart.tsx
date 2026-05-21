import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, MessageCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { CartItem, PaymentMethod } from '../../types';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { OptimizedImage } from '../ui/OptimizedImage';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (method: PaymentMethod, district: string, deliveryFee: number, phone: string, address: string, customerName: string) => Promise<string | undefined>;
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

const CARRIERS = [
  { id: 'mtn', name: 'MTN MoMo', color: 'bg-yellow-400 text-black border-yellow-500' },
  { id: 'airtel', name: 'Airtel Money', color: 'bg-red-600 text-white border-red-700' },
];

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, t }: CartProps) {
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [deliveryFee, setDeliveryFee] = useState(DISTRICTS[0].fee);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [carrier, setCarrier] = useState(CARRIERS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = subtotal + deliveryFee;

  useEffect(() => {
    const d = DISTRICTS.find(d => d.name === district);
    if (d) setDeliveryFee(d.fee);
  }, [district]);

  const validate = () => {
    if (!customerName || !customerPhone || !customerAddress) {
      alert("Please enter all details to continue.");
      return false;
    }
    return true;
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (!validate()) return;
    setIsProcessing(true);
    
    try {
      const orderId = await onCheckout(method, district, deliveryFee, customerPhone, customerAddress, customerName);
      if (orderId) {
        setLastOrderId(orderId);
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMomoSubmit = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    // Simulate MoMo prompt
    setTimeout(async () => {
      const orderId = await onCheckout('mobile_money', district, deliveryFee, customerPhone, customerAddress, customerName);
      if (orderId) {
        setLastOrderId(orderId);
        setIsSuccess(true);
      }
      setIsProcessing(false);
    }, 2000);
  };

  const handleWhatsAppCheckout = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      const orderId = await onCheckout('cod', district, deliveryFee, customerPhone, customerAddress, customerName);
      if (orderId) {
        setLastOrderId(orderId);
        setIsSuccess(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-neutral-900 border-l border-white/10 z-[110] flex flex-col items-center justify-center p-12 text-center shadow-2xl">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-8 border border-green-500/30">
                <ShieldCheck className="text-green-500" size={48} />
              </div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Transmission Successful</h2>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-loose mb-8">
                Order <span className="text-blue-500">#{lastOrderId}</span> has been logged into the system. Our logistics team will contact you shortly.
              </p>
              <button 
                onClick={() => { setIsSuccess(false); onClose(); }}
                className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-xs"
              >
                Close Gateway
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background border-l border-border z-[110] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
              <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter flex items-center gap-2">
                <ShoppingCart className="text-blue-500" />
                Engineering Basket
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-full text-foreground"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8">
              {items.length > 0 ? (
                <>
                  {/* Hardware Selection */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hardware Selection</h3>
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: -100, height: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="flex gap-4 p-4 bg-foreground/5 rounded-2xl border border-border overflow-hidden"
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                              <OptimizedImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-foreground text-sm leading-tight">{item.name}</h4>
                                <Tooltip content="Eliminate Item" position="left">
                                  <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </Tooltip>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-blue-500 font-mono text-xs font-bold">UGX {(item.price * item.quantity).toLocaleString()}</p>
                                <div className="flex items-center gap-3 bg-foreground/5 rounded-lg p-1">
                                  <button 
                                    onClick={() => onUpdateQuantity(item.id, -1)} 
                                    className="p-1 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all rounded-md"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="text-foreground text-xs font-black w-4 text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => onUpdateQuantity(item.id, 1)} 
                                    className="p-1 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all rounded-md"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Payment Protocol */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payment Protocol</h3>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => setPaymentMethod('cod')} className={cn("p-4 rounded-2xl border text-left transition-all", paymentMethod === 'cod' ? "bg-blue-600/20 border-blue-500" : "bg-foreground/5 border-border")}>
                          <p className="text-[10px] font-bold text-foreground uppercase">Cash on Delivery</p>
                          <p className="text-[8px] text-muted-foreground mt-1 uppercase">Pay at your door</p>
                       </button>
                       <button onClick={() => setPaymentMethod('mobile_money')} className={cn("p-4 rounded-2xl border text-left transition-all", paymentMethod === 'mobile_money' ? "bg-yellow-500/20 border-yellow-500" : "bg-foreground/5 border-border")}>
                          <p className="text-[10px] font-bold text-foreground uppercase">Mobile Money</p>
                          <p className="text-[8px] text-yellow-500 mt-1 uppercase tracking-widest font-black">MTN / Airtel</p>
                       </button>
                    </div>

                    <AnimatePresence>
                      {paymentMethod === 'mobile_money' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                           <div className="p-4 bg-foreground/5 rounded-2xl border border-border space-y-4">
                              <div className="flex gap-2">
                                 {CARRIERS.map(c => (
                                   <button key={c.id} onClick={() => setCarrier(c.id)} className={cn("flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all", carrier === c.id ? c.color : "bg-foreground/10 border-border text-muted-foreground")}>
                                      {c.name}
                                   </button>
                                 ))}
                              </div>
                              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                                 <p className="text-[9px] text-blue-400 font-bold uppercase leading-relaxed">
                                    You will receive a numeric prompt on your phone <br/> to authorize <span className="text-white">UGX {grandTotal.toLocaleString()}</span>
                                 </p>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Logistics */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Logistics & Zone</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {DISTRICTS.map((d) => (
                        <button key={d.name} onClick={() => setDistrict(d.name)} className={cn("p-4 rounded-2xl border text-left transition-all", district === d.name ? "bg-blue-600/20 border-blue-500" : "bg-foreground/5 border-border")}>
                          <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">{d.name}</p>
                          <p className="text-[8px] text-blue-500 font-black tracking-widest mt-1">UGX {d.fee.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-3 pt-4">
                      <div className="relative group">
                         <input type="text" placeholder="Full Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-foreground text-sm outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div className="relative group">
                         <input type="tel" placeholder="Mobile Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-foreground text-sm outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      <div className="relative group">
                         <textarea placeholder="Delivery Address / Landmarks" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-foreground text-sm outline-none focus:border-blue-500 transition-colors h-24 no-scrollbar resize-none" />
                      </div>
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
              <div className="p-6 border-t border-border bg-background/80 backdrop-blur-md">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground font-mono">UGX {subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]"><span className="text-muted-foreground">Logistics</span><span className="text-blue-500 font-mono">UGX {deliveryFee.toLocaleString()}</span></div>
                  <div className="flex justify-between pt-3 mt-3 border-t border-border"><span className="text-sm font-black text-foreground italic uppercase tracking-tighter">Total Estimate</span><span className="text-xl font-black text-foreground font-mono tracking-tighter">UGX {grandTotal.toLocaleString()}</span></div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {paymentMethod === 'mobile_money' ? (
                    <button 
                      onClick={handleMomoSubmit}
                      disabled={isProcessing}
                      className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-900/40 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                      {isProcessing ? <Loader2 className="animate-spin text-black" size={20} /> : (
                        <>
                          <ShieldCheck size={20} strokeWidth={3} />
                          Authorize MoMo Payment
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCheckout('cod')}
                      disabled={isProcessing}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          <ShieldCheck size={20} />
                          Sync Direct Order
                        </>
                      )}
                    </button>
                  )}

                  <button 
                    onClick={handleWhatsAppCheckout}
                    disabled={isProcessing}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-green-500 font-black rounded-2xl flex items-center justify-center gap-3 transition-all border border-green-500/30 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    <MessageCircle size={20} fill="currentColor" />
                    Place via WhatsApp
                  </button>
                </div>

                <p className="text-[8px] text-center text-gray-600 mt-6 font-black uppercase tracking-widest opacity-50">
                  Global Identification & Logistics Protcol V4
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
