import React from 'react';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, Box, Clock, ShieldAlert } from 'lucide-react';
import Login from './Login.jsx';

const ForgotPassword = () => {
  const [email, setEmail] = React.useState("");
  const [view, setView] = React.useState('forgotPassword');

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const response=await fetch(`${import.meta.env.VITE_SERVER_URL}/api/forgot-password`,{
      method:"POST",
      headers:{'Content-Type': 'application/json'},
      body:JSON.stringify({email})
    });
    const result=await response.json();
    if(result.status==="200"){
        console.alert("Password reset link sent to your email.");
    } else{
        console.alert("Error: "+result.message);
      console.log("Reset link requested for:", email);
    }
  };
  if(view==="login"){
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex font-sans relative overflow-hidden">
      {/* Background Grid Pattern - Matches LoginSplit */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      {/* Left Panel: Value Proposition */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-24 z-10">
        <div className="mb-12">
          <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-8">
            <Box className="text-white w-7 h-7" />
          </div>
          <h1 className="text-5xl font-black text-white leading-tight">
            We'll Help You <br/> <span className="text-emerald-500">Get Back In</span>
          </h1>
          <p className="text-zinc-400 mt-6 max-w-md text-md leading-relaxed font-medium">
            Password recovery is quick and secure. We'll send you a link to create a new password and regain access to your command center.
          </p>
        </div>

        <div className="space-y-10">
          <FeatureItem 
            icon={<ShieldCheck className="text-emerald-500" size={20}/>} 
            title="Secure Process" 
            desc="Encrypted link sent to your email only" 
          />
          <FeatureItem 
            icon={<Clock className="text-emerald-500" size={20}/>} 
            title="Quick Recovery" 
            desc="Reset your password in under 2 minutes" 
          />
          <FeatureItem 
            icon={<Mail className="text-emerald-500" size={20}/>} 
            title="Email Verification" 
            desc="Ensures only you can reset your password" 
          />
        </div>
      </div>

      {/* Right Panel: Reset Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <div className="w-full max-w-md bg-[#0F1219]/50 backdrop-blur-xl border border-zinc-800/50 p-10 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Reset Password</h2>
          <p className="text-zinc-500 text-sm mb-10 font-medium">Enter your email to receive reset instructions</p>

          <form className="space-y-8" onSubmit={handleResetSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="email" 
                  placeholder="ops.manager@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] group"
            >
              Send Reset Link 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              type="button" 
              onClick={()=>{setView('login')}}
              className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 font-bold hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </form>

          {/* Security Alert Box */}
          <div className="mt-10 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex gap-4">
            <div className="text-blue-400 shrink-0"><ShieldAlert size={20} /></div>
            <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
              For your security, the reset link will expire in 1 hour. If you don't receive an email, check your spam folder.
            </p>
          </div>
        </div>

        <p className="mt-12 text-[10px] text-zinc-700 uppercase font-black tracking-[0.3em]">
          © 2026 SiloKrate Logistics • Enterprise Command Center
        </p>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex gap-5 group cursor-default">
    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors">
      {icon}
    </div>
    <div>
      <h4 className="text-white font-black text-md uppercase tracking-wider">{title}</h4>
      <p className="text-zinc-500 text-sm mt-1 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default ForgotPassword;