import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface ForgotPasswordPageProps {
  onNavigateSignIn: () => void;
  onNavigateResetPasswordWithToken: (token: string) => void;
  onGoHome: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigateSignIn,
  onNavigateResetPasswordWithToken,
  onGoHome,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessMessage(res.message);
      if (res.dev_reset_token) {
        setDevToken(res.dev_reset_token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process password reset request.');
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
          Reset your password
        </h2>
        <p className="text-xs text-[#64748B]">
          Enter your registered email address to receive password recovery instructions
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

        {successMessage ? (
          <div className="space-y-5 text-left">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reset Instructions Generated</span>
              </div>
              <p className="leading-relaxed">{successMessage}</p>
            </div>

            {devToken && (
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs space-y-2.5">
                <div className="font-bold text-[#4F46E5] flex items-center gap-1.5">
                  <span>Development Mode Reset Shortcut</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Because external SMTP email dispatch is in local mode, your single-use reset token has been securely generated:
                </p>
                <div className="p-2 rounded bg-white font-mono text-[10px] break-all border border-indigo-100 select-all">
                  {devToken}
                </div>
                <button
                  onClick={() => onNavigateResetPasswordWithToken(devToken)}
                  className="w-full mt-1 py-2 px-3 bg-[#4F46E5] text-white font-bold rounded-lg hover:bg-indigo-700 text-xs transition-all shadow-xs"
                >
                  Proceed to Reset Password Form →
                </button>
              </div>
            )}

            <button
              onClick={onNavigateSignIn}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-700 border border-[#E7EAF2] rounded-xl hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#172033] block">
                Registered Email Address
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#2855F5] to-[#713BFA] hover:opacity-95 shadow-md shadow-[#2855F5]/25 active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>

            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={onNavigateSignIn}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#101B3A] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
};
