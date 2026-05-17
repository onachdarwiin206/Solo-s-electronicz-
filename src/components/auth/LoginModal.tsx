import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck, Mail, ChevronRight } from 'lucide-react';
import { useAuth, ADMIN_EMAILS, ADMIN_PIN } from '../../AuthContext';
import { cn } from '../../lib/utils';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  const { login, loginWithPin, isAdmin, loading: authResolving } = useAuth();

  // Automatically close if admin status is confirmed
  useEffect(() => {
    if (isAdmin && isOpen) {
      if (onSuccess) onSuccess();
      onClose();
    }
  }, [isAdmin, isOpen, onClose, onSuccess]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Personalized Admin Check: If email is in list and password matches PIN, we can bypass Supabase
    if (ADMIN_EMAILS.includes(email.toLowerCase()) && password === ADMIN_PIN) {
      const success = loginWithPin(password, email);
      if (success) {
        if (onSuccess) onSuccess();
        onClose();
        return;
      }
    }

    try {
      const res = await login(email, password);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Identity rejection: unauthorized clearance level');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'System uplink failure');
      setLoading(false);
    }
  };

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length < 4) {
      setError("INCOMPLETE PROTOCOL: 4-DIGIT PIN REQUIRED");
      return;
    }
    const success = loginWithPin(pin, email);
    if (success) {
      if (onSuccess) onSuccess();
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
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm z-[210] bg-neutral-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]"
          >
            <div className="p-10">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-blue-500" size={24} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Hardware Command</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="text-center mb-12">
                <h2 className="text-4xl font-black tracking-tighter text-white mb-3 uppercase italic leading-none">Terminal</h2>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed italic">Secure Admin Override Protocol</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 p-4 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{error}</p>
                </motion.div>
              )}

              {showPin ? (
                <form onSubmit={handlePinSubmit} className="space-y-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-700 ml-4 italic">Bypass PIN Login</p>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input 
                      type="password"
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-12 text-white text-center font-black tracking-[1.5em] outline-none focus:border-blue-500 transition-all placeholder:text-gray-800"
                      maxLength={4}
                    />
                  </div>
                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase tracking-widest italic text-xs shadow-xl shadow-blue-500/20">Authorize</button>
                  <button onClick={() => setShowPin(false)} className="w-full text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-blue-500 transition-all">Switch to Cloud Account</button>
                </form>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input 
                      type="email" 
                      placeholder="Admin Email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-gray-800" 
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input 
                      type="password" 
                      placeholder="Cipher Code" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-gray-800" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-sm uppercase italic disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : (
                      <>Initialize Sync <ChevronRight size={20} /></>
                    )}
                  </button>
                  <button onClick={() => setShowPin(true)} className="w-full text-[9px] font-black uppercase tracking-widest text-gray-700 hover:text-blue-500 transition-all">Use PIN Backup</button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
