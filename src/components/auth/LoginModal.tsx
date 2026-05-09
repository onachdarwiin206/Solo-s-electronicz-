import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../AuthContext';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const { loginWithGoogleAdmin, loginWithPin } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const success = await loginWithGoogleAdmin();
    if (success) {
      onClose();
    } else {
      setError("Restricted Access: Your account is not in the authorized 5-person admin whitelist.");
    }
    setLoading(false);
  };

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const success = loginWithPin(pin);
    if (success) {
      onClose();
    } else {
      setError("INVALID ACCESS CODE: SECURITY ALERT TRIGGERED");
      setPin('');
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
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm z-[210]"
          >
            <div className="bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 pt-10">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-500" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Admin Protocol</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-10 text-center">
                  <h2 className="text-4xl font-black tracking-tighter text-white mb-3 uppercase italic">
                    Admin Terminal
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Identity verification required for command access.
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
                      <p className="text-[10px] font-black uppercase tracking-widest">Access Denied</p>
                      <p className="text-xs font-medium leading-tight">{error}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handlePinSubmit} className="mb-6">
                  <div className="relative group">
                    <input 
                      type="password"
                      placeholder="ENTER PIN CODE"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-10 text-white text-center font-black tracking-[1em] focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700 placeholder:tracking-widest"
                      maxLength={4}
                    />
                    <motion.button 
                      type="submit"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-500/20"
                    >
                      <ArrowRight size={20} />
                    </motion.button>
                  </div>
                </form>

                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">OR</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <motion.button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-8 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-[2rem] border border-white/5 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                        <Lock size={10} className="text-blue-500" />
                      </div>
                      Whitelisted Override
                    </>
                  )}
                </motion.button>

                <div className="mt-12 text-center">
                  <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-loose max-w-[240px] mx-auto">
                    Solo's Electronics Control Unit <br/>
                    Unauthorized access is strictly prohibited.
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
