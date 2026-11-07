import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignUpPageProps {
  onSuccess: () => void;
  onNavigateSignIn: () => void;
  onGoHome: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSuccess,
  onNavigateSignIn,
  onGoHome,
}) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password
      });
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
          Create your account
        </h2>
        <p className="text-xs text-[#64748B]">
          Start researching companies and walking into meetings verified
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-[#E7EAF2] rounded-2xl shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-5">
        
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#172033] block">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Sarah Connor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50/70 border border-[#E7EAF2] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#172033]"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#172033] block">
              Work Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="sarah@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50/70 border border-[#E7EAF2] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#172033]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#172033] block">
              Password (min. 8 characters)
            </label>
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

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="grid grid-cols-4 gap-1.5 h-1">
                  <div className={`rounded-full ${strength >= 1 ? 'bg-amber-400' : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${strength >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${strength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <div className={`rounded-full ${strength >= 4 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Password strength</span>
                  <span className={strength >= 3 ? 'text-emerald-600 font-semibold' : 'text-amber-500'}>
                    {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#172033] block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50/70 border border-[#E7EAF2] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all text-[#172033]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2855F5] to-[#713BFA] hover:opacity-95 shadow-md shadow-[#2855F5]/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="pt-4 border-t border-[#E7EAF2] text-center text-xs text-[#64748B]">
          Already have an account?{' '}
          <button
            onClick={onNavigateSignIn}
            className="font-bold text-[#4F46E5] hover:underline"
          >
            Sign in
          </button>
        </div>

      </div>

      <div className="mt-8 text-center text-[11px] text-slate-400">
        By registering, you agree to VerityMeet AI's Terms of Service and Privacy Policy.
      </div>
    </div>
  );
};
