import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff, CheckCircle2, Box, AlertCircle } from 'lucide-react';
import Login from './Login.jsx';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/reset-password`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.password })
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        localStorage.removeItem('SiloKrate_user_role');
        localStorage.removeItem('SiloKrate_expires_at');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || "Failed to reset password");
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage("Network error. Please try again.");
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center p-8">
        <div className="bg-emerald-500/20 p-6 rounded-full mb-6">
          <CheckCircle2 className="text-emerald-500 w-16 h-16 animate-bounce" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4">Password Updated</h2>
        <p className="text-zinc-500 text-center max-w-sm mb-8">
          Your SiloKrate account security has been updated. Redirecting you to login...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex font-sans relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-24 z-10">
        <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-8">
          <Box className="text-white w-7 h-7" />
        </div>
        <h1 className="text-5xl font-black text-white leading-tight">
          Secure Your <br/> <span className="text-emerald-500">SiloKrate Account</span>
        </h1>
        <p className="text-zinc-400 mt-6 max-w-md text-md leading-relaxed font-medium">
          Create a strong, unique password to maintain operational integrity across your logistics network.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <div className="w-full max-w-md bg-[#0F1219]/50 backdrop-blur-xl border border-zinc-800/50 p-10 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-2">Set New Password</h2>
          <p className="text-zinc-500 text-sm mb-10 font-medium">Ensure your new password is at least 8 characters</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* New Password */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3.5 px-4 text-sm text-zinc-300 focus:border-emerald-500/50 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-emerald-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Confirm Password</label>
              <input 
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3.5 px-4 text-sm text-zinc-300 focus:border-emerald-500/50 transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle size={14} /> {errorMessage}
              </div>
            )}

            <button 
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {status === 'loading' ? "Updating..." : "Update Password"} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;