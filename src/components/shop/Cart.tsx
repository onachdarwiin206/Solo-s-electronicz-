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
  ) => Promise<string | undefined>;
  orderResult: any;
  t: any;
}

type CheckoutStep = 'basket' | 'delivery' | 'payment';

export function Cart({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout, t }: CartProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('basket');
  
  // Delivery State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Lira City');
  const [streetAddress, setStreetAddress] = useState('');
  
  // Payment State
  const [paymentOption, setPaymentOption] = useState<'cod' | 'momo_mtn' | 'momo_airtel'>('cod');
  const [momoNumber, setMomoNumber] = useState('');
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Simulation States for MoMo PIN
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinCode, setPinCode] = useState('');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Districts & respective logistics rates
  const districts = [
    { name: 'Lira City', fee: 10000, est: '24 Hours' },
    { name: 'Kampala Core', fee: 5000, est: 'SAME DAY' },
    { name: 'Gulu Core', fee: 12000, est: '24-48 Hours' },
    { name: 'Soroti Core', fee: 12000, est: '24-48 Hours' },
    { name: 'Mbale Core', fee: 12000, est: '24-48 Hours' }
  ];

  const activeDistrictRow = districts.find(d => d.name === selectedDistrict) || districts[0];
  const deliveryFee = subtotal > 0 ? activeDistrictRow.fee : 0;
  const grandTotal = subtotal + deliveryFee;

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
      setShowPinPrompt(false);
      setPinCode('');
    }
  }, [isOpen]);

  const validateDelivery = () => {
    setValidationError(null);
    if (!customerName.trim()) {
      setValidationError("Recipient full name represents a required directory checkpoint.");
      return false;
    }
    if (!customerPhone.trim()) {
      setValidationError("A valid contact telephone sequence is required for delivery courier dispatch.");
      return false;
    }
    if (!streetAddress.trim()) {
      setValidationError("Specific physical drop-off coordinates are needed to secure deployment.");
      return false;
    }
    return true;
  };

  const handleNextToPayment = () => {
    if (validateDelivery()) {
      setStep('payment');
    }
  };

  const handleExecuteCheckout = async () => {
    setValidationError(null);

    if (paymentOption !== 'cod' && !momoNumber.trim()) {
      setValidationError("Mobile Money transaction billing requires a designated telemetry number.");
      return;
    }

    // Interactive PIN simulation for Mobile Money payments (MTN/Airtel)
    if (paymentOption !== 'cod' && !showPinPrompt) {
      setShowPinPrompt(true);
      return;
    }

    setIsProcessing(true);
    setShowPinPrompt(false);

    try {
      const mappedMethod: PaymentMethod = paymentOption === 'cod' ? 'cod' : 'momo';
      const orderId = await onCheckout(
        mappedMethod, 
        selectedDistrict, 
        deliveryFee, 
        customerPhone, 
        streetAddress, 
        customerName
      );
      if (orderId) {
        setLastOrderId(orderId);
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Checkout transaction error:", error);
      setValidationError("The billing handshake terminated unexpectedly. Please retry or choose Cash on Delivery.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWhatsAppInstantSubmit = async () => {
    if (!validateDelivery()) return;
    setIsProcessing(true);
    try {
      const orderId = await onCheckout(
        'cod', 
        selectedDistrict, 
        deliveryFee, 
        customerPhone, 
        `${streetAddress} (Via WhatsApp CoD)`, 
        customerName
      );
      if (orderId) {
        setLastOrderId(orderId);
        setIsSuccess(true);
      }
    } catch {
      setValidationError("Sourcing system failed logging WhatsApp metadata.");
    } finally {
      setIsProcessing(false);
    }
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#030307] border-l border-white/[0.04] z-[110] flex flex-col items-center justify-center p-10 text-center shadow-2xl font-sans"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-pulse">
                <CheckCircle2 className="text-emerald-400" size={40} />
              </div>
              
              <span className="text-[10px] font-mono tracking-[0.4em] text-emerald-400 font-bold uppercase">SECURE DESPATCH LOGGED</span>
              <h2 className="text-2xl sm:text-3xl font-display font-medium text-white tracking-tight mt-2 mb-2">Order Committed successfully</h2>
              
              <div className="text-[9px] font-mono uppercase bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full mb-6">
                Active Registry ID: #{lastOrderId}
              </div>

              <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed mb-8 max-w-xs">
                Your hardware slot is secured. An active receipt has been transmitted over WhatsApp, and tracking telemetry is already online.
              </p>

              <button 
                onClick={() => { setIsSuccess(false); onClose(); }}
                className="w-full py-4.5 bg-white text-black font-semibold rounded-2xl transition-all uppercase tracking-widest text-xs active:scale-95 duration-100 shadow-xl shadow-white/5"
              >
                Continue Sourcing
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#030307] border-l border-white/[0.04] z-[110] flex flex-col shadow-2xl font-sans"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-white/[0.04] flex justify-between items-center bg-[#05050a]/90 backdrop-blur-md">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-display font-medium text-white flex items-center gap-2 uppercase tracking-tight">
                    <ShoppingCart className="text-blue-500 animate-pulse" size={16} />
                    Secure Purchase Node
                  </h2>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-md border border-white/[0.06] bg-white/[0.02] text-gray-400 uppercase tracking-widest">
                    SSL v3
                  </span>
                </div>
                <p className="text-[8.5px] font-mono text-gray-500 uppercase tracking-widest">ESTABLISHING ENCRYPTED TRANSACTION DIRECTORY</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05] rounded-xl text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="px-6 py-4 bg-white/[0.01] border-b border-white/[0.03] flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">
              <button 
                onClick={() => setStep('basket')} 
                className={cn("flex items-center gap-1.5", step === 'basket' ? "text-white font-extrabold" : "text-gray-600 hover:text-gray-400")}
              >
                <span>01</span> Basket Review
              </button>
              <ChevronRight size={12} className="text-gray-700" />
              <button 
                onClick={() => { if (items.length > 0) setStep('delivery'); }} 
                className={cn("flex items-center gap-1.5", step === 'delivery' ? "text-white font-extrabold" : "text-gray-600 hover:text-gray-400")}
              >
                <span>02</span> Delivery Details
              </button>
              <ChevronRight size={12} className="text-gray-700" />
              <button 
                onClick={() => { if (validateDelivery()) setStep('payment'); }} 
                className={cn("flex items-center gap-1.5", step === 'payment' ? "text-white font-extrabold" : "text-gray-600 hover:text-gray-400")}
              >
                <span>03</span> Settlement
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
                              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/[0.05] bg-black/40">
                                <OptimizedImage src={itemImage} alt={item.name} className="w-full h-full object-cover" />
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

                  {/* Step 2: Delivery Details */}
                  {step === 'delivery' && (
                    <motion.div 
                      key="delivery"
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }} 
                      className="space-y-6 text-left"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono tracking-widest text-[#2563eb] font-black uppercase">LOGISTICS COORDINATES</span>
                        <h3 className="text-sm font-display font-medium text-white">Delivery Parameters</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5 font-mono">
                          <label className="text-[8.5px] font-black text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
                          <input 
                            type="text" 
                            placeholder="Recipient full name..." 
                            value={customerName} 
                            onChange={(e) => { setCustomerName(e.target.value); setValidationError(null); }} 
                            className="w-full bg-white/[0.01] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans" 
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="text-[8.5px] font-black text-gray-500 uppercase tracking-widest pl-1">Mobile Telephone Number</label>
                          <input 
                            type="tel" 
                            placeholder="e.g. 0770000000..." 
                            value={customerPhone} 
                            onChange={(e) => { setCustomerPhone(e.target.value); setValidationError(null); }} 
                            className="w-full bg-white/[0.01] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans" 
                          />
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="text-[8.5px] font-black text-gray-500 uppercase tracking-widest pl-1">Target District</label>
                          <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full bg-[#030307] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                          >
                            {districts.map(d => (
                              <option key={d.name} value={d.name}>{d.name} (UGX {d.fee.toLocaleString()})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5 font-mono">
                          <label className="text-[8.5px] font-black text-gray-500 uppercase tracking-widest pl-1">Drop-off / Home address</label>
                          <textarea 
                            rows={3}
                            placeholder="Specify work details, home street, blocks, or landmarks..." 
                            value={streetAddress} 
                            onChange={(e) => { setStreetAddress(e.target.value); setValidationError(null); }} 
                            className="w-full bg-white/[0.01] border border-white/[0.06] hover:border-white/10 rounded-2xl p-4 text-white text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans resize-none" 
                          />
                        </div>
                      </div>

                      {/* Small Logistics Prompt Info */}
                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex items-center gap-3">
                        <Truck size={14} className="text-blue-400 shrink-0" />
                        <div className="font-mono text-[9px] text-gray-500 uppercase tracking-wide leading-relaxed">
                          Priority dispatch: Sourced items bound for <span className="text-white font-bold">{selectedDistrict}</span> usually complete within <span className="text-blue-400 font-bold">{activeDistrictRow.est}</span>.
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* Step 3: Payments & MoMo HANDSHAKE */}
                  {step === 'payment' && (
                    <motion.div 
                      key="payment"
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0, x: 10 }} 
                      className="space-y-6 text-left"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono tracking-widest text-[#2563eb] font-black uppercase">CLEARANCE HANDSHAKE</span>
                        <h3 className="text-sm font-display font-medium text-white">Select Settlement Method</h3>
                      </div>

                      {/* Payment Grid */}
                      <div className="space-y-3 font-mono">
                        
                        {/* Cash on Delivery Option */}
                        <button
                          onClick={() => { setPaymentOption('cod'); setShowPinPrompt(false); }}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4",
                            paymentOption === 'cod' 
                              ? "bg-blue-500/5 border-blue-500 text-white" 
                              : "bg-white/[0.01] border-white/[0.04] text-gray-400 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                            paymentOption === 'cod' ? "border-blue-500" : "border-gray-700"
                          )}>
                            {paymentOption === 'cod' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-tight">Deposit on Pickup (COD)</h4>
                            <p className="text-[9.5px] text-gray-500 mt-1 leading-normal uppercase">Settled on checkout or pickup at our retail desks in Lira.</p>
                          </div>
                        </button>

                        {/* MTN MoMo */}
                        <button
                          onClick={() => { setPaymentOption('momo_mtn'); setMomoNumber(customerPhone); }}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4",
                            paymentOption === 'momo_mtn' 
                              ? "bg-amber-500/5 border-amber-500 text-white" 
                              : "bg-white/[0.01] border-white/[0.04] text-gray-400 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                            paymentOption === 'momo_mtn' ? "border-amber-500" : "border-gray-700"
                          )}>
                            {paymentOption === 'momo_mtn' && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-white uppercase tracking-tight">MTN Mobile Money</h4>
                            <p className="text-[9.5px] text-gray-500 mt-1 leading-normal uppercase">Simultaneous PIN push authorization simulated over telecom nodes.</p>
                          </div>
                        </button>

                        {/* Airtel Money */}
                        <button
                          onClick={() => { setPaymentOption('momo_airtel'); setMomoNumber(customerPhone); }}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4",
                            paymentOption === 'momo_airtel' 
                              ? "bg-red-500/5 border-red-500 text-white" 
                              : "bg-white/[0.01] border-white/[0.04] text-gray-400 hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                            paymentOption === 'momo_airtel' ? "border-red-500" : "border-gray-700"
                          )}>
                            {paymentOption === 'momo_airtel' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-tight">Airtel Money Uganda</h4>
                            <p className="text-[9.5px] text-gray-500 mt-1 leading-normal uppercase">Instant dispatch protocol. Zero handling delays.</p>
                          </div>
                        </button>

                      </div>

                      {/* Mobile phone configuration block for MoMo billing */}
                      {paymentOption !== 'cod' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2 font-mono"
                        >
                          <label className="text-[8.5px] font-black text-gray-500 uppercase tracking-widest pl-1">Authorized Billing Mobile Number</label>
                          <input 
                            type="tel" 
                            placeholder="Specify MoMo account..." 
                            value={momoNumber} 
                            onChange={(e) => setMomoNumber(e.target.value)} 
                            className="w-full bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4 text-white text-xs outline-none focus:border-blue-500"
                          />
                        </motion.div>
                      )}

                      {/* Dynamic MoMo PIN Prompt Modal Frame (Simulated UX) */}
                      <AnimatePresence>
                        {showPinPrompt && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 bg-white/[0.02] border border-blue-500/30 rounded-3xl space-y-4 font-mono text-center relative overflow-hidden"
                          >
                            <div className="absolute top-0 inset-x-0 h-1 bg-blue-500 animate-pulse" />
                            <div className="text-blue-400 text-xs font-bold uppercase tracking-widest">
                              Telecom PIN Input Handshake
                            </div>
                            <p className="text-[9.5px] text-gray-500 leading-normal uppercase max-w-xs mx-auto">
                              Please supply your mock 4-digit PIN mapping to verify checkout and authorize the Kampala procurement dispatch.
                            </p>
                            <input 
                              type="password" 
                              maxLength={4}
                              placeholder="••••" 
                              value={pinCode}
                              onChange={(e) => setPinCode(e.target.value)}
                              className="bg-black/40 border border-white/[0.08] text-center text-xl tracking-[0.6em] w-32 py-2.5 rounded-xl text-white block mx-auto outline-none focus:border-blue-500 font-mono"
                            />
                            <div className="font-sans text-[8px] uppercase tracking-widest text-[#2563eb] animate-pulse">
                              Active Telecom Pipeline Secured
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

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
                  {step !== 'basket' && (
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.15em] text-gray-500">
                      <span>Logistics Fee ({selectedDistrict})</span>
                      <span className="text-white">UGX {deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 mt-3 border-t border-white/[0.04] items-baseline">
                    <span className="text-xs font-black text-white italic uppercase tracking-tighter">Est. Valuation Total</span>
                    <span className="text-xl font-bold text-white tracking-tight">UGX {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  
                  {step === 'basket' && (
                    <button 
                      onClick={() => setStep('delivery')}
                      className="w-full py-4.5 bg-white hover:bg-white/95 text-black font-semibold rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 text-xs tracking-widest duration-100 uppercase"
                    >
                      Process Delivery Parameters
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {step === 'delivery' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setStep('basket')}
                        className="w-full py-4 bg-white/[0.02] hover:bg-white/[0.04] text-white font-semibold rounded-2xl border border-white/[0.05] flex items-center justify-center gap-1 xl:gap-2.5 transition-all active:scale-95 text-[10px] uppercase tracking-wider"
                      >
                        Return to Basket
                      </button>
                      <button 
                        onClick={handleNextToPayment}
                        className="w-full py-4 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-1 xl:gap-2.5 transition-all active:scale-95 text-[10px] uppercase tracking-wider"
                      >
                        Go to Settlement
                      </button>
                    </div>
                  )}

                  {step === 'payment' && (
                    <div className="space-y-3">
                      <button 
                        onClick={handleExecuteCheckout}
                        disabled={isProcessing}
                        className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/15 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs duration-100 font-sans"
                      >
                        {isProcessing ? <Loader2 className="animate-spin text-white" size={14} /> : (
                          <>
                            <ShieldCheck size={14} />
                            {paymentOption === 'cod' ? 'Complete Transaction (COD)' : 'Authorize Telecom Billing'}
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => setStep('delivery')}
                        className="w-full py-3.5 bg-transparent text-gray-500 hover:text-white font-semibold rounded-2xl flex items-center justify-center gap-1 transition-all text-[10px] uppercase tracking-widest font-mono"
                      >
                        Change Address Grid
                      </button>
                    </div>
                  )}

                  {step === 'basket' && (
                    <button 
                      onClick={handleWhatsAppInstantSubmit}
                      disabled={isProcessing}
                      className="w-full py-4 bg-white/[0.02] hover:bg-white/[0.04] text-green-400 font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all border border-green-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px] duration-100"
                    >
                      <MessageCircle size={14} fill="currentColor" />
                      Instant WhatsApp Checkout
                    </button>
                  )}

                </div>

                <p className="text-[7.5px] text-center text-gray-600 mt-5 font-bold uppercase tracking-[0.25em] opacity-60 font-mono">
                  SOLO COMPLIANCE SHIELD // HUB CONSOLE v3.5
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
