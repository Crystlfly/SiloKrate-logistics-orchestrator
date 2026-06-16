import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, LineChart, ShieldCheck, ArrowRight, Eye, Lock } from 'lucide-react';
import ForgotPassword from './ForgotPassword.jsx';
import { useGoogleLogin } from '@react-oauth/google';

const LoginSplit = ({ onLogin, onSignupClick }) => {
  const navigate = useNavigate();
  const showSignupLink = false;
  const [eyeToggle, setEyeToggle] = useState(false);
  const [view, setView] = useState('login');
  
  // Clean UI States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Sign in to Dashboard");
  const [errorMessage, setErrorMessage] = useState(""); 

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const executeLogin = async (loginEmail, loginPassword) => {
    setIsLoading(true);
    setLoadingText("Authenticating...");
    setErrorMessage(""); // Clear any old errors

    // Render cold-start handler
    const timeoutId = setTimeout(() => {
      setLoadingText("Waking up server... this might take 50s");
    }, 4000);

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
      
      clearTimeout(timeoutId);
      const data = await res.json();
      
      if (data.success && data.action_required === "password_reset") {
        navigate('/setup-password', { state: { userId: data.userId } });
      } 
      else if (data.success) {
        onLogin(data.userRole, data.expiresAt);
      } 
      else {
        setErrorMessage(data.message || "Invalid credentials.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Login Error:", err);
      setErrorMessage("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingText("Sign in to Dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(formData.email, formData.password);
  };

  const handleDemoLogin = (email, password) => {
    setFormData({ email, password });
    executeLogin(email, password);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setLoadingText("Authenticating via Google...");
      setErrorMessage("");
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
        } else {
          setErrorMessage(data.message || "Google authentication failed.");
        }
      } catch (err) {
        console.error("Google Signup Error:", err);
        setErrorMessage("Connection error with Google.");
      } finally {
        setIsLoading(false);
        setLoadingText("Sign in to Dashboard");
      }
    },
    onError: () => setErrorMessage('Google Login Failed'),
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
          <p className="text-zinc-500 text-sm mb-8 font-medium">Sign in to access your command center</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Email Address</label>
              <input type="email" 
              placeholder="ops.manager@company.com" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={isLoading}
              className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Password</label>
              </div>
              <div className="relative">
                <input type={eyeToggle ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={isLoading}
                className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50" />
                <Eye onClick={() => setEyeToggle(!eyeToggle)} size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <input id="remember-me" type="checkbox" disabled={isLoading} className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer" />
                <label htmlFor="remember-me" className="text-xs text-zinc-500 font-bold cursor-pointer select-none">Remember me</label>
              </div>
              <button type="button" disabled={isLoading} onClick={() => setView('forgotPassword')} className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter hover:text-emerald-400 transition-colors disabled:opacity-50">
                Forgot password?
              </button>
            </div>

            {/* Custom Error UI Box */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mt-0.5 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <p className="text-red-500 text-xs font-bold leading-tight">{errorMessage}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                  {loadingText}
                </>
              ) : (
                <>
                  Sign in to Dashboard <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 bg-[#0F1219] border border-zinc-800/80 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-emerald-500" />
              <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">One-Click Demo Access</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('demo@SiloKrate.com', 'SiloKrate2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Admin <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button 
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('logisticmanager@SiloKrate.com', 'logisticmanager')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Logistics Manager <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('inventorymanager@SiloKrate.com', 'inventorymanager2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Inventory Manager <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('inventorystaff@SiloKrate.com', 'inventorystaff2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Inventory Staff <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('warehousemanager@SiloKrate.com', 'warehousemanager2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Warehouse Manager <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button 
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('warehousestaff@SiloKrate.com', 'warehousestaff2026')}
                className="text-xs font-bold text-zinc-400 bg-[#0B0E14] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 py-2.5 px-3 rounded-xl transition-all text-left flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
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