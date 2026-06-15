import React, { useState, useEffect, use } from 'react';
import { X, Package, AlertCircle, Building2, Tag, MapPin, DollarSign, Users, Box, Activity, Loader2 } from "lucide-react";
export default function WarehouseModal({ isOpen, onCloseAction, initialToBeUpdatedData }) {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const editMode = Boolean(initialToBeUpdatedData);

    const [formData, setFormData] = useState({
        name: '',
        latitude: '',
        longitude: '',
        operating_cost: '',
        warehouse_type: '',
        total_capacity: '',
        used_capacity: '',
        total_staff: '',
        status: ''
    });

    useEffect(() => {
        if (initialToBeUpdatedData) {
            setFormData({
                name: initialToBeUpdatedData.name || '',
                latitude: initialToBeUpdatedData.lat || '',
                longitude: initialToBeUpdatedData.long || '',
                operating_cost: initialToBeUpdatedData.cost || '',
                total_capacity: initialToBeUpdatedData.totalCap || '',
                used_capacity: initialToBeUpdatedData.usedCap || '',
                total_staff: initialToBeUpdatedData.staff || '',
                status: initialToBeUpdatedData.status || ''
            });
        }
        else{
            setFormData({
                name: '',
                latitude: '',
                longitude: '',
                operating_cost: '',
                warehouse_type: '',
                total_capacity: '',
                used_capacity: '',
                total_staff: '',
                status: ''
            });
        }
    }, [initialToBeUpdatedData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');
        try{
            const payload = {
                name: formData.name,
                lat: parseFloat(formData.latitude),
                long: parseFloat(formData.longitude),
                operating_cost: parseFloat(formData.operating_cost),
                warehouse_type: formData.warehouse_type,
                total_capacity: parseFloat(formData.total_capacity),
                used_capacity: parseFloat(formData.used_capacity),
                total_staff: parseInt(formData.total_staff),
                status: formData.status
            };

            const endpoint = editMode ? `${import.meta.env.VITE_SERVER_URL}/api/updateWarehouse/${initialToBeUpdatedData.warehouse_id}` : `${import.meta.env.VITE_SERVER_URL}/api/addWarehouse`;
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
                }, 2000);
            } 
            else {
                const errorData = await response.json();
                throw new Error(errorData.message || (editMode ? 'Failed to update warehouse' : 'Failed to create warehouse'));
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
            <div className="bg-[#0F1219] border border-zinc-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#161A22]">
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">{editMode ? "Update Facility" : "Add Facility"}</h2>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">SiloKrate Logistics Protocol</p>
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
                            <p className="text-xs font-bold text-emerald-200">{editMode ? "Warehouse updated successfully!" : "Warehouse added successfully!"}</p>
                        </div>
                    )}

                    {status !== 'success' && (
                        <>
                        {/* --- 1. Facility Name & Type --- */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <Building2 size={12} className="text-emerald-500" /> Facility Name
        </label>
        <input 
            name="name" 
            value={formData.name}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="e.g. North Dakota Fulfillment Center" 
        />
    </div>
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <Tag size={12} className="text-emerald-500" /> Type
        </label>
        <select 
            name="warehouse_type" 
            value={formData.warehouse_type}
            onChange={handleChange}
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
        >
            <option value="" disabled>Select Type</option>
            <option value="Distribution Center">Distribution Center</option>
            <option value="Fulfillment Center">Fulfillment Center</option>
        </select>
    </div>
</div>

{/* --- 2. Location (Lat/Long) --- */}
<div className="grid grid-cols-2 gap-4 mb-4">
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <MapPin size={12} className="text-emerald-500" /> Latitude
        </label>
        <input 
            name="latitude" 
            type="number" 
            step="any"
            value={formData.latitude}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="e.g. 40.7128" 
        />
    </div>
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <MapPin size={12} className="text-emerald-500" /> Longitude
        </label>
        <input 
            name="longitude" 
            type="number" 
            step="any"
            value={formData.longitude}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="e.g. -74.0060" 
        />
    </div>
</div>

{/* --- 3. Operations (Cost & Staff) --- */}
<div className="grid grid-cols-2 gap-4 mb-4">
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <DollarSign size={12} className="text-emerald-500" /> Daily Ops Cost
        </label>
        <input 
            name="operating_cost" 
            type="number" 
            value={formData.operating_cost}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="0.00" 
        />
    </div>
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <Users size={12} className="text-emerald-500" /> Total Staff
        </label>
        <input 
            name="total_staff" 
            type="number" 
            value={formData.total_staff}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="0" 
        />
    </div>
</div>

{/* --- 4. Capacity --- */}
<div className="grid grid-cols-2 gap-4 mb-4">
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <Box size={12} className="text-emerald-500" /> Total Capacity (sqft)
        </label>
        <input 
            name="total_capacity" 
            type="number" 
            value={formData.total_capacity}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="e.g. 50000" 
        />
    </div>
    <div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            <Package size={12} className="text-emerald-500" /> Used Capacity (sqft)
        </label>
        <input 
            name="used_capacity" 
            type="number" 
            value={formData.used_capacity}
            onChange={handleChange} 
            className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
            placeholder="0" 
        />
    </div>
</div>

{/* --- 5. Status --- */}
<div className="mb-6">
    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
        <Activity size={12} className="text-emerald-500" /> Operational Status
    </label>
    <select 
        name="status" 
        value={formData.status}
        onChange={handleChange}
        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
    >
        <option value="" disabled>Select Status</option>
        <option value="Active">Active</option>
        <option value="Maintenance">Maintenance</option>
        <option value="Inactive">Inactive</option>
    </select>
</div>

{/* --- Footer Buttons --- */}
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
                {editMode ? "Updating..." : "Creating..."}
            </>
        ) : editMode ? "Update Facility" : "Create Facility"}
    </button>
</div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}