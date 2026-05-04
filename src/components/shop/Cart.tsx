import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, CreditCard, Receipt, CheckCircle, Download, ShoppingCart, Smartphone, ArrowRight, MapPin, Phone } from 'lucide-react';
import { CartItem, Order, PaymentMethod } from '../../types';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import Lottie from 'lottie-react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (method: PaymentMethod, district: string, deliveryFee: number, phone: string, address: string) => void;
  orderResult: Order | null;
  t: any;
}

const DISTRICTS = [
  { name: 'Lira', fee: 5000 },
  { name: 'Kampala', fee: 20000 },
  { name: 'Gulu', fee: 10000 },
  { name: 'Arua', fee: 15000 },
  { name: 'Mbarara', fee: 25000 },
  { name: 'Other', fee: 30000 },
];

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, orderResult, t }: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MTN Mobile Money');
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [deliveryFee, setDeliveryFee] = useState(DISTRICTS[0].fee);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = subtotal + deliveryFee;

  useEffect(() => {
    const d = DISTRICTS.find(d => d.name === district);
    if (d) setDeliveryFee(d.fee);
  }, [district]);

  const handleProcessCheckout = () => {
    if (!customerPhone || !customerAddress) {
      alert("Please provide phone number and delivery address.");
      return;
    }
    setCheckingOut(true);
    setTimeout(() => {
      onCheckout(paymentMethod, district, deliveryFee, customerPhone, customerAddress);
      setCheckingOut(false);
    }, 2000);
  };

  const paymentOptions: { id: PaymentMethod, name: string, icon: any, color: string }[] = [
    { id: 'MTN Mobile Money', name: 'MTN MoMo', icon: Smartphone, color: 'text-yellow-400' },
    { id: 'Airtel Money', name: 'Airtel Money', icon: Smartphone, color: 'text-red-500' },
    { id: 'Card', name: 'Visa/Mastercard', icon: CreditCard, color: 'text-white' },
    { id: 'Cash on Delivery', name: 'Cash on Delivery', icon: Smartphone, color: 'text-green-500' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-white/10 z-[70] flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Receipt className="text-blue-500" strokeWidth={3} />
                {orderResult ? 'Digital Receipt' : 'Your Basket'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {orderResult ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                  <div className="text-center p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                    <CheckCircle size={48} className="text-blue-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h3>
                    <p className="text-gray-400 text-sm">Thank you for shopping at Solo's. Your digital receipt is ready.</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <h1 className="text-4xl font-black italic tracking-tighter">SOLO'S</h1>
                    </div>
                    <div className="flex justify-between mb-4 border-b border-white/10 pb-4">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="text-blue-500 text-xs">{orderResult.receiptId}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Date</span>
                      <span className="text-white">{format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex justify-between mb-4 border-b border-white/10 pb-4">
                      <span className="text-gray-500">Payment</span>
                      <span className="text-white font-bold">{orderResult.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between mb-4 border-b border-white/10 pb-4">
                      <span className="text-gray-500">Status</span>
                      <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">{orderResult.status}</span>
                    </div>
                    
                    <div className="space-y-3 mb-6 border-b border-white/10 pb-4">
                      {orderResult.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-gray-300">{item.quantity}x {item.name}</span>
                          <span className="text-white">UGX {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 mb-6 text-xs border-b border-white/10 pb-4">
                       <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="text-white">UGX {orderResult.subtotal.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-gray-500">Delivery Fee ({orderResult.district})</span>
                          <span className="text-white">UGX {orderResult.deliveryFee.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="flex justify-between pt-2 text-lg font-bold">
                      <span className="text-white uppercase tracking-tighter">Total Amount</span>
                      <span className="text-blue-500">UGX {orderResult.total.toLocaleString()}</span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center">
                       Solos Engineering | TIN: 1014-XXXX-XX | Lira, Uganda
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Delivery Details</h4>
                    <p className="text-gray-200 text-sm font-bold flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> {orderResult.district}: {orderResult.deliveryAddress}</p>
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-2"><Phone size={14} /> {orderResult.customerPhone}</p>
                  </div>

                  <button 
                    onClick={() => window.print()}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-xl"
                  >
                    <Download size={20} />
                    Print Receipt
                  </button>
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inventory List</h3>
                    {items.map((item) => (
                      <motion.div
                        layout
                        key={item.id}
                        className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-white mb-1">{item.name}</h4>
                            <button onClick={() => onRemove(item.id)} className="text-gray-500 hover:text-red-500">
                               <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-blue-500 font-mono font-bold text-sm mb-3">
                            UGX {item.price.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-3">
                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded">
                              <Minus size={14} />
                            </button>
                            <span className="text-white font-bold">{item.quantity}</span>
                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded">
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Delivery Location Selection */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delivery Location</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {DISTRICTS.map((d) => (
                        <button
                          key={d.name}
                          onClick={() => setDistrict(d.name)}
                          className={cn(
                            "p-4 rounded-2xl border transition-all text-left",
                            district === d.name 
                              ? "bg-blue-600/20 border-blue-600" 
                              : "bg-white/5 border-white/10"
                          )}
                        >
                          <p className="text-xs font-bold text-white mb-1">{d.name}</p>
                          <p className="text-[10px] text-blue-500 font-black tracking-widest">UGX {d.fee.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                       <input 
                         type="tel"
                         placeholder="Active Phone (e.g. 077... / 070...)"
                         value={customerPhone}
                         onChange={(e) => setCustomerPhone(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                       />
                       <textarea 
                         placeholder="Specific Delivery Address / Landmarks"
                         value={customerAddress}
                         onChange={(e) => setCustomerAddress(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 no-scrollbar"
                       />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Strategy</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {paymentOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setPaymentMethod(option.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                            paymentMethod === option.id 
                              ? "bg-blue-600/20 border-blue-600 shadow-lg shadow-blue-900/10" 
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          )}
                        >
                          <div className="flex items-center gap-4">
                             <option.icon size={20} className={option.color} />
                             <span className="text-sm font-bold text-white">{option.name}</span>
                          </div>
                          {paymentMethod === option.id && <CheckCircle size={16} className="text-blue-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                   {/* Empty cart UI remains similar but visually updated */}
                   <ShoppingCart size={64} className="text-gray-700 mb-6" />
                   <h3 className="text-xl font-bold text-white mb-2">{t.basket_empty}</h3>
                   <p className="text-gray-500 text-sm">{t.tech_collection_starts}</p>
                </div>
              )}
            </div>

            {!orderResult && items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>UGX {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                    <span>Delivery ({district})</span>
                    <span className="text-blue-500">UGX {deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-white font-black uppercase text-sm tracking-widest">Grand Total</span>
                    <span className="text-2xl font-black text-white">UGX {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={handleProcessCheckout}
                  disabled={checkingOut}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 overflow-hidden relative"
                >
                  {checkingOut ? (
                    <motion.div 
                      key="loader"
                      initial={{ y: 20 }} animate={{ y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Initiating Gateway...
                    </motion.div>
                  ) : (
                    <motion.div key="text" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-3">
                      <CreditCard size={20} />
                      Verify & Pay
                      <ArrowRight size={18} className="ml-1" />
                    </motion.div>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-500 mt-4 font-bold tracking-widest uppercase">
                  Secure {paymentMethod} Integration via Solos.io
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
