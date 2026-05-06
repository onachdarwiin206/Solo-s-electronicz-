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
  const { loginWithGoogleAdmin } = useAuth();

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

                <button 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] transition-all shadow-xl shadow-blue-500/20 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 brightness-200 grayscale contrast-200" alt="Google" />
                      Whitelisted Google Login
                    </>
                  )}
                </button>

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
