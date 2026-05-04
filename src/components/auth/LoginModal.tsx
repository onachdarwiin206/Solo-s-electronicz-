import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, Github, Chrome, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err);
      // specific error messages based on the user request "reject if incorrect"
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Invalid username or password. Please try again.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This account already exists. Please login instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("An error occurred. Please check your credentials.");
      }
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
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
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
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[210] p-4"
          >
            <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="relative p-8 pt-12">
                <button 
                  onClick={onClose}
                  className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-500 mb-6 border border-blue-500/20">
                    {isSignUp ? <UserPlus size={32} /> : <LogIn size={32} />}
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter text-white mb-2 uppercase">
                    {isSignUp ? 'Activate Access' : 'Encrypted Login'}
                  </h2>
                  <p className="text-gray-500 text-sm font-medium">
                    {isSignUp ? 'Create your Solo engineering profile.' : 'Verify your credentials to continue.'}
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

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Identifier (Email)</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-14 text-white placeholder:text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                        placeholder="user@solos.io"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Access Key (Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-14 text-white placeholder:text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? 'Create Profile' : 'Acknowledge & Sync')}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]">
                      <span className="bg-gray-900 px-4 text-gray-500">Secondary Protocols</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
                  >
                    <Chrome size={18} className="text-blue-500" />
                    Connect via Google Node
                  </button>
                </div>

                <p className="mt-10 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  {isSignUp ? 'Already have an account?' : 'New engineering hire?'}
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="ml-2 text-blue-500 hover:text-blue-400"
                  >
                    {isSignUp ? 'Log In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
