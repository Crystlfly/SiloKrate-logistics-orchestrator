import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, LineChart, ShieldCheck, ArrowRight, Eye, Lock } from 'lucide-react';
import ForgotPassword from './ForgotPassword.jsx';
import { useGoogleLogin } from '@react-oauth/google';

const LoginSplit = ({ onLogin, onSignupClick }) => {
  const navigate = useNavigate();
  const showSignupLink = false;
  const [eyeToggele, setEyeToggle] = useState(false);
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const executeLogin = async (loginEmail, loginPassword) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });
      const data = await res.json();
      console.log("Login Response:", data);
      
      if (data.success && data.action_required === "password_reset") {
        navigate('/setup-password', { state: { userId: data.userId } });
      } 
      else if (data.success) {
        onLogin(data.userRole, data.expiresAt);
      } 
      else {
        alert("Login failed: " + data.message);
      }
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(formData.email, formData.password);
  };

  const handleDemoLogin = (email, password) => {
    setFormData({ email, password });
    // Immediately execute the login bypass
    executeLogin(email, password);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/google`, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: tokenResponse.access_token })
        });
        const data = await res.json();
        if (data.success) {
          onLogin(data.userRole, data.expiresAt);
          window.location.reload(); 
        }
      } catch (err) {
        console.error("Google Signup Error:", err);
      }
    },
    onError: () => console.log('Login Failed'),
  });

  if (view === "forgotPassword") {
    return <ForgotPassword />;
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="hidden lg:flex flex-1 flex-col justify-center px-24 z-10">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Trusted by 500+ enterprises</span>
          </div>
          <h1 className="text-6xl font-black text-white leading-tight">
            Command Your <br/> <span className="text-emerald-500">Supply Chain</span>
          </h1>
          <p className="text-zinc-400 mt-6 max-w-md text-lg leading-relaxed font-medium">
            Enterprise-grade logistics platform delivering real-time visibility, intelligent automation, and operational excellence.
          </p>
        </div>

        <div className="space-y-10">
          <FeatureItem icon={<Globe className="text-emerald-500" size={20}/>} title="Global Tracking" desc="Monitor shipments across 180+ countries" />
          <FeatureItem icon={<LineChart className="text-emerald-500" size={20}/>} title="Predictive Analytics" desc="AI-powered insights for optimization" />
          <FeatureItem icon={<ShieldCheck className="text-emerald-500" size={20}/>} title="Enterprise Security" desc="SOC 2 compliant infrastructure" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <div className="w-full max-w-md bg-[#0F1219]/50 backdrop-blur-xl border border-zinc-800/50 p-10 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back</h2>
          <p className="text-zinc-500 text-sm mb-10 font-medium">Sign in to access your command center</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
              <input type="email" 
              placeholder="ops.manager@company.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Password</label>
              </div>
              <div className="relative">
                <input type={eyeToggele ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all" />
                <Eye onClick={() => setEyeToggle(!eyeToggele)} size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <input id="remember-me" type="checkbox" className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer" />
                <label htmlFor="remember-me" className="text-xs text-zinc-500 font-bold cursor-pointer select-none">Remember me</label>
              </div>
              <button type="button" onClick={() => setView('forgotPassword')} className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter hover:text-emerald-400 transition-colors">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              Sign in to Dashboard <ArrowRight size={18} />
            </button>
          </form>

          {/* 3. Replaced Demo Box with Quick Access Buttons */}
          <div className="mt-8 bg-[#0F1219] border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-emerald-500" />
              <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">One-Click Demo Access</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => handleDemoLogin('demo@SiloKrate.com', 'SiloKrate2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group"
              >
                Admin <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button 
                type="button"
                onClick={() => handleDemoLogin('logisticmanager@SiloKrate.com', 'logisticmanager')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group"
              >
                Logistics Manager <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                onClick={() => handleDemoLogin('inventorymanager@SiloKrate.com', 'inventorymanager2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group"
              >
                Inventory Manager <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                onClick={() => handleDemoLogin('inventorystaff@SiloKrate.com', 'inventorystaff2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group"
              >
                Inventory Staff <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                onClick={() => handleDemoLogin('warehousemanager@SiloKrate.com', 'warehousemanager2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group"
              >
                Warehouse Manager <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                onClick={() => handleDemoLogin('warehousestaff@SiloKrate.com', 'warehousestaff2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group"
              >
                Warehouse Staff <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
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
      <h4 className="text-white font-black text-sm uppercase tracking-wider">{title}</h4>
      <p className="text-zinc-500 text-xs mt-1 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default LoginSplit;