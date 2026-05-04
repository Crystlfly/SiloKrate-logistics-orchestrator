import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center relative overflow-hidden">
      {/* GRID PATTERN - Reused from Splash */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `, 
          backgroundSize: '45px 45px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
        }}
      ></div>
      
      {/* CENTER CONTENT */}
      <div className="z-10 flex flex-col items-center">
        
        {/* Animated Alert Icon */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Subtle glowing pulse behind the lock */}
          <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
          
          <div className="relative w-20 h-20 border border-rose-500/30 rounded-full flex items-center justify-center bg-[#0B0E14] shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            {/* Lock SVG Icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="28" 
              height="28" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-rose-500"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>

        {/* BRANDING & ERROR TEXT */}
        <div className="text-center mb-10">
          <h2 className="text-white font-black text-3xl tracking-[0.4em] uppercase mb-2 ml-4">
            Error<span className="text-rose-500"> 403</span>
          </h2>
          <div className="flex items-center gap-3 justify-center">
            <div className="h-[1px] w-8 bg-zinc-800"></div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
              Clearance Level Insufficient
            </p>
            <div className="h-[1px] w-8 bg-zinc-800"></div>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <Link 
          to="/" 
          className="group relative inline-flex items-center justify-center px-8 py-3 transition-all duration-200 bg-transparent border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/10 focus:outline-none"
        >
          <span className="text-zinc-300 text-[11px] font-bold uppercase tracking-[0.2em] group-hover:text-emerald-400 transition-colors">
            Return to Dashboard
          </span>
        </Link>
      </div>

      {/* BOTTOM STATUS */}
      <div className="absolute bottom-10 text-center">
        <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.5em]">
          Security Protocol Enforced
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;