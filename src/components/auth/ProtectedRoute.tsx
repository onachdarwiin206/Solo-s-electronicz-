import { ReactNode } from 'react';
import { useAuth } from '../../AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requireAdmin = false, fallback }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Decrypting Auth State...</p>
      </div>
    );
  }

  // Not logged in at all
  if (!user && !requireAdmin) {
     return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-[2.5rem] border border-white/10">
        <ShieldAlert className="w-12 h-12 text-blue-500 mb-4" />
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Login Required</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Please authenticate your hardware profile to access this secure zone.</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openAuth'))}
          className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-500 transition-all font-mono"
        >
          Initialize Login
        </button>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white/5 rounded-[2.5rem] border border-white/10">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Access Restricted</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">This resource requires admin security clearance (PIN). Please authenticate to proceed.</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openAdmin'))}
          className="px-8 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
        >
          Enter Pin
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
