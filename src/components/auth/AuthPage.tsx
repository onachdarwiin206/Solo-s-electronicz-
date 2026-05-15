import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, MessageCircle, ArrowRight, Loader2, ShieldCheck, MailCheck, AlertCircle } from 'lucide-react';
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
  const [needsVerification, setNeedsVerification] = useState(false);

  const { login, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success) {
          onSuccess();
        } else {
          setError(res.error || 'Authentication failed');
        }
      } else {
        const res = await signUp(email, password, fullName, whatsapp);
        if (res.success) {
          setNeedsVerification(true);
        } else {
          setError(res.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'System bridge failure');
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 max-w-lg mx-auto shadow-2xl">
        <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mb-8 border border-blue-500/30">
          <MailCheck className="text-blue-500" size={40} />
        </div>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Identity Link Initialized</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          A verification uplink has been sent to <span className="text-blue-400 font-mono">{email}</span>. 
          Please confirm your electronic profile to access the hardware feed.
        </p>
        <button 
          onClick={() => setIsLogin(true)}
          className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all border border-white/10"
        >
          Return to Login Protocol
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-gray-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Visual Side (Hidden on Mobile) */}
          <div className="hidden md:flex bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900" />
            
            <div className="relative z-10">
              <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">Solo Cloud Synchronization</h3>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest leading-loose opacity-70">Hardware Auth v3.0</p>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <ShieldCheck className="text-white mb-2" size={20} />
                <p className="text-[10px] font-black uppercase text-white tracking-widest">Encrypted Logistics</p>
                <p className="text-[9px] text-blue-100/60 mt-1">Lira Region Direct Access</p>
              </div>
              <div className="flex items-center gap-4 text-white/40">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold">Authorized Only</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-8 md:p-12">
            <div className="mb-10">
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">
                {isLogin ? 'Log Entry' : 'New Profile'}
              </h2>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-all",
                    isLogin ? "text-blue-500 border-b-2 border-blue-500 pb-1" : "text-gray-600 hover:text-gray-400"
                  )}
                >
                  Auth
                </button>
                <button 
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-all",
                    !isLogin ? "text-blue-500 border-b-2 border-blue-500 pb-1" : "text-gray-600 hover:text-gray-400"
                  )}
                >
                  Join
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <AlertCircle className="text-red-500" size={16} />
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-2">Full Identity</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="Solo Customer" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-gray-700" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-2">WhatsApp Uplink</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                      <input 
                        required
                        type="tel" 
                        placeholder="+256..." 
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-gray-700 font-mono" 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-2">Hardware Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input 
                    required
                    type="email" 
                    placeholder="solo@electronics.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-gray-700" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Cipher Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (!email) {
                          setError("Hardware Email required for recovery protocol.");
                          return;
                        }
                        setLoading(true);
                        const res = await resetPassword(email);
                        setLoading(false);
                        if (res.success) {
                          setNeedsVerification(true); // Reuse verification screen for resetting state
                        } else {
                          setError(res.error || 'Recovery protocol failure');
                        }
                      }}
                      className="text-[9px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-white text-sm font-bold outline-none focus:border-blue-500 transition-all placeholder:text-gray-700" 
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-50 group mt-4"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                    <span className="text-lg uppercase italic tracking-tighter">{isLogin ? 'Initialize Auth' : 'Protocol Join'}</span>
                    <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center text-[10px] font-black text-gray-700 uppercase tracking-widest leading-loose italic max-w-[280px] mx-auto">
              Solo Electronics hardware feed access requires secure identity verification.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
