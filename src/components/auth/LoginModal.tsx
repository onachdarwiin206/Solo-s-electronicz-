import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, AlertCircle, Loader2, ChevronRight, ShieldCheck, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth, ADMIN_EMAILS, ADMIN_PIN } from '../../AuthContext';
import { cn } from '../../lib/utils';
import { Tooltip } from '../ui/Tooltip';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPinCode, setShowPinCode] = useState(false);
  
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

    // Personalized Admin Check: If email is in list and password matches PIN, bypass Supabase
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
        setError(res.error || 'Identity rejection: unauthorized clearance level.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'System override protocol failed to initialize.');
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
      setError("INVALID ACCESS CODE: SECURITY SHIELD TRIGGERED");
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
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm z-[210] bg-card/60 backdrop-blur-2xl border border-border rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 sm:p-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-blue-500 animate-pulse" size={20} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Terminal Bypass</span>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-foreground/5 text-foreground/70 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter text-foreground mb-2 uppercase italic leading-none">Console Override</h2>
                <p className="text-muted-foreground/60 text-[9px] font-bold uppercase tracking-[0.2m] leading-relaxed italic">Administrative Access Protocol</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-[9px] font-black uppercase tracking-widest leading-tight">{error}</p>
                </motion.div>
              )}

              {showPin ? (
                <form onSubmit={handlePinSubmit} className="space-y-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2 italic text-left">Security Pin Verification</p>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={18} />
                    <input 
                      type={showPinCode ? "text" : "password"}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full bg-foreground/5 border border-border rounded-2xl py-5.5 px-12 text-foreground text-center font-black tracking-[1.2em] text-lg outline-none focus:border-blue-500/70 transition-all placeholder:text-muted-foreground/20"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPinCode(!showPinCode)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-foreground/5 rounded-lg text-muted-foreground/50 hover:text-foreground"
                    >
                      {showPinCode ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button type="submit" className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl uppercase tracking-widest italic text-[10px] shadow-xl shadow-blue-500/15 transition-transform active:scale-95">Verify Authentication</button>
                  <button type="button" onClick={() => setShowPin(false)} className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-all">Switch to Account Access</button>
                </form>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-5">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      placeholder="Operator Identity Email" 
                      value={email}
                      required
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-foreground/5 border border-border rounded-2xl py-4.5 pl-12 pr-6 text-foreground text-sm font-semibold outline-none focus:border-blue-500/70 transition-all placeholder:text-muted-foreground/30" 
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Verification Secret Code" 
                      value={password}
                      required
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-foreground/5 border border-border rounded-2xl py-4.5 pl-12 pr-12 text-foreground text-sm font-semibold outline-none focus:border-blue-500/70 transition-all placeholder:text-muted-foreground/30" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-foreground/5 rounded-lg text-muted-foreground/50 hover:text-foreground transition-all"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/15 active:scale-95 transition-all text-[10px] uppercase italic disabled:opacity-50 tracking-widest"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : (
                      <>Initialize Sync <ChevronRight size={14} /></>
                    )}
                  </button>
                  <button type="button" onClick={() => setShowPin(true)} className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-blue-500 transition-all">Overriding PIN Channel</button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
