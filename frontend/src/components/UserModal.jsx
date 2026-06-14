import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import CustomSelect from './CustomSelect';

export default function UserModal({ isOpen, onCloseAction, initialData = null }) {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const editMode = Boolean(initialData);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                fullName: initialData.FullName || '',
                email: initialData.Email || '',
                role: initialData.Role || ''
            });
        } else {
            setFormData({ fullName: '', email: '', role: '' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        const payload = {
            fullName: formData.fullName,
            email: formData.email,
            role: formData.role
        };

        try {
            const endpoint = editMode 
                ? `http://${import.meta.env.VITE_SERVER_URL}/api/updateUser/${initialData.UserId}` 
                : `http://${import.meta.env.VITE_SERVER_URL}/api/signup`;
            
            const method = editMode ? 'PUT' : 'POST';
            
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            if (response.status === 401) {
                alert("Your session has expired. Please log in again.");
                localStorage.removeItem('SiloKrate_user_role');
                localStorage.removeItem('SiloKrate_expires_at');
                window.location.href = '/login';
                return; 
            }

            else if (response.status === 403) {
                window.location.href = '/unauthorized';
                return;
            }

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onCloseAction();
                    setStatus('idle');
                }, 1500);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Operation failed');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.message);
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-[#0F1219] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#161A22]">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">{editMode ? "Edit Access" : "Grant Access"}</h2>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">SiloKrate Security Protocol</p>
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
                    
                    {/* Error State */}
                    {status === 'error' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg flex items-center gap-3">
                            <AlertCircle className="text-rose-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-rose-200">{errorMessage}</p>
                        </div>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-3">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-emerald-200">{editMode ? "User updated successfully!" : "User invited successfully!"}</p>
                        </div>
                    )}

                    {/* Form Fields */}
                    {status !== 'success' && (
                        <>
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                    <User size={12} className="text-emerald-500" /> Full Name
                                </label>
                                <input 
                                    name="fullName" 
                                    value={formData.fullName}
                                    onChange={handleChange} 
                                    className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                    placeholder="e.g. Sarah Chen" 
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                    <Mail size={12} className="text-emerald-500" /> Email Address
                                </label>
                                <input 
                                    name="email" 
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange} 
                                    className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                    placeholder="sarah@SiloKrate.logistics" 
                                    required
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                    <Shield size={12} className="text-emerald-500" /> Security Clearance (Role)
                                </label>
                                
                                <CustomSelect
                                    //Convert the backend value back to a pretty label for the UI
                                    value={
                                        formData.role === 'system_admin' ? 'System Admin' :
                                        formData.role === 'inventory_manager' ? 'Inventory Manager' :
                                        formData.role === 'inventory_staff' ? 'Inventory Staff' :
                                        formData.role === 'logistics_manager' ? 'Logistics Manager' :
                                        formData.role === 'warehouse_manager' ? 'Warehouse Manager' :
                                        formData.role === 'warehouse_staff' ? 'Warehouse Staff' :
                                        'Select Role'
                                    }
                                    //Map the selected pretty string back to the exact database string
                                    onChange={(selectedValue) => {
                                        const roleMap = {
                                            'System Admin': 'system_admin',
                                            'Inventory Manager': 'inventory_manager',
                                            'Inventory Staff': 'inventory_staff',
                                            'Logistics Manager': 'logistics_manager',
                                            'Warehouse Manager': 'warehouse_manager',
                                            'Warehouse Staff': 'warehouse_staff'
                                        };
                                        
                                        setFormData({ 
                                            ...formData, 
                                            role: roleMap[selectedValue] || '' 
                                        });
                                    }}
                                    options={[
                                        'System Admin', 
                                        'Inventory Manager', 
                                        'Inventory Staff',
                                        'Logistics Manager', 
                                        'Warehouse Manager',
                                        'Warehouse Staff'
                                    ]}
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div className="pt-2 flex gap-3 border-t border-zinc-800/50 mt-4">
                                <button 
                                    type="button" 
                                    onClick={onCloseAction} 
                                    disabled={status === 'loading'} 
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-800 text-zinc-400 text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                >
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
                                    ) : editMode ? "Update Access" : "Grant Access"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}