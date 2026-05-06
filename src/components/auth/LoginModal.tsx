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
  const { loginAsAdmin } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const success = await loginAsAdmin(pin);
    
    if (success) {
      onClose();
    } else {
      setError("Authorization denied. Invalid security PIN.");
      setPin('');
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
                    Level 1 Access
                  </h2>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Input security override PIN to access terminal controls.
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

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center block">Security PIN</label>
                    <div className="relative">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input 
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        autoFocus
                        maxLength={4}
                        className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 pl-16 text-white placeholder:text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-4xl tracking-[0.8em]"
                        placeholder="••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading || pin.length < 4}
                    className="group w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-3xl transition-all shadow-xl shadow-blue-500/10 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Initialize Override
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

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
