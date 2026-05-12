import { useState, useEffect, FormEvent } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface SignInProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
  initialEmail?: string;
  signupSuccess?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function SignIn({ onSuccess, onSwitchToSignUp, initialEmail = '', signupSuccess = false }: SignInProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        onSuccess();
        window.dispatchEvent(new CustomEvent('changeView', { detail: 'shop' }));
      } else {
        setError("Account access restricted. Please ensure your hardware identity is verified via email.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected security error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Security Gateway</span>
        <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Login</h2>
      </motion.div>

      <AnimatePresence>
        {signupSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] text-blue-400 text-[10px] font-bold uppercase tracking-wider leading-relaxed text-center"
          >
            Encryption keys generated. Please verify your identity via email.
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 text-red-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-6">Hardware Identifier (Email)</label>
          <div className="relative group">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="email"
              required
              placeholder="id@solo-electronics.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex justify-between items-center px-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Access Key (Password)</label>
            <button type="button" className="text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors opacity-60 hover:opacity-100">
              Recovery Link?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-14 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </motion.div>

        <motion.button 
          variants={itemVariants}
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] shadow-2xl shadow-blue-900/40 transition-all uppercase tracking-[0.25em] text-[12px] flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              Sync with Hardware Cloud
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>

      <motion.div variants={itemVariants} className="pt-6 text-center border-t border-white/5">
        <button 
          onClick={onSwitchToSignUp}
          className="group relative inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-colors"
        >
          <span>Create New Identity</span>
          <div className="h-px w-8 bg-gray-500 group-hover:w-12 group-hover:bg-blue-500 transition-all" />
        </button>
      </motion.div>
    </motion.div>
  );
}
