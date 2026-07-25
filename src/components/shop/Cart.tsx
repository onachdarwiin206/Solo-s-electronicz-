import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trash2, Plus, Minus, ShoppingCart, ArrowRight, MessageCircle, 
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, MapPin, 
  Smartphone, CreditCard, ChevronRight, Sparkles, Truck, Check, Info
} from 'lucide-react';
import { CartItem, PaymentMethod } from '../../types';
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
  onCheckout: (
    method: PaymentMethod, 
    district: string, 
    deliveryFee: number, 
    phone: string, 
    address: string, 
    customerName: string
  ) => Promise<any>;
  orderResult: any;
  t: any;
}

type CheckoutStep = 'basket' | 'details';

const WhatsAppIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    style={{ width: size, height: size }} 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.022-.008-.115-.062-.272-.14-.08-.041-.268-.137-.358-.183-.09-.045-.155-.068-.22.031-.064.098-.25.314-.306.377-.056.062-.112.07-.22.031-.088-.044-.361-.133-.687-.424-.253-.226-.425-.506-.475-.591-.05-.084-.005-.13.038-.172.039-.038.08-.098.12-.147.04-.05.053-.085.08-.142.027-.057.013-.109-.007-.15-.02-.04-.155-.375-.213-.513-.057-.138-.114-.12-.156-.12-.04-.002-.087-.003-.135-.003-.048 0-.127.018-.193.088-.066.07-.254.248-.254.604 0 .357.259.702.295.751.036.049.51.777 1.235 1.09.173.074.308.118.414.152.173.055.33.047.454.028.138-.02 2.802-1.146 2.802-1.146.036-.046.072-.102.102-.156s.013-.105.007-.15-.022-.06-.051-.085zm-5.419 6.203h-.004a8.194 8.194 0 01-4.18-1.148l-.3-.178-3.1 1.018a.333.333 0 01-.42-.42l1.018-3.1-.178-.3a8.194 8.194 0 01-1.148-4.18C3.12 6.551 7.11 2.561 12 2.561c4.89 0 8.879 3.99 8.879 8.88 0 4.89-3.99 8.879-8.88 8.879l.063-.057zm0-16.791c-5.46 0-9.897 4.437-9.897 9.897 0 1.761.461 3.473 1.336 4.981l-.06-.102-1.42 4.33a.333.333 0 00.419.42l4.33-1.42.1.06a9.897 9.897 0 004.981 1.335h.001c5.46 0 9.897-4.437 9.897-9.897 0-5.46-4.437-9.897-9.897-9.897z" />
  </svg>
);

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const seconds = calculateTimeLeft();
      setTimeLeft(seconds);
      if (seconds <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft <= 0) {
    return (
      <span className="text-red-500 font-extrabold animate-pulse">
        EXPIRED (ORDER AUTO-CANCELLED)
      </span>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-1 bg-amber-500/5 px-4 py-2 rounded-2xl border border-amber-500/10 mb-4">
      <span className="text-[10px] font-mono tracking-widest text-amber-500 font-black uppercase">RECONCILIATION DEADLINE</span>
      <span className="text-amber-500 font-mono font-black text-sm tracking-widest animate-pulse">
        ⏱️ {formattedTime}
      </span>
    </div>
  );
}

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, t }: CartProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('basket');
  
  // Customer Details & Payment Method State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo');
  const [momoTxRef, setMomoTxRef] = useState('');
  const [momoStatus, setMomoStatus] = useState<'idle' | 'prompt_sent' | 'confirming' | 'completed'>('idle');
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOfflineOrder, setIsOfflineOrder] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [paymentDeadline, setPaymentDeadline] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 0;
  const grandTotal = subtotal;

  useEffect(() => {
    if (user && user.id !== 'legacy-admin') {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Reset steps on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('basket');
      setValidationError(null);
      setMomoStatus('idle');
      setMomoTxRef('');
    }
  }, [isOpen]);

  const validateDetails = () => {
    setValidationError(null);
    if (!customerName.trim()) {
      setValidationError("Full Name is required for order reservation.");
      return false;
    }
    if (!customerPhone.trim()) {
      setValidationError("A valid phone number is required for MTN MoMo and delivery.");
      return false;
    }
    if (paymentMethod === 'momo' && customerPhone.length < 9) {
      setValidationError("Please enter a valid Ugandan MTN phone number (e.g., 077..., 078..., 076...).");
      return false;
    }
    return true;
  };

  const handleExecuteCheckout = async () => {
    setValidationError(null);
    if (!validateDetails()) return;

    setIsProcessing(true);

    if (paymentMethod === 'momo') {
      setMomoStatus('prompt_sent');
    }

    try {
      const checkoutRes = await onCheckout(
        paymentMethod, 
        'Lira Hub / Showroom', 
        0, 
        customerPhone, 
        'Direct Collection / Fast Delivery', 
        customerName
      );

      if (!checkoutRes || !checkoutRes.orderId) {
        throw new Error("Could not initialize order registry.");
      }

      setLastOrderId(checkoutRes.orderId);
      setVerificationToken(checkoutRes.verificationToken || '');
      setPaymentDeadline(checkoutRes.paymentDeadline || null);
      setIsOfflineOrder(!!checkoutRes.offline);
      setIsSuccess(true);
      if (paymentMethod === 'momo') {
        setMomoStatus('completed');
      }
    } catch (error: any) {
      console.error("Checkout transaction error:", error);
      setMomoStatus('idle');
      setValidationError(error.message || "Your transaction request failed. Please try again or contact the owner on WhatsApp.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sendProofToWhatsAppOwner = () => {
    const cartSummary = items.map(i => `• ${i.name} (x${i.quantity}) - UGX ${(i.price * i.quantity).toLocaleString()}`).join('\n');
    const msg = `🧾 *MTN MOMO PAYMENT PROOF*\n-----------------------------------\n*Order ID:* ${lastOrderId}\n*Customer:* ${customerName}\n*Phone:* ${customerPhone}\n*Payment Method:* MTN Mobile Money (MoMo)\n*Merchant Code:* 782522 (EMMA ELECTRONICS UG)\n*Amount Paid:* UGX ${grandTotal.toLocaleString()}\n*Verification Code:* ${verificationToken}\n${momoTxRef ? `*MoMo Tx Reference:* ${momoTxRef}\n` : ''}\n*ITEMS:* \n${cartSummary}\n-----------------------------------\nHello Emma Electronics owner, I have submitted my MTN MoMo payment. Please verify my payment and dispatch my order!`;
    const url = `https://wa.me/256793405517?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  if (isSuccess) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#030307] border-l border-white/[0.04] z-[110] flex flex-col items-center justify-between p-8 text-center shadow-2xl font-sans overflow-y-auto"
            >
              <div className="w-full space-y-6 my-auto">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
                
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <CheckCircle2 className="text-amber-400" size={32} />
                </div>
                
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-[0.4em] text-amber-400 font-extrabold uppercase">
                    {paymentMethod === 'momo' ? 'MTN MOMO PAYMENT REGISTERED' : 'ORDER REGISTERED'}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-medium text-white tracking-tight">
                    {paymentMethod === 'momo' ? 'MoMo Receipt Generated' : 'Pending Confirmation'}
                  </h2>
                </div>

                {/* MTN MoMo Merchant Banner */}
                {paymentMethod === 'momo' && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-400 text-black font-black font-mono text-[10px] flex items-center justify-center">
                          MTN
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-300">MoMo Merchant Pay</span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-400/80 uppercase font-extrabold">Verified Code: 782522</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 font-sans">
                      Merchant: <strong className="text-white">EMMA ELECTRONICS UG</strong>
                    </p>
                  </div>
                )}

                <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-3xl p-5 text-left space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.04] font-mono">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Order ID</span>
                    <span className="text-xs text-white font-bold font-sans">#{lastOrderId}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.04] font-mono">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total Paid / Payable</span>
                    <span className="text-xs text-amber-400 font-bold">UGX {grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 pb-2 border-b border-white/[0.04]">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Verification Token</span>
                    <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] px-3.5 py-2 rounded-2xl">
                      <span className="text-xs font-mono font-extrabold text-amber-400 tracking-wider">{verificationToken}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(verificationToken);
                          alert("Verification token copied!");
                        }}
                        className="text-[9px] font-mono uppercase bg-white/[0.05] text-gray-300 hover:text-white px-2 py-1 rounded-lg border border-white/[0.05] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {!isOfflineOrder && paymentDeadline && (
                    <CountdownTimer deadline={paymentDeadline} />
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-3 w-full pt-2">
                  <button 
                    onClick={sendProofToWhatsAppOwner}
                    className="w-full py-4 bg-[#25D366] hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-xs active:scale-95 duration-100 shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2.5 cursor-pointer font-sans"
                  >
                    <WhatsAppIcon size={16} />
                    Send MoMo Receipt to Owner on WhatsApp
                  </button>

                  <button 
                    onClick={() => { setIsSuccess(false); onClose(); }}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-2xl transition-all uppercase tracking-widest text-[11px] active:scale-95 duration-100 border border-zinc-800 cursor-pointer"
                  >
                    Close & Continue Shopping
                  </button>
                </div>
              </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#030307] border-l border-white/[0.04] z-[110] flex flex-col shadow-2xl font-sans"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/90 backdrop-blur-md">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-display font-medium text-white flex items-center gap-2 uppercase tracking-tight">
                    <ShoppingCart className="text-zinc-400" size={16} />
                    Inquiry List
                  </h2>
                </div>
                <p className="text-[10px] font-sans text-zinc-500 uppercase tracking-widest font-medium">Verify hardware collection & sourcing details</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-900 border border-transparent rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            {/* Stepper Progress Bar - Minimalist Line indicators */}
            <div className="px-6 py-4 bg-zinc-950/60 border-b border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-widest">
              <button 
                onClick={() => setStep('basket')} 
                className={cn("flex items-center gap-1.5 transition-colors", step === 'basket' ? "text-white font-extrabold" : "text-zinc-600 hover:text-zinc-400")}
              >
                1. Selected Products
              </button>
              <ChevronRight size={10} className="text-zinc-800" />
              <button 
                onClick={() => { if (items.length > 0) setStep('details'); }} 
                className={cn("flex items-center gap-1.5 transition-colors", step === 'details' ? "text-white font-extrabold" : "text-zinc-600 hover:text-zinc-400")}
              >
                2. Contact Info
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6">
              
              {items.length > 0 ? (
                <AnimatePresence mode="wait">
                  
                  {/* Step 1: Baskets Items */}
                  {step === 'basket' && (
                    <motion.div 
                      key="basket" 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }} 
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">Sourced Components</span>
                        <span className="text-[10px] text-blue-500 font-bold">{items.length} units</span>
                      </div>

                      <div className="space-y-3.5">
                        {items.map((item) => {
                          const itemImage = (item.images && item.images.length > 0) ? item.images[0] : item.image;
                          return (
                            <div 
                              key={item.id}
                              className="flex gap-4 p-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors rounded-3xl border border-white/[0.04] relative overflow-hidden group"
                            >
                              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/[0.05] bg-black/40 flex items-center justify-center">
                                <OptimizedImage src={itemImage} alt={item.name} className="w-full h-full object-contain p-1.5" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-bold text-white text-xs uppercase truncate">{item.name}</h4>
                                  <button onClick={() => onRemove(item.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="flex justify-between items-center mt-2 font-mono">
                                  <p className="text-blue-400 text-xs font-bold">UGX {(item.price * item.quantity).toLocaleString()}</p>
                                  <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl p-0.5">
                                    <button 
                                      onClick={() => onUpdateQuantity(item.id, -1)} 
                                      className="p-1 hover:bg-white/[0.05] text-gray-500 hover:text-white transition-all rounded"
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span className="text-white text-xs font-semibold w-4 text-center">{item.quantity}</span>
                                    <button 
                                      onClick={() => onUpdateQuantity(item.id, 1)} 
                                      className="p-1 hover:bg-white/[0.05] text-gray-500 hover:text-white transition-all rounded"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Contact & Payment Details */}
                  {step === 'details' && (
                    <motion.div 
                      key="details"
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }} 
                      className="space-y-6 text-left"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-widest text-[#2563eb] font-black uppercase">CHECKOUT & PAYMENT</span>
                        <h3 className="text-sm font-display font-medium text-white">Contact & Payment Method</h3>
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1 font-mono">
                          <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Emma Okello..." 
                            value={customerName} 
                            onChange={(e) => { setCustomerName(e.target.value); setValidationError(null); }} 
                            className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-white/20 rounded-2xl p-3.5 text-white text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-sans" 
                          />
                        </div>

                        <div className="space-y-1 font-mono">
                          <label className="text-[8.5px] font-black text-gray-400 uppercase tracking-widest pl-1">MTN MoMo Telephone Number</label>
                          <input 
                            type="tel" 
                            placeholder="e.g. 0770000000, 0780000000..." 
                            value={customerPhone} 
                            onChange={(e) => { setCustomerPhone(e.target.value); setValidationError(null); }} 
                            className="w-full bg-white/[0.02] border border-white/[0.08] hover:border-white/20 rounded-2xl p-3.5 text-white text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-sans" 
                          />
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-2 pt-2">
                        <label className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-widest pl-1">
                          Select Payment Option
                        </label>

                        <div className="grid grid-cols-1 gap-2.5">
                          {/* Option 1: MTN MoMo */}
                          <div 
                            onClick={() => setPaymentMethod('momo')}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left",
                              paymentMethod === 'momo' 
                                ? "bg-amber-500/10 border-amber-400 text-white shadow-lg shadow-amber-500/10" 
                                : "bg-white/[0.01] border-white/[0.06] text-gray-400 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black font-mono text-xs flex items-center justify-center shrink-0">
                                MoMo
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">MTN Mobile Money</h4>
                                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[8px] font-mono font-black uppercase rounded-full">Fastest</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">Merchant Pay Code: <strong className="text-amber-300">782522</strong> (EMMA ELECTRONICS UG)</p>
                              </div>
                            </div>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", paymentMethod === 'momo' ? "border-amber-400 bg-amber-400" : "border-gray-600")}>
                              {paymentMethod === 'momo' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                          </div>

                          {/* Option 2: Cash on Delivery / Collection */}
                          <div 
                            onClick={() => setPaymentMethod('cod')}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left",
                              paymentMethod === 'cod' 
                                ? "bg-blue-500/10 border-blue-400 text-white shadow-lg shadow-blue-500/10" 
                                : "bg-white/[0.01] border-white/[0.06] text-gray-400 hover:border-white/20"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 font-black font-mono text-xs flex items-center justify-center shrink-0">
                                COD
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Pay on Delivery / Pickup</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">Pay cash upon inspecting device at Lira Hub</p>
                              </div>
                            </div>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center shrink-0", paymentMethod === 'cod' ? "border-blue-400 bg-blue-400" : "border-gray-600")}>
                              {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Direct Owner Inquiry Box */}
                      <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2.5">
                          <WhatsAppIcon size={16} className="text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-emerald-300">Have questions for the owner?</p>
                            <p className="text-[9.5px] text-zinc-400">Chat with Emma Electronics directly on WhatsApp.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `Hello Emma Electronics owner, I am interested in purchasing items worth UGX ${grandTotal.toLocaleString()}. Please provide more details!`;
                            window.open(`https://wa.me/256793405517?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
                        >
                          Chat Owner
                        </button>
                      </div>

                    </motion.div>
                  )}

                </AnimatePresence>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] flex items-center justify-center mb-4 text-gray-400">
                    <ShoppingCart size={20} />
                  </div>
                  <p className="text-gray-400 text-xs font-mono font-bold uppercase tracking-wider">Your transaction basket is currently empty.</p>
                </div>
              )}
            </div>

            {/* In-drawer validation error view */}
            {validationError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mx-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-400 text-[10px] font-mono leading-relaxed font-bold uppercase tracking-wide flex items-start gap-2.5 shrink-0"
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </motion.div>
            )}

            {/* Secure Footer Valuation and Actions */}
            {items.length > 0 && (
              <div className="p-6 border-t border-white/[0.04] bg-[#05050a]/90 backdrop-blur-md">
                <div className="space-y-2 mb-6 font-mono">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                    <span>Subtotal Matrix</span>
                    <span className="text-white">UGX {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-3 border-t border-white/[0.04] items-baseline">
                    <span className="text-xs font-black text-white italic uppercase tracking-tighter">Est. Valuation Total</span>
                    <span className="text-xl font-bold text-white tracking-tight">UGX {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  
                  {step === 'basket' && (
                    <button 
                      onClick={() => setStep('details')}
                      className="w-full py-4.5 bg-white hover:bg-white/95 text-black font-semibold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 text-xs tracking-widest duration-100 uppercase cursor-pointer"
                    >
                      Bespoke Inquiry Details
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {step === 'details' && (
                    <div className="flex flex-col gap-2.5 w-full">
                      <button 
                        onClick={handleExecuteCheckout}
                        disabled={isProcessing}
                        className={cn(
                          "w-full py-4.5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs duration-100 cursor-pointer font-sans",
                          paymentMethod === 'momo' 
                            ? "bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/20" 
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                        )}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>{paymentMethod === 'momo' ? 'Sending MoMo USSD Prompt...' : 'Processing Order...'}</span>
                          </>
                        ) : (
                          <>
                            {paymentMethod === 'momo' ? (
                              <>
                                <span className="w-5 h-5 rounded-md bg-black text-amber-400 font-mono font-black text-[10px] flex items-center justify-center">M</span>
                                <span>Pay UGX {grandTotal.toLocaleString()} via MTN MoMo</span>
                              </>
                            ) : (
                              <>
                                <CreditCard size={16} />
                                <span>Confirm Order (Pay on Delivery)</span>
                              </>
                            )}
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => setStep('basket')}
                        className="w-full py-3.5 bg-transparent text-gray-500 hover:text-white font-semibold rounded-2xl flex items-center justify-center gap-1 transition-all text-[10px] uppercase tracking-widest font-mono cursor-pointer"
                      >
                        ← Return to Selected Items
                      </button>
                    </div>
                  )}

                </div>

                <p className="text-[7.5px] text-center text-gray-600 mt-5 font-bold uppercase tracking-[0.25em] opacity-60 font-mono">
                  EMMA COMPLIANCE SHIELD // HUB CONSOLE v3.5
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
