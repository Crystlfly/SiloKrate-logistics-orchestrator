import React, { useState } from 'react';
import { X, Package, Hash, Calendar, MapPin, ShieldAlert, Loader2, AlertCircle } from "lucide-react";

export default function OrderModal({ isOpen, onCloseAction }) {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');
    
    const [formData, setFormData] = useState({
        itemid: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        priorityLvl: 'Normal', // Added back to state
        dest: '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (response.status === 401) {
                alert("Your session has expired. Please log in again.");
                localStorage.removeItem('nexus_user_role');
                localStorage.removeItem('nexus_expires_at');
                window.location.href = '/login';
                return; 
            }

            else if (response.status === 403) {
                window.location.href = '/unauthorized';
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onCloseAction();
                    setStatus('idle');
                }, 1500);
            } else {
                setStatus('error');
                setErrorMessage(data.message || 'Protocol Error: Order rejected by Nexus Core.');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Network Error: Could not connect to Command Center.');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-[#0F1219] border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#161A22]">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Create New Order</h2>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Nexus Logistics Protocol</p>
                    </div>
                    <button 
                        disabled={status === 'loading'} 
                        onClick={onCloseAction} 
                        className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all disabled:opacity-30"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                    
                    {status === 'error' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-3">
                            <AlertCircle className="text-rose-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-rose-200">{errorMessage}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-3">
                            <Package className="text-emerald-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-emerald-200">Order successfully dispatched.</p>
                        </div>
                    )}

                    {status !== 'success' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5"><Package size={12} className="text-emerald-500" /> Item ID</label>
                                    <input name="itemid" type="text" required onChange={handleChange} className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all" placeholder="SKU-9921" />
                                </div>
                                {/* <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5"><Warehouse size={12} className="text-emerald-500" /> Warehouse ID</label>
                                    <input name="warehouseId" type="text" required onChange={handleChange} className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all" placeholder="WH-NORTH-01" />
                                </div> */}
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5"><Calendar size={12} className="text-emerald-500" /> Required Date</label>
                                    <input name="date" type="date" value={formData.date} onChange={handleChange} className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all color-scheme-dark" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5"><Hash size={12} className="text-emerald-500" /> Quantity</label>
                                    <input name="quantity" type="number" required onChange={handleChange} className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all" placeholder="0" />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <ShieldAlert size={12} className="text-emerald-500" /> Priority Level
                                    </label>
                                    <select 
                                        name="priorityLvl" 
                                        value={formData.priorityLvl} 
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Low">Low (Standard)</option>
                                        <option value="Normal">Normal</option>
                                        <option value="High">High (Express)</option>
                                        
                                    </select>
                                </div>
                            </div>
                           

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5"><MapPin size={12} className="text-emerald-500" /> Shipping Destination</label>
                                <textarea name="dest" rows="2" required onChange={handleChange} className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all resize-none" placeholder="Enter full facility address..."></textarea>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={onCloseAction} disabled={status === 'loading'} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={status === 'loading'}
                                    className="flex-[2] px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all uppercase tracking-tight flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : 'Confirm Dispatch'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}