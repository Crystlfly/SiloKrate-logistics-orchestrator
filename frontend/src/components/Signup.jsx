import React from 'react';
import { useState } from 'react';
import { Package, Zap, Lock, Users, ArrowRight, Eye } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';


const SignupSplit = ({ onLoginClick, onLogin }) => {
    const [formData, setFormData]=useState({
        fullname:"",
        email:"",
        companyname:"",
        password:"",
        confirmpassword:"",
    })
    const handlesubmit=async(e)=>{
        e.preventDefault();

        if(formData.password!==formData.confirmpassword){
            alert("Passwords do not match");
            return;
        }
        try{
            const res=await fetch(`${import.meta.env.VITE_SERVER_URL}/api/signup`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    fullname:formData.fullname,
                    email:formData.email,
                    companyname:formData.companyname,
                    password:formData.password
                })
            })
            const data=await res.json();
            if(data.success){
                alert("Signup successful! Please login.");
                onLoginClick();
            }else{
                alert("Signup failed: "+data.message);
            }
        }catch(err){
            console.error("Signup Error:",err);
        }
    }

    const googleLogin = useGoogleLogin({
      onSuccess: async (tokenResponse) => {
        try {
          const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/google`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenResponse.access_token })
          });

          const data = await res.json();
          if (data.success) {
            // Save token and login user
            onLogin(data.userRole, data.expiresAt);
            window.location.reload();
          }
        } catch (err) {
          console.error("Google Signup Error:", err);
        }
      },
      onError: () => console.log('Login Failed'),
    });

  return (
    <div className="min-h-screen bg-[#0B0E14] flex font-sans relative overflow-hidden py-14 px-6 lg:px-20">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Left Side: Branding & Testimonial */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 z-10">
        <div className="mb-12">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
            ● Join 500+ leading companies
          </span>
          <h1 className="text-6xl font-black text-white mt-6 leading-tight">
            Start Optimizing <br/> <span className="text-emerald-500">Today</span>
          </h1>
          <p className="text-zinc-400 mt-6 max-w-md text-lg leading-relaxed">
            Get instant access to powerful logistics tools designed for modern supply chain operations.
          </p>
        </div>

        <div className="space-y-8 mb-16">
          <FeatureItem icon={<Zap className="text-emerald-500"/>} title="Instant Setup" desc="Start tracking in under 5 minutes" />
          <FeatureItem icon={<Lock className="text-emerald-500"/>} title="Secure & Compliant" desc="Enterprise-grade security standards" />
          <FeatureItem icon={<Users className="text-emerald-500"/>} title="Team Collaboration" desc="Invite unlimited team members" />
        </div>

        {/* Testimonial */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 max-w-md italic text-zinc-400 text-sm">
          "SiloKrate transformed our logistics operations. We reduced delivery times by 40% and cut costs significantly."
          <div className="mt-4 flex items-center gap-3 not-italic">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700"></div>
            <div>
              <p className="text-white font-bold text-xs">Sarah Chen</p>
              <p className="text-[10px] text-zinc-500">VP Operations, TechCorp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-black text-white mb-2">Create account</h2>
          <p className="text-zinc-500 text-sm mb-10 tracking-tight">Get started with your command center</p>
          
          <button 
            onClick={()=>googleLogin()}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-bold py-3.5 px-4 rounded-xl transition-all mb-6 active:scale-[0.98]"
            >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.48 10.92v3.28h4.74c-.2 1.06-.9 1.95-1.82 2.56l2.72 2.12c1.6-1.48 2.52-3.66 2.52-6.22 0-.44-.04-.88-.12-1.3l-8.04.56zM6.5 12c0-.62.11-1.22.32-1.78L4.05 7.82C3.39 9.08 3 10.5 3 12c0 1.5.39 2.92 1.05 4.18l2.77-2.4c-.21-.56-.32-1.16-.32-1.78zM12 7.3c1.33 0 2.53.46 3.47 1.37l2.6-2.6C16.5 4.53 14.4 3.5 12 3.5c-3.1 0-5.77 1.77-7.05 4.38l2.77 2.4c.67-1.89 2.47-3.28 4.28-3.28zM12 16.7c-1.81 0-3.61-1.39-4.28-3.28l-2.77 2.4C6.23 18.43 8.9 20.2 12 20.2c2.4 0 4.41-.8 6.04-2.18l-2.72-2.12c-.81.54-1.83.8-3.32.8z"/>
            </svg>
            Join with Google
            </button>
            <div className="flex items-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-zinc-800"></div>
                <span className="text-[10px] text-zinc-600 font-black uppercase">OR</span>
                <div className="h-[1px] flex-1 bg-zinc-800"></div>
            </div>

          <form className="space-y-4" onSubmit={handlesubmit}>
            <InputField label="Full Name" placeholder="John Doe" 
            value={formData.fullname} 
            onChange={(e) => setFormData({...formData, fullname: e.target.value})} />
            <InputField label="Email Address" placeholder="you@company.com" 
            value={formData.email} 
            onChange={(e)=> setFormData({...formData, email:e.target.value})}/>
            <InputField label="Company Name" placeholder="Your Company Inc." 
            value={formData.companyname} 
            onChange={(e)=> setFormData({...formData, companyname:e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
               <InputField label="Password" type="password" placeholder="Create password" 
               value={formData.password} 
               onChange={(e) => setFormData({...formData, password: e.target.value})} />
               <InputField label="Confirm" type="password" placeholder="Re-enter password" 
               value={formData.confirmpassword} 
               onChange={(e) => setFormData({...formData, confirmpassword: e.target.value})} />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500/20" />
              <label className="text-[11px] text-zinc-500">I agree to the <span className="text-emerald-500 font-bold underline">Terms</span> and <span className="text-emerald-500 font-bold underline">Privacy Policy</span></label>
            </div>

            <button 
                type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              Create Account <ArrowRight size={18} />
            </button>
          </form>

          <p className="text-center mt-8 text-xs text-zinc-500">
            Already have an account? <button onClick={onLoginClick} className="text-emerald-500 font-bold">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shrink-0">{icon}</div>
    <div>
      <h4 className="text-white font-bold text-sm leading-tight mt-1">{title}</h4>
      <p className="text-zinc-500 text-xs mt-1">{desc}</p>
    </div>
  </div>
);

const InputField = ({ label, placeholder, type = "text", value, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <input 
        type={type} 
        placeholder={placeholder} 
        value={value}
        onChange={onChange}
        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50" 
      />
      {type === "password" && <Eye size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600" />}
    </div>
  </div>
);

export default SignupSplit;