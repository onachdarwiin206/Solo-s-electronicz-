import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, CreditCard, Receipt, CheckCircle, Download, ShoppingCart, Smartphone, ArrowRight } from 'lucide-react';
import { CartItem, Order, PaymentMethod } from '../../types';
import { format } from 'date-fns';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import Lottie from 'lottie-react';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: (method: PaymentMethod) => void;
  orderResult: Order | null;
  t: any;
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, orderResult, t }: CartProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [checkingOut, setCheckingOut] = useState(false);
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Simple fun animation for empty cart
  const emptyCartAnimation = {
    animationData: {
      "v": "5.7.4",
      "fr": 30,
      "ip": 0,
      "op": 60,
      "w": 100,
      "h": 100,
      "nm": "Empty Cart",
      "layers": [
        {
          "ddd": 0,
          "ind": 1,
          "ty": 4,
          "nm": "Cart",
          "ks": {
            "o": { "k": 100 },
            "r": { "k": [{ "t": 0, "s": [0] }, { "t": 30, "s": [10] }, { "t": 60, "s": [0] }] },
            "p": { "k": [{ "t": 0, "s": [50, 50] }, { "t": 30, "s": [50, 40] }, { "t": 60, "s": [50, 50] }] }
          }
        }
      ]
    }
  };

  const handleProcessCheckout = () => {
    setCheckingOut(true);
    setTimeout(() => {
      onCheckout(paymentMethod);
      setCheckingOut(false);
    }, 2000);
  };

  const paymentOptions: { id: PaymentMethod, name: string, icon: any, color: string }[] = [
    { id: 'Card', name: 'Visa/Mastercard', icon: CreditCard, color: 'text-white' },
    { id: 'Airtel Money', name: 'Airtel Money', icon: Smartphone, color: 'text-red-500' },
    { id: 'MTN Mobile Money', name: 'MTN MoMo', icon: Smartphone, color: 'text-yellow-400' },
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

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm shadow-2xl">
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
                      <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">Paid | Processing</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {orderResult.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span className="text-gray-300">{item.quantity}x {item.name}</span>
                          <span className="text-white">UGX {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-white/10 text-lg font-bold">
                      <span className="text-white uppercase tracking-tighter">Total</span>
                      <span className="text-blue-500">UGX {orderResult.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Delivery To</h4>
                    <p className="text-gray-200 text-sm">{orderResult.deliveryAddress}</p>
                  </div>

                  <button className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-xl">
                    <Download size={20} />
                    Download PDF Receipt
                  </button>
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inventory</h3>
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

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Payment Method</h3>
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
                  <div className="w-48 h-48 mb-6">
                    <Lottie 
                      animationData={{
                        v: "5.5.7",
                        fr: 60,
                        ip: 0,
                        op: 180,
                        w: 500,
                        h: 500,
                        nm: "Cart",
                        layers: [{
                          ddd: 0, ind: 1, ty: 4, nm: "Circle",
                          ks: {
                            o: { k: 100 },
                            r: { k: 0 },
                            p: { k: [250, 250, 0] },
                            a: { k: [0, 0, 0] },
                            s: { k: [{t:0, s:[80,80], e:[100,100]}, {t:90, s:[100,100], e:[80,80]}, {t:180, s:[80,80]}] }
                          },
                          shapes: [{
                            ty: "gr", it: [{
                              d: 1, ty: "el", s: { k: [300, 300] }, p: { k: [0, 0] }, nm: "Ellipse"
                            }, {
                              ty: "st", c: { k: [0.23, 0.5, 0.96, 1] }, w: { k: 10 }
                            }]
                          }]
                        }]
                      }}
                      loop={true}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{t.basket_empty}</h3>
                  <p className="text-gray-500 text-sm">{t.tech_collection_starts}</p>
                </div>
              )}
            </div>

            {!orderResult && items.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
                <div className="flex justify-between mb-6">
                  <span className="text-gray-400 font-medium">{t.subtotal}</span>
                  <span className="text-2xl font-black text-white">UGX {total.toLocaleString()}</span>
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
                      Encrypting Transaction...
                    </motion.div>
                  ) : (
                    <motion.div key="text" initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-3">
                      <CreditCard size={20} />
                      Complete Checkout
                      <ArrowRight size={18} className="ml-1" />
                    </motion.div>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-500 mt-4 font-bold tracking-widest uppercase">
                  Secure {paymentMethod} Transaction via Solo's Gateway
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
