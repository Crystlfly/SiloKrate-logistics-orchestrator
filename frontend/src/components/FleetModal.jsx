import {useState, useEffect} from 'react';
import { X, AlertCircle, Truck, User, Building2, Activity, MapPin, Fuel, Gauge, TrendingUp, Loader2 } from 'lucide-react';

export default function FleetModal({isOpen, onCloseAction, initialToBeUpdatedData = null}) {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const editMode = Boolean(initialToBeUpdatedData);
    
    const [formData, setFormData] = useState({
        driverName: '',
        vehicleType: '',
        status: '',
        currentWarehouseId: '',
        fuelLevel: '',
        progress: '',
        currentRoute: '',
        odometer: ''
    });

    useEffect(()=>{
        if (initialToBeUpdatedData) {
            setFormData({
                driverName: initialToBeUpdatedData.driver_name || '',
                vehicleType: initialToBeUpdatedData.vehicle_type || '',
                status: initialToBeUpdatedData.status || '',
                currentWarehouseId: initialToBeUpdatedData.current_warehouse_id || '',
                fuelLevel: initialToBeUpdatedData.fuel_level || '',
                progress: initialToBeUpdatedData.progress || '',
                currentRoute: initialToBeUpdatedData.current_route || '',
                odometer: initialToBeUpdatedData.odometer || ''
            });
        }
        else{
            setFormData({
                driverName: '',
                vehicleType: '',
                status: '',
                currentWarehouseId: '',
                fuelLevel: '',
                progress: '',
                currentRoute: '',
                odometer: ''
            });
        }
    }, [initialToBeUpdatedData, isOpen]);

    
    
    if (!isOpen) return null;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');
    

        const payload = {
            ...formData,
            // Convert "105" string to 105 integer. If empty, send null.
            currentWarehouseId: formData.currentWarehouseId ? parseInt(formData.currentWarehouseId) : null,
            
            // Convert metrics to integers, default to 0 if empty
            fuelLevel: parseInt(formData.fuelLevel) || 0,
            progress: parseInt(formData.progress) || 0,
            odometer: parseInt(formData.odometer) || 0,
        };

        try {
            const endpoint = editMode ? `${import.meta.env.VITE_SERVER_URL}/api/updateFleet/${initialToBeUpdatedData.vehicle_id}` : `${import.meta.env.VITE_SERVER_URL}/api/addFleet`;
            const method = editMode ? 'PUT' : 'POST';
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to add vehicle');
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
                        <h2 className="text-lg font-bold text-white tracking-tight">{editMode ? "Update Vehicle" : "Add New Vehicle"}</h2>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">SiloKrate Fleet Protocol</p>
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
                            <Truck className="text-emerald-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-emerald-200">Vehicle {editMode ? 'updated' : 'added'} successfully!</p>
                        </div>
                    )}

                    {/* Form Fields */}
                    {status !== 'success' && (
                        <>
                            {/* --- 1. Driver & Vehicle Type --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <User size={12} className="text-emerald-500" /> Driver Name
                                    </label>
                                    <input 
                                        name="driverName" 
                                        value={formData.driverName}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="e.g. John Doe" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Truck size={12} className="text-emerald-500" /> Vehicle Type
                                    </label>
                                    <select 
                                        name="vehicleType" 
                                        value={formData.vehicleType}
                                        onChange={handleChange}
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select Type</option>
                                        <option value="Heavy Truck">Heavy Truck</option>
                                        <option value="Van">Delivery Van</option>
                                        <option value="Drone">Drone</option>
                                        <option value="Freight">Freight Ship</option>
                                    </select>
                                </div>
                            </div>

                            {/* --- 2. Warehouse & Status --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Building2 size={12} className="text-emerald-500" /> Current Warehouse ID
                                    </label>
                                    <input 
                                        name="currentWarehouseId" 
                                        value={formData.currentWarehouseId}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="e.g. WH-104" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Activity size={12} className="text-emerald-500" /> Fleet Status
                                    </label>
                                    <select 
                                        name="status" 
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select Status</option>
                                        <option value="In Transit">In Transit</option>
                                        <option value="Idle">Idle / Parked</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                            </div>

                            {/* --- 3. Route Info --- */}
                            <div className="grid grid-cols-3 gap-4 mb-2">
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <MapPin size={12} className="text-emerald-500" /> Current Route
                                    </label>
                                    <input 
                                        name="currentRoute" 
                                        value={formData.currentRoute}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="e.g. NYC Distribution -> Boston Hub" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <TrendingUp size={12} className="text-emerald-500" /> Progress (%)
                                    </label>
                                    <input 
                                        name="progress" 
                                        type="number"
                                        min="0" max="100"
                                        value={formData.progress}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="0" 
                                    />
                                </div>
                            </div>

                            {/* --- 4. Vehicle Metrics (Fuel & Odometer) --- */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Fuel size={12} className="text-emerald-500" /> Fuel Level (%)
                                    </label>
                                    <input 
                                        name="fuelLevel" 
                                        type="number" 
                                        min="0" max="100"
                                        value={formData.fuelLevel}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="100" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Gauge size={12} className="text-emerald-500" /> Odometer (km)
                                    </label>
                                    <input 
                                        name="odometer" 
                                        type="number" 
                                        value={formData.odometer}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="0" 
                                    />
                                </div>
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
                                            {editMode ? "Updating Vehicle..." : "Adding Vehicle..."}
                                        </>
                                    ) : <span className="uppercase tracking-tight">Confirm {editMode ? "Update" : "Addition"}</span>}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}