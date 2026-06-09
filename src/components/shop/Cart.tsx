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

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, t }: CartProps) {
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const grandTotal = subtotal;

  useEffect(() => {
    if (user && user.id !== 'legacy-admin') {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  const validate = () => {
    setValidationError(null);
    if (!customerName.trim() || !customerPhone.trim()) {
      setValidationError("Incomplete contact details. Please supply your name and mobile number.");
      return false;
    }
    return true;
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (!validate()) return;
    setIsProcessing(true);
    
    try {
      const orderId = await onCheckout(method, 'Lira City', 0, customerPhone, '', customerName);
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

  const handleWhatsAppCheckout = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      const orderId = await onCheckout('cod', 'Lira City', 0, customerPhone, '', customerName);
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
                        {items.map((item) => {
                          const itemImage = (item.images && item.images.length > 0) ? item.images[0] : item.image;
                          return (
                            <motion.div 
                              key={item.id}
                              initial={{ opacity: 0, x: 20, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: 'auto' }}
                              exit={{ opacity: 0, x: -100, height: 0 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              className="flex gap-4 p-4 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors rounded-3xl border border-border/85 overflow-hidden relative"
                            >
                              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-border bg-black/30">
                                <OptimizedImage src={itemImage} alt={item.name} className="w-full h-full object-cover" />
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
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Logistics Destinations & Grid */}
                  <div className="space-y-4">
                    <h3 className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.15em] border-b border-border/40 pb-2">CONTACT DIRECTORY METADATA</h3>
                    
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
                  { !isSupabaseConfigured && (
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] bg-amber-500/5 my-1.5 p-1.5 border border-amber-500/10 rounded"><span className="text-amber-500">DATABASE TAX LIMIT (SANDBOX)</span><span className="text-amber-500 font-bold">UGX 0</span></div>
                  )}
                  <div className="flex justify-between pt-3 mt-3 border-t border-border"><span className="text-xs font-black text-foreground italic uppercase tracking-tighter">ESTIMATED VALUATION</span><span className="text-lg font-black text-foreground tracking-tighter">UGX {grandTotal.toLocaleString()}</span></div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleCheckout('cod')}
                    disabled={isProcessing}
                    className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/40 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-150"
                  >
                    {isProcessing ? <Loader2 className="animate-spin text-white" size={16} /> : (
                      <>
                        <ShieldCheck size={16} />
                        Confirm Order & Reserve Inventory
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleWhatsAppCheckout}
                    disabled={isProcessing}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-green-500 font-black rounded-2xl flex items-center justify-center gap-3 transition-all border border-green-500/30 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-150"
                  >
                    <MessageCircle size={16} fill="currentColor" />
                    Submit Order via WhatsApp
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
