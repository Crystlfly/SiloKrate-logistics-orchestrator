import React from 'react';

const SiloKrateSplash = () => {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center relative overflow-hidden">
      {/* GRID PATTERN 
        We use very low opacity (0.03) and a radial mask 
        to ensure the grid fades out toward the edges.
      */}
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
        {/* Animated Loading Ring */}
        <div className="relative mb-8">
          <div className="w-16 h-16 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
          </div>
        </div>

        {/* BRANDING */}
        <div className="text-center">
          <h2 className="text-white font-black text-3xl tracking-[0.4em] uppercase mb-2">
            SiloKrate<span className="text-emerald-500">.</span>
          </h2>
          <div className="flex items-center gap-3 justify-center">
            <div className="h-[1px] w-8 bg-zinc-800"></div>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
              Initializing System
            </p>
            <div className="h-[1px] w-8 bg-zinc-800"></div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS */}
      <div className="absolute bottom-10 text-center">
        <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.5em]">
          Secure Enterprise Link Established
        </p>
      </div>
    </div>
  );
};

export default SiloKrateSplash;