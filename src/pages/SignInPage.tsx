import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignInPageProps {
  onSuccess: () => void;
  onNavigateSignUp: () => void;
  onNavigateForgotPassword: () => void;
  onGoHome: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSuccess,
  onNavigateSignUp,
  onNavigateForgotPassword,
  onGoHome,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await login({ email: email.trim(), password });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#4F46E5] selection:text-white font-sans">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 mb-6">
        <div 
          onClick={onGoHome}
          className="inline-flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2855F5] via-[#4840EC] to-[#713BFA] flex items-center justify-center text-white shadow-md shadow-[#2855F5]/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="font-extrabold text-2xl text-[#101B3A] tracking-tight">
            VerityMeet <span className="text-[#2855F5]">AI</span>
          </span>
        </div>
        <h2 className="text-2xl font-black text-[#101B3A] tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs text-[#64748B]">
          Sign in to access your pre-meeting intelligence workspace
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-[#E7EAF2] rounded-2xl shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-6">
        
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#172033] block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="executive@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50/70 border border-[#E7EAF2] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#172033]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#172033]">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-[11px] font-semibold text-[#4F46E5] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50/70 border border-[#E7EAF2] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#172033]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-1">
            <input
              id="remember_me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#4F46E5] focus:ring-[#4F46E5] border-[#E7EAF2]"
            />
            <label htmlFor="remember_me" className="ml-2 text-xs font-medium text-[#64748B] cursor-pointer">
              Remember this device for 7 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2855F5] to-[#713BFA] hover:opacity-95 shadow-md shadow-[#2855F5]/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-[#E7EAF2] text-center text-xs text-[#64748B]">
          Don't have an account?{' '}
          <button
            onClick={onNavigateSignUp}
            className="font-bold text-[#4F46E5] hover:underline"
          >
            Create account
          </button>
        </div>

      </div>

      <div className="mt-8 text-center text-[11px] text-slate-400">
        © 2026 VerityMeet AI. Protected by deterministic verification & JWT security.
      </div>
    </div>
  );
};
