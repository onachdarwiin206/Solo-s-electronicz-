import { useState, useEffect, FormEvent } from 'react';
import { Mail, Lock, LogIn, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../supabaseClient';

interface SignInProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
  initialEmail?: string;
  signupSuccess?: boolean;
}

export function SignIn({ onSuccess, onSwitchToSignUp, initialEmail = '', signupSuccess = false }: SignInProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
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
        // Redirect to Home
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
    <div className="space-y-8">
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Security Gateway</span>
        <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Login</h2>
      </div>

      {signupSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl text-blue-400 text-xs font-medium leading-relaxed"
        >
          Your account has been created. Please check your email and verify your address before logging in.
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-start gap-4 text-red-500 text-xs font-medium leading-relaxed"
        >
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
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
              Enter Hardware Cloud
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>

      <div className="pt-6 text-center">
        <button 
          onClick={onSwitchToSignUp}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 hover:text-blue-400 transition-colors"
        >
          Create New Hardware Identity
        </button>
      </div>
    </div>
  );
}
