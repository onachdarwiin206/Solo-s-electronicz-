import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  MessageCircle, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  MailCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  KeyRound,
  Chrome
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { cn } from '../../lib/utils';

interface AuthPageProps {
  onSuccess: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, signUp, resetPassword, loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Google Authentication failed to authorize.');
      }
    } catch (err: any) {
      setError(err.message || 'Error initializing Google secure session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          onSuccess();
        } else {
          setError(res.error || 'Authentication details are incorrect. Please verify your credentials.');
        }
      } else {
        // Validation check for whatsapp
        let cleanWhatsapp = whatsapp.trim();
        if (!cleanWhatsapp.startsWith('+') && !cleanWhatsapp.startsWith('0')) {
          cleanWhatsapp = '+256' + cleanWhatsapp; // Auto prefix with Uganda standard if user starts with simple number
        }
        
        const res = await signUp(email, password, fullName, cleanWhatsapp);
        if (res.success) {
          setNeedsVerification(true);
        } else {
          setError(res.error || 'Registration declined. The email address might already be registered.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'System bridge communication failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please provide your Hardware Email to initialize the recovery pipeline.");
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await resetPassword(email);
      if (res.success) {
        setSuccessMsg("System override key dispatched! Check your email inbox for instructions.");
      } else {
        setError(res.error || 'Failed to dispatch password recovery protocol.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing password dispatch pipeline.');
    } finally {
      setLoading(false);
    }
  };

  // Score from 0 to 5 based on password complexity
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent', textColor: 'text-muted-foreground' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Weak Protocol', color: 'bg-red-500/60', textColor: 'text-red-500' };
    if (score <= 4) return { score, label: 'Standard Secure', color: 'bg-amber-500/60', textColor: 'text-amber-500' };
    return { score, label: 'Terminal Ready (Excellent)', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  };

  const strength = getPasswordStrength(password);

  if (needsVerification) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-card/40 backdrop-blur-2xl border border-border rounded-[3rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative ambient bubble */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/20 mx-auto">
            <MailCheck className="text-blue-500 animate-bounce" size={40} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-foreground italic uppercase tracking-tighter mb-4">Verification Uplink Set</h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-8">
            An authentication directive has been sent to <span className="text-blue-400 font-mono font-bold block mt-1 break-all">{email}</span>. 
            Confirm your profile via the email link to gain direct clearance to the inventory dashboard.
          </p>
          <button 
            onClick={() => {
              setNeedsVerification(false);
              setIsLogin(true);
              setPassword('');
            }}
            className="w-full px-8 py-4 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-border"
          >
            Return to Sign-In Protocol
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-card/40 backdrop-blur-3xl rounded-[3rem] sm:rounded-[4rem] border border-border overflow-hidden shadow-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
          
          {/* Visual Side (Hidden on Mobile) */}
          <div className="hidden md:flex md:col-span-5 bg-blue-900/40 p-12 flex-col justify-between relative overflow-hidden border-r border-border">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-20 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-700/30 via-indigo-950/40 to-black/80" />
            
            {/* Ambient sliding light stripe */}
            <div className="absolute top-1/4 -left-1/2 w-full h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none transform -rotate-12 animate-pulse" />

            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-400">
                <Sparkles size={10} />
                Solo Electronics v3.0
              </div>
              <h3 className="text-3xl font-black text-foreground italic uppercase tracking-tighter leading-tight">
                Secure Cloud Sync
              </h3>
              <p className="text-muted-foreground/80 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                Connect your account to access custom pricing, manage cart data, place immediate WhatsApp orders and review specs.
              </p>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="p-5 bg-foreground/5 backdrop-blur-md rounded-2xl border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-blue-500" size={16} />
                  <span className="text-[10px] font-black uppercase text-foreground tracking-widest">Encrypted Protocols</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Session synchronization ensures secure order execution directly to our delivery logistics system in Lira City.
                </p>
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest border-t border-border/40 pt-4">
                <span>Direct Feed Link</span>
                <span>Active 🛰️</span>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 sm:p-12 md:col-span-7 flex flex-col justify-center">
            
            <div className="mb-10 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground italic uppercase tracking-tighter">
                  {isLogin ? 'Log Entry' : 'Register Profile'}
                </h2>
                <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">Secure</span>
              </div>
              
              {/* Dual Selector Switch */}
              <div className="relative flex p-1 bg-foreground/5 rounded-2xl border border-border w-full">
                <div 
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20 transition-transform duration-300 ease-out" 
                  style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }} 
                />
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
                  className={cn(
                    "relative z-10 flex-1 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-200",
                    isLogin ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Authorized Auth
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
                  className={cn(
                    "relative z-10 flex-1 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-200",
                    !isLogin ? "text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Join Logistics
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
                  >
                    <AlertCircle className="shrink-0" size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-normal">{error}</p>
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400"
                  >
                    <Check className="shrink-0" size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-normal">{successMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Display Name</label>
                      <div className="relative group/field">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within/field:text-blue-500 transition-colors" size={18} />
                        <input 
                          required={!isLogin}
                          type="text" 
                          placeholder="e.g. Aaron Darwin" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-foreground/5 border border-border rounded-2xl py-4.5 pl-12 pr-6 text-foreground text-sm font-semibold outline-none focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-muted-foreground/40" 
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">WhatsApp Direct Number</label>
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">e.g. 770123456</span>
                      </div>
                      <div className="relative group/field">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-black font-mono text-muted-foreground/60 select-none pb-0.5">
                          <MessageCircle size={16} className="text-muted-foreground/40" />
                          <span>🇺🇬 +256</span>
                        </div>
                        <input 
                          required={!isLogin}
                          type="tel" 
                          placeholder="770000000" 
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full bg-foreground/5 border border-border rounded-2xl py-4.5 pl-28 pr-6 text-foreground text-sm font-bold outline-none focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-muted-foreground/30 font-mono" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Hardware Email Account</label>
                <div className="relative group/field">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within/field:text-blue-500 transition-colors" size={18} />
                  <input 
                    required
                    type="email" 
                    placeholder="name@cloud.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4.5 pl-12 pr-6 text-foreground text-sm font-semibold outline-none focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-muted-foreground/40" 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Cipher Security Code</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      <KeyRound size={10} />
                      Forgot password override?
                    </button>
                  )}
                </div>
                
                <div className="relative group/field">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within/field:text-blue-500 transition-colors" size={18} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4.5 pl-12 pr-12 text-foreground text-sm font-semibold outline-none focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-muted-foreground/40" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-foreground/5 rounded-lg text-muted-foreground/50 hover:text-foreground transition-all"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator for Registration */}
                <AnimatePresence>
                  {!isLogin && password && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-2 space-y-1.5 px-2"
                    >
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground/60">Cipher Strength:</span>
                        <span className={strength.textColor}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden flex gap-1">
                        <div className={cn("h-full transition-all duration-300 rounded-full", strength.color)} style={{ width: `${Math.max(15, strength.score * 20)}%` }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-black rounded-2xl flex items-center justify-center gap-3.5 transition-all shadow-xl shadow-blue-500/15 active:scale-95 disabled:opacity-50 group mt-6"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-widest font-black italic">
                      {isLogin ? 'Initialize System Access' : 'Establish Access Profile'}
                    </span>
                    <ArrowRight className="group-hover:translate-x-1.5 transition-transform" size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/80" />
              </div>
              <span className="relative z-10 px-4 py-1 text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 bg-card rounded-full border border-border/60">
                Or Sync Securely via Google
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4.5 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-foreground font-black text-[11px] uppercase tracking-widest"
            >
              <Chrome size={15} className="text-blue-400" />
              <span>Sign In with Google Account</span>
            </button>

            <div className="mt-8 text-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.15em] leading-relaxed italic max-w-sm mx-auto">
              {isLogin 
                ? "Connecting verifies user credential sets with supersonic edge relays." 
                : "A confirmation secure mail directive will generate on dynamic submit."}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
