import { useState, FormEvent, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Chrome, AlertCircle, Loader2, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

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
          recaptchaVerifier.current.clear();
          recaptchaVerifier.current = null;
       }
    };
  }, [isOpen]);

  const handlePhoneSubmit = async (e: FormEvent) => {
    if (e) e.preventDefault();
    
    // Clean up phone number: remove spaces and ensure it starts with +256
    let cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;
    
    const ugandaPhoneRegex = /^\+256[0-9]{9}$/;
    if (!phoneNumber || !ugandaPhoneRegex.test(cleanPhone)) {
      setError("Please use Ugandan format: +256 700 000 000");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!recaptchaVerifier.current) {
        // Fallback re-init
        if (recaptchaRef.current) {
           recaptchaVerifier.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' });
        } else {
           throw new Error("Security verification failed initialization");
        }
      }
      
      const result = await signInWithPhoneNumber(auth, cleanPhone, recaptchaVerifier.current);
      setConfirmationResult(result);
      setStep('otp');
      setResendTimer(60);
    } catch (err: any) {
      console.error("Phone Auth Error:", err);
      let msg = "Could not send code. Please try again.";
      if (err.code === 'auth/too-many-requests') msg = "Too many attempts. Please wait a while.";
      if (err.code === 'auth/invalid-phone-number') msg = "Invalid phone number format.";
      setError(msg);
      // Reset reCAPTCHA on error
      if (recaptchaVerifier.current) {
         recaptchaVerifier.current.clear();
         recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit code sent to your phone");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!confirmationResult) throw new Error("No active verification session");
      await confirmationResult.confirm(verificationCode);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("OTP Error:", err);
      let msg = "Incorrect code. Please try again.";
      if (err.code === 'auth/code-expired') msg = "Verification code expired. Request a new one.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let msg = "Google Sign-In failed.";
      if (err.code === 'auth/popup-closed-by-user') return; // User closed popup, don't show error
      if (err.code === 'auth/unauthorized-domain') msg = "This domain is not authorized for Google Sign-In.";
      if (err.code === 'auth/popup-blocked') msg = "Sign-in popup blocked by browser.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[210] p-4"
          >
            <div className="bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="relative p-8 pt-12">
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-500 mb-6 border border-blue-500/20">
                    {step === 'phone' ? <Phone size={32} /> : <CheckCircle size={32} />}
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-white mb-2 uppercase">
                    {step === 'phone' ? 'Continue with Phone' : 'Enter Secret Code'}
                  </h2>
                  <p className="text-gray-500 text-sm font-medium">
                    {step === 'phone' 
                      ? 'Secure, fast access for your engineering orders.' 
                      : `We sent a 6-digit code to ${phoneNumber}`}
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-wider"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}

                <div ref={recaptchaRef} />

                {step === 'phone' ? (
                  <form onSubmit={handlePhoneSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Ugandan Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 pl-14 text-white placeholder:text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-lg"
                          placeholder="+256 700 000 000"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="group w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          Send Verification Code
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">6-Digit SMS Code</label>
                      <input 
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-center text-white placeholder:text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-3xl tracking-[0.5em]"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-6 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-green-900/20 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Continue'}
                    </button>

                    <div className="flex flex-col gap-4">
                      <button 
                        type="button"
                        disabled={resendTimer > 0 || loading}
                        onClick={handlePhoneSubmit}
                        className="w-full text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors disabled:text-gray-600"
                      >
                        {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
                      </button>

                      <button 
                        type="button"
                        onClick={() => setStep('phone')}
                        className="w-full text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Wrong number? Go back
                      </button>
                    </div>
                  </form>
                )}

                {step === 'phone' && (
                  <div className="mt-10">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                        <span className="bg-neutral-900 px-4 text-gray-500">Other Protocol</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                    >
                      <Chrome size={20} className="text-blue-500" />
                      Continue with Google
                    </button>
                  </div>
                )}

                <p className="mt-10 text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                  By continuing, you agree to Solo's Engineering <br/> terms of service and storage protocols.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
