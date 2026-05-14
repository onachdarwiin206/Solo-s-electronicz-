import { useState, FormEvent } from 'react';
import { Lock, AlertCircle, Loader2, CheckCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { useAuth } from '../../AuthContext';

interface ResetPasswordProps {
  onSuccess: () => void;
}

export default function ResetPassword({ onSuccess }: ResetPasswordProps) {
  const { clearRecoveryState } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mismatched access keys. Please re-verify entries.");
      return;
    }
    if (password.length < 6) {
      setError("Security requirement: Key must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      });

      if (resetError) throw resetError;

      setSuccess(true);
      setTimeout(() => {
        clearRecoveryState();
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Key update failed. Session might have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-20 translate-y-[-20px] space-y-6">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle size={40} className="text-emerald-500" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Identity Secured</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Access key updated successfully. Redirecting to Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Security Override</span>
        <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Reset Key</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Initialize new access credentials</p>
      </div>

      {error && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 text-red-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-6">New Access Key</label>
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
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-6">Confirm New Key</label>
          <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-900/40 text-white font-black rounded-[2rem] transition-all uppercase tracking-[0.25em] text-[12px] flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              Confirm Terminal Signature
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
