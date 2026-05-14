import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { loginWithGoogle } from '../../auth';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { AuthFeatureWall } from './AuthFeatureWall';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function UserAuthModal({ isOpen, onClose, onSuccess }: UserAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [preFilledEmail, setPreFilledEmail] = useState('');
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const { user, loading: authResolving } = useAuth();

  const handleSignupSuccess = (email: string) => {
    setPreFilledEmail(email);
    setShowSignupSuccess(true);
    setIsLogin(true);
  };

  const handleLoginSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
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
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-5xl z-[210] flex"
          >
            <div className="bg-neutral-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row w-full">
              {/* Form Side */}
              <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8 md:hidden">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="text-blue-500" size={20} />
                     <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Solo Security</span>
                   </div>
                   <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X size={16} /></button>
                </div>

                <div className="relative overflow-hidden min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {(user || authResolving) ? (
                      <motion.div 
                        key="syncing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center"
                      >
                         <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
                         <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Syncing Identity...</h3>
                         <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-mono">Verifying hardware signature via cloud</p>
                      </motion.div>
                    ) : (
                      isLogin ? (
                        <motion.div
                          key="login"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <SignIn 
                            onSuccess={handleLoginSuccess}
                            onSwitchToSignUp={() => { setIsLogin(false); setShowSignupSuccess(false); }}
                            initialEmail={preFilledEmail}
                            signupSuccess={showSignupSuccess}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="signup"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <SignUp 
                            onSuccess={handleSignupSuccess}
                            onSwitchToSignIn={() => { setIsLogin(true); setShowSignupSuccess(false); }}
                          />
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-10 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">Digital Identity Sync</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <motion.button 
                    onClick={() => loginWithGoogle()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-[2rem] border border-white/5 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="Google" />
                    Connect via Hardware Cloud
                  </motion.button>
                </div>

                <div className="mt-12">
                   <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.1em] text-center opacity-50 italic">Protected by Solo Electronics Advanced Encryption Standard V4.2</p>
                </div>
              </div>

              {/* Feature Wall Side - Hidden on Mobile */}
              <div className="hidden md:block w-[400px] shrink-0">
                <AuthFeatureWall />
              </div>
            </div>

            {/* Desktop Close Button outside the main card */}
            <button 
              onClick={onClose}
              className="absolute -top-12 -right-4 hidden md:flex items-center gap-3 p-3 text-white/40 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest group"
            >
              Close <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
