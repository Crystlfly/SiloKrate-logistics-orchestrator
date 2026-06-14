import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Eye, CheckCircle } from 'lucide-react';

const SetupPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const userId = location.state?.userId;

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Kick back to login if accessed directly
    if (!userId) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage(''); // Clear previous messages

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/auth/first-login-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPassword })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage("Security protocol complete! Redirecting to Command Center...");
                
                setTimeout(() => {
                    navigate('/login');
                }, 2500);

            } else {
                setError(data.message || "Failed to update password.");
                setIsLoading(false); // Only re-enable the button if there's an error
            }
        } catch (err) {
            setError("An error occurred connecting to the server.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E14] flex flex-col justify-center items-center font-sans relative overflow-hidden p-8">
            {/* Background grid pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="w-full max-w-md bg-[#0F1219]/50 backdrop-blur-xl border border-zinc-800/50 p-10 rounded-3xl shadow-2xl z-10">
                
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="text-emerald-500" size={32} />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Security Protocol</h2>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                        Welcome to SiloKrate Logistics. To protect your command center, please replace your auto-generated password.
                    </p>
                </div>

                {/* 🔴 Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                    </div>
                )}

                {/* 🟢 Custom Success Banner */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 animate-pulse">
                        <CheckCircle className="text-emerald-500" size={16} />
                        <p className="text-emerald-400 text-xs font-bold text-center">{successMessage}</p>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Create a secure password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={successMessage !== ''} // Lock input on success
                                className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50" 
                            />
                            <Eye 
                                onClick={() => !successMessage && setShowPassword(!showPassword)} 
                                size={16} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 cursor-pointer hover:text-emerald-500 transition-colors" 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Confirm Password</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Re-enter your new password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={successMessage !== ''} // Lock input on success
                            className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50" 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || successMessage !== ''} // Lock button on success
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading && !successMessage ? 'Updating...' : successMessage ? 'Protocol Complete' : 'Update & Continue'} 
                        <ArrowRight size={18} />
                    </button>
                </form>
            </div>
            
            <p className="mt-12 text-[10px] text-zinc-700 uppercase font-black tracking-[0.3em] z-10">
                © 2026 SiloKrate Logistics • Enterprise Command Center
            </p>
        </div>
    );
};

export default SetupPassword;