import { useState, FormEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Chrome, AlertCircle, Loader2, Phone, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import { RecaptchaVerifier } from 'firebase/auth';
import { useAuth } from '../../AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('+256');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [resendTimer, setResendTimer] = useState(0);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const { signInWithGoogle, loginWithPhone, verifyOTP } = useAuth();

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (isOpen && !recaptchaVerifier.current && recaptchaRef.current) {
      try {
        if (recaptchaRef.current) recaptchaRef.current.innerHTML = '';
        
        recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha resolved');
          },
          'expired-callback': () => {
             console.warn('Recaptcha expired');
             if (recaptchaVerifier.current) recaptchaVerifier.current.clear();
             recaptchaVerifier.current = null;
          }
        });
      } catch (err) {
        console.error("Recaptcha init error:", err);
      }
    }
    
    return () => {
       if (recaptchaVerifier.current) {
          try { recaptchaVerifier.current.clear(); } catch (e) {}
          recaptchaVerifier.current = null;
       }
    };
  }, [isOpen]);

  const handlePhoneSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    let cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+256' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('2')) {
       if (!cleanPhone.startsWith('256')) cleanPhone = '+256' + cleanPhone;
       else if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    
    const ugandaPhoneRegex = /^\+256[0-9]{9}$/;
    if (!ugandaPhoneRegex.test(cleanPhone)) {
      setError("Use Ugandan format: +256 700 000 000 or 0700...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!recaptchaVerifier.current) throw new Error("Security verification failed. Refresh.");
      
      await loginWithPhone(cleanPhone, recaptchaVerifier.current);
      setStep('otp');
      setResendTimer(60);
      setPhoneNumber(cleanPhone);
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      let msg = "Could not send code. Please try again.";
      if (err.code === 'auth/too-many-requests') msg = "Quota exceeded. Try again in 15 mins.";
      if (err.code === 'auth/invalid-phone-number') msg = "Invalid phone number format.";
      if (err.code === 'auth/unauthorized-domain') msg = `Domain Error: Add '${window.location.hostname}' to Firebase.`;
      setError(msg);
      if (recaptchaVerifier.current) {
         try { recaptchaVerifier.current.clear(); } catch (e) {}
         recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyOTP(verificationCode);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("OTP Error:", err);
      let msg = "Incorrect code. Check and try again.";
      if (err.code === 'auth/code-expired') msg = "Code expired. Request a new one.";
      if (err.code === 'auth/invalid-verification-code') msg = "Invalid code. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      let msg = "Google Sign-In failed.";
      if (err.code === 'auth/popup-closed-by-user') return;
      
      if (err.code === 'auth/configuration-not-found') {
        msg = "Satellite Config Error: Google Sign-in must be ENABLED in the Firebase Console (Auth > Sign-in method).";
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = `Domain Error: Add '${window.location.hostname}' to Authorized Domains in Firebase Console.`;
      } else if (err.code === 'auth/popup-blocked') {
        msg = "Popup blocked. Please allow popups for authentication.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm z-[210]"
          >
            <div className="bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 pt-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-500" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Secure Protocol</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-10">
                  <h2 className="text-4xl font-black tracking-tighter text-white mb-3 uppercase italic">
                    {step === 'phone' ? 'Identity Check' : 'Verify Signal'}
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    {step === 'phone' 
                      ? 'Input your mobile credentials to access the internal distribution network.' 
                      : `Decryption key sent to ${phoneNumber}. Valid for 60 seconds.`}
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500"
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest">Protocol Failure</p>
                      <p className="text-xs font-medium leading-tight">{error}</p>
                    </div>
                  </motion.div>
                )}

                <div ref={recaptchaRef} />

                {step === 'phone' ? (
                  <div className="space-y-8">
                    <form onSubmit={handlePhoneSubmit} className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Terminal Access Number</label>
                        <div className="relative">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                          <input 
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 pl-14 text-white placeholder:text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-lg"
                            placeholder="+256 000 000 000"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={loading}
                        className="group w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl transition-all shadow-xl shadow-blue-500/10 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                      >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                          <>
                            Initialize Connection
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                      </div>
                      <div className="relative flex justify-center text-[8px] uppercase font-black tracking-[0.4em] text-gray-700">
                        <span className="bg-neutral-900 px-4">Inter-Link Sync</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-3xl border border-white/10 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50"
                    >
                      <Chrome size={18} className="text-blue-500" />
                      Satellite (Google)
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Authorized OTP Code</label>
                      <input 
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-center text-white placeholder:text-gray-800 outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono text-4xl tracking-[0.4em]"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-6 bg-green-600 hover:bg-green-500 text-white font-black rounded-3xl transition-all shadow-xl shadow-green-500/10 uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Establish Session'}
                    </button>

                    <div className="flex flex-col gap-4">
                      <button 
                        type="button"
                        disabled={resendTimer > 0 || loading}
                        onClick={() => handlePhoneSubmit()}
                        className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 disabled:text-gray-700 transition-colors"
                      >
                        {resendTimer > 0 ? `Retry in ${resendTimer}s` : 'Request New signal'}
                      </button>

                      <button 
                        type="button"
                        onClick={() => setStep('phone')}
                        className="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Override Input (Go Back)
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-12 text-center">
                  <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-loose max-w-[240px] mx-auto">
                    Solo's Electronics Distribution Center <br/>
                    Authentication required for high-current orders.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
