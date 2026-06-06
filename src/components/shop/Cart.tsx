import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, MessageCircle, ShieldCheck, Loader2, AlertCircle, Building, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { CartItem, PaymentMethod } from '../../types';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';
import { OptimizedImage } from '../ui/OptimizedImage';
import { useAuth } from '../../AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

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
  const { user } = useAuth();
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [deliveryFee, setDeliveryFee] = useState(DISTRICTS[0].fee);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'bank_transfer'>('cod');
  const [carrier, setCarrier] = useState(CARRIERS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = subtotal + deliveryFee;

  useEffect(() => {
    if (user && user.id !== 'legacy-admin') {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    const d = DISTRICTS.find(d => d.name === district);
    if (d) setDeliveryFee(d.fee);
  }, [district]);

  const validate = () => {
    setValidationError(null);
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setValidationError("Incomplete dispatch metadata. Please supply registered name, telephone, and precise delivery addresses before submitting transaction.");
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
      setValidationError("System encountered processing anomaly. Please verify connections.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMomoSubmit = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    
    setTimeout(async () => {
      try {
        const orderId = await onCheckout('mobile_money', district, deliveryFee, customerPhone, customerAddress, customerName);
        if (orderId) {
          setLastOrderId(orderId);
          setIsSuccess(true);
        }
      } catch (err) {
        setValidationError("Mobile money prompt simulation failed. Please retry.");
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
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
    } catch {
      setValidationError("Failed logging WhatsApp checkout state.");
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
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-neutral-900 border-l border-white/10 z-[110] flex flex-col items-center justify-center p-12 text-center shadow-2xl font-mono">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                <CheckCircle2 className="text-emerald-400" size={40} />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Requisition Logged</h2>
              <div className="text-[10px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full mb-6">
                Status: Verified Secure
              </div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-widest leading-relaxed mb-8 max-w-xs">
                Transaction reference <span className="text-blue-400 font-bold block my-2 text-sm">#{lastOrderId}</span> has been committed to the {isSupabaseConfigured ? "cloud server" : "sandbox database"}.
              </p>
              <button 
                onClick={() => { setIsSuccess(false); onClose(); }}
                className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl border border-blue-400/20 transition-all uppercase tracking-widest text-xs active:scale-95 duration-100"
              >
                Return to terminal
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
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-background border-l border-border z-[110] flex flex-col shadow-2xl font-sans">
            <div className="p-6 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-foreground italic uppercase tracking-tighter flex items-center gap-2">
                    <ShoppingCart className="text-blue-500" size={18} />
                    TRANSACTION PROMPT
                  </h2>
                  <div className={cn(
                    "text-[8px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider",
                    isSupabaseConfigured ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  )}>
                    {isSupabaseConfigured ? "Live Sync" : "Sandbox"}
                  </div>
                </div>
                <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">PROT_ID_V4 // DESKTOP MOBILE SECURE ENTRY</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-full text-foreground transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-8 bg-card/10">
              {items.length > 0 ? (
                <>
                  {/* Selected HW components */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-border/40 pb-2">
                      <h3 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.15em]">REQUISITIONED COMPONENT MATRICES</h3>
                      <span className="text-[9px] font-mono text-blue-500 font-bold">{items.length} COMP</span>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, x: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: -100, height: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="flex gap-4 p-4 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors rounded-3xl border border-border/85 overflow-hidden relative"
                          >
                            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-border bg-black/30">
                              <OptimizedImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-foreground text-xs uppercase truncate">{item.name}</h4>
                                <Tooltip content="Eliminate Item" position="left">
                                  <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-500/10">
                                    <Trash2 size={12} />
                                  </button>
                                </Tooltip>
                              </div>
                              <div className="flex justify-between items-center mt-2.5">
                                <p className="text-blue-500 font-mono text-xs font-black">UGX {(item.price * item.quantity).toLocaleString()}</p>
                                <div className="flex items-center gap-2 bg-foreground/[0.03] border border-border/50 rounded-xl p-0.5">
                                  <button 
                                    onClick={() => onUpdateQuantity(item.id, -1)} 
                                    className="p-1 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                                  >
                                    <Minus size={10} />
                                  </button>
                                  <span className="text-foreground font-mono text-xs font-black w-4 text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => onUpdateQuantity(item.id, 1)} 
                                    className="p-1 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all rounded-lg"
                                  >
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Payment Modules Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 pb-2">SECURE PAYMENT METHOD PROTOCOL</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        onClick={() => { setPaymentMethod('cod'); setValidationError(null); }} 
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24", 
                          paymentMethod === 'cod' ? "bg-blue-600/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)]" : "bg-foreground/5 border-border/70 hover:bg-foreground/[0.08]"
                        )}
                      >
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">COD</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-medium leading-relaxed mt-2">Cash on Delivery route</p>
                        {paymentMethod === 'cod' && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                      </button>
                      <button 
                        onClick={() => { setPaymentMethod('mobile_money'); setValidationError(null); }} 
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24", 
                          paymentMethod === 'mobile_money' ? "bg-yellow-500/10 border-yellow-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)]" : "bg-foreground/5 border-border/70 hover:bg-foreground/[0.08]"
                        )}
                      >
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">Mobile M.</p>
                        <p className="text-[8px] text-yellow-500 uppercase tracking-widest font-black mt-2">MTN / AIRTEL</p>
                        {paymentMethod === 'mobile_money' && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />}
                      </button>
                      <button 
                        onClick={() => { setPaymentMethod('bank_transfer'); setValidationError(null); }} 
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24", 
                          paymentMethod === 'bank_transfer' ? "bg-purple-500/10 border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.15)]" : "bg-foreground/5 border-border/70 hover:bg-foreground/[0.08]"
                        )}
                      >
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">Bank Wire</p>
                        <p className="text-[8px] text-purple-400 uppercase font-black tracking-widest mt-2">PROT_TRANSFER</p>
                        {paymentMethod === 'bank_transfer' && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-purple-500 rounded-full" />}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {paymentMethod === 'mobile_money' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 bg-foreground/[0.02] rounded-2.5xl border border-border/80 space-y-4">
                            <div className="flex gap-2">
                              {CARRIERS.map(c => (
                                <button key={c.id} onClick={() => setCarrier(c.id)} className={cn("flex-1 py-2.5 rounded-xl border text-[9px] font-mono font-black uppercase tracking-wider transition-all", carrier === c.id ? c.color : "bg-foreground/5 border-border text-muted-foreground hover:bg-foreground/10")}>
                                  {c.name}
                                </button>
                              ))}
                            </div>
                            <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl text-center">
                              <p className="text-[9px] text-yellow-500/90 font-mono font-bold uppercase leading-relaxed">
                                System will dispatch push prompt to mobile number <br/> to authorize <span className="text-foreground font-black underline font-mono">UGX {grandTotal.toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === 'bank_transfer' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 bg-foreground/[0.02] rounded-2.5xl border border-purple-500/20 space-y-4">
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl font-mono text-[10px] text-purple-300 space-y-2 leading-relaxed">
                              <p className="font-black text-[11px] text-purple-400 uppercase tracking-widest border-b border-purple-500/20 pb-1.5">Bank Requisition Wire parameters</p>
                              <div className="flex justify-between"><span className="text-muted-foreground">Bank:</span><span className="text-white text-right font-bold">Stanbic Bank Lira</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="text-white text-right font-bold">SOLO SERVICES UGANDA</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Account #:</span><span className="text-blue-400 text-right underline font-black">9030019283726</span></div>
                              <p className="text-[8px] uppercase tracking-wider text-muted-foreground text-center mt-2 decoration-dashed">Upload transmission receipt via WhatsApp support platform</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Logistics Destinations & Grid */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 pb-2">LOGISTICS TRANSIT DESTINATION</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {DISTRICTS.map((d) => (
                        <button key={d.name} onClick={() => setDistrict(d.name)} className={cn("p-3.5 rounded-2xl border text-left transition-all", district === d.name ? "bg-blue-600/10 border-blue-500" : "bg-foreground/5 border-border hover:bg-foreground/[0.05]")}>
                          <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">{d.name}</p>
                          <p className="text-[9px] font-mono text-blue-400 font-bold mt-1">UGX {d.fee.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                    
                    {/* User Metadata fields */}
                    <div className="space-y-3.5 pt-4">
                      {user ? (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 rounded-2xl flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                          <p className="text-[8px] font-mono font-black uppercase tracking-widest text-emerald-400">
                            Pre-filled via active profile session
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/15 rounded-2xl flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                          <p className="text-[8px] font-mono font-black uppercase tracking-widest text-blue-400">
                            Anonymous Guest Protocol Active
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2 font-mono text-xs">
                        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Dispatcher / Name</label>
                        <input type="text" placeholder="Full Name" value={customerName} onChange={(e) => { setCustomerName(e.target.value); setValidationError(null); }} className="w-full bg-foreground/5 border border-border/80 rounded-2xl p-4 text-foreground text-sm outline-none focus:border-blue-500 transition-colors" />
                      </div>
                      
                      <div className="space-y-2 font-mono text-xs">
                        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Contact Phone</label>
                        <input type="tel" placeholder="Mobile Number" value={customerPhone} onChange={(e) => { setCustomerPhone(e.target.value); setValidationError(null); }} className="w-full bg-foreground/5 border border-border/80 rounded-2xl p-4 text-foreground text-sm outline-none focus:border-blue-500 transition-colors" />
                      </div>

                      <div className="space-y-2 font-mono text-xs">
                        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest pl-1">Landmarks & Destination Plot</label>
                        <textarea placeholder="Delivery Address / Landmarks" value={customerAddress} onChange={(e) => { setCustomerAddress(e.target.value); setValidationError(null); }} className="w-full bg-foreground/5 border border-border/80 rounded-2xl p-4 text-foreground text-sm outline-none focus:border-blue-500 transition-colors h-24 no-scrollbar resize-none" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-xs font-mono font-bold uppercase tracking-wider">Your transaction basket is currently empty.</p>
                </div>
              )}
            </div>

            {/* In-drawer validation error view */}
            {validationError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mx-6 p-4 bg-red-500/10 border border-red-500/15 rounded-2xl text-red-500 text-[10px] font-mono leading-relaxed font-bold uppercase tracking-wide flex items-start gap-2.5 shrink-0"
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </motion.div>
            )}

            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-background/80 backdrop-blur-md">
                <div className="space-y-2 mb-6 font-mono">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em]"><span className="text-muted-foreground">SUBTOTAL FEED</span><span className="text-foreground">UGX {subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em]"><span className="text-muted-foreground">TRANSIT FEE</span><span className="text-blue-500">UGX {deliveryFee.toLocaleString()}</span></div>
                  { !isSupabaseConfigured && (
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] bg-amber-500/5 my-1.5 p-1.5 border border-amber-500/10 rounded"><span className="text-amber-500">DATABASE TAX LIMIT (SANDBOX)</span><span className="text-amber-500 font-bold">UGX 0</span></div>
                  )}
                  <div className="flex justify-between pt-3 mt-3 border-t border-border"><span className="text-xs font-black text-foreground italic uppercase tracking-tighter">ESTIMATED VALUATION</span><span className="text-lg font-black text-foreground tracking-tighter">UGX {grandTotal.toLocaleString()}</span></div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {paymentMethod === 'mobile_money' ? (
                    <button 
                      onClick={handleMomoSubmit}
                      disabled={isProcessing}
                      className="w-full py-4.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-900/40 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-150"
                    >
                      {isProcessing ? <Loader2 className="animate-spin text-black" size={16} /> : (
                        <>
                          <ShieldCheck size={16} strokeWidth={3} />
                          Authorize MoMo Command
                        </>
                      )}
                    </button>
                  ) : paymentMethod === 'bank_transfer' ? (
                    <button 
                      onClick={() => handleCheckout('cod')}
                      disabled={isProcessing}
                      className="w-full py-4.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/40 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-150"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                          <Building size={16} />
                          Commit Wire Log Transfer
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCheckout('cod')}
                      disabled={isProcessing}
                      className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-150"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                          <ShieldCheck size={16} />
                          Commit Sandbox Order
                        </>
                      )}
                    </button>
                  )}

                  <button 
                    onClick={handleWhatsAppCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-green-500 font-black rounded-2xl flex items-center justify-center gap-3 transition-all border border-green-500/30 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-150"
                  >
                    <MessageCircle size={16} fill="currentColor" />
                    Dispatch WhatsApp Invoice
                  </button>
                </div>

                <p className="text-[7.5px] text-center text-muted-foreground mt-5 font-bold uppercase tracking-[0.2em] opacity-60 font-mono">
                  SOLO CONTROL DESCENT // PROTOCOL PROTOKEY v4
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
