import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, AlertCircle, Loader2, ArrowRight, User, Mail, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { signupWithEmail, loginWithEmail } from '../../auth';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserAuthModal({ isOpen, onClose }: UserAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { user: authUser, error: authError } = isLogin 
      ? await loginWithEmail(email, password)
      : await signupWithEmail(email, password);

    if (authUser) {
      onClose();
      // Redirect or state update handled by AuthContext listener
      window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }));
    } else {
      setError(authError);
    }
    setLoading(false);
  };

  if (user) return null;

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
            className="relative w-full max-w-md z-[210]"
          >
            <div className="bg-neutral-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-2xl">
                      {isLogin ? <LogIn className="text-blue-500" size={24} /> : <UserPlus className="text-blue-500" size={24} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Security Gateway</span>
                      <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        {isLogin ? 'Login' : 'Sign Up'}
                      </h2>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 text-red-500"
                  >
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Authorization Failed</p>
                      <p className="text-xs font-medium leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Access Code</label>
                    <div className="relative group">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                      />
                    </div>
                  </div>

                  <motion.button 
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        {isLogin ? 'Enter Hardware Cloud' : 'Initialize Account'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-10 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">Database Options</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <button 
                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {isLogin ? 'Create New Hardware Identity' : 'Already have an identity? Login'}
                  </button>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-loose max-w-[280px] mx-auto opacity-50">
                    Solo's Electronics Security Protocol <br/>
                    All sessions are encrypted and monitored.
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
