import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { loginWithGoogle } from '../../auth';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserAuthModal({ isOpen, onClose }: UserAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [preFilledEmail, setPreFilledEmail] = useState('');
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const { user } = useAuth();

  const handleSignupSuccess = (email: string) => {
    setPreFilledEmail(email);
    setShowSignupSuccess(true);
    setIsLogin(true);
  };

  const handleLoginSuccess = () => {
    onClose();
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
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {isLogin ? (
                  <SignIn 
                    onSuccess={handleLoginSuccess}
                    onSwitchToSignUp={() => { setIsLogin(false); setShowSignupSuccess(false); }}
                    initialEmail={preFilledEmail}
                    signupSuccess={showSignupSuccess}
                  />
                ) : (
                  <SignUp 
                    onSuccess={handleSignupSuccess}
                    onSwitchToSignIn={() => { setIsLogin(true); setShowSignupSuccess(false); }}
                  />
                )}

                <div className="mt-10 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">Database Options</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <motion.button 
                    onClick={() => loginWithGoogle()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-gray-400 font-bold rounded-[2rem] border border-white/5 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 grayscale opacity-50" alt="Google" />
                    Continue with Cloud ID
                  </motion.button>
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
