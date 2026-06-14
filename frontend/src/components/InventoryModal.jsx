import {useState, useEffect} from 'react';
import { X, Package, AlertCircle, Loader2, Barcode, Tag, Activity, Box, TrendingDown, DollarSign } from 'lucide-react';

export default function InventoryModal({isOpen, onCloseAction, initialToBeUpdatedData = null}) {
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const editMode = Boolean(initialToBeUpdatedData);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        reorderLevel: '',
        currentStock: '',
        unitPrice: '',
        category: '',
        status: '',
        volume:''
    });

    
    useEffect(() => {
        if (initialToBeUpdatedData) {
            setFormData({
                name: initialToBeUpdatedData.name || '',
                sku: initialToBeUpdatedData.sku || '',
                reorderLevel: initialToBeUpdatedData.reorder_level || '',
                currentStock: initialToBeUpdatedData.current_stock || '',
                unitPrice: initialToBeUpdatedData.unit_price || '',
                category: initialToBeUpdatedData.category || '',
                status: initialToBeUpdatedData.status || '',
                volume: initialToBeUpdatedData.volume || ''
            });
        }
        else{
            setFormData({
                name: '',
                sku: '',
                reorderLevel: '',
                currentStock: '',
                unitPrice: '',
                category: '',
                status: '',
                volume: ''
            });
        }
    }, [initialToBeUpdatedData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        const payload = {
            name: formData.name,
            sku: formData.sku,
            category: formData.category,
            status: formData.status,
            volume: formData.volume,
            currentStock: formData.currentStock,
            reorderLevel: formData.reorderLevel,
            unitPrice: formData.unitPrice,


            
            reorder_level: parseInt(formData.reorderLevel) || 0,
            current_stock: parseInt(formData.currentStock) || 0,
            unit_price: parseFloat(formData.unitPrice) || 0.00
        };

        try{
            const endpoint = editMode ? `http://${import.meta.env.VITE_SERVER_URL}/api/updateProduct/${initialToBeUpdatedData.product_id}` : `http://${import.meta.env.VITE_SERVER_URL}/api/addProduct`;
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
                throw new Error(errorData.message || (editMode ? 'Failed to update SKU' : 'Failed to add SKU'));
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
                        <h2 className="text-lg font-bold text-white tracking-tight">{editMode ? "Update SKU" : "Add New SKU"}</h2>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">SiloKrate Inventory Protocol</p>
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
                            <Package className="text-emerald-500 shrink-0" size={18} />
                            <p className="text-xs font-bold text-emerald-200">{editMode ? "SKU updated successfully!" : "SKU added to inventory successfully!"}</p>
                        </div>
                    )}

                    {/* Form Fields */}
                    {status !== 'success' && (
                        <>
                            {/* --- 1. Product Name & SKU --- */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Package size={12} className="text-emerald-500" /> Product Name
                                    </label>
                                    <input 
                                        name="name" 
                                        value={formData.name}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="e.g. Industrial Sensor X1" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Barcode size={12} className="text-emerald-500" /> SKU
                                    </label>
                                    <input 
                                        name="sku" 
                                        value={formData.sku}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="SKU-001" 
                                    />
                                </div>
                            </div>

                            {/* --- 2. Category & Status & volume --- */}
                            <div className="grid grid-cols-3 gap-4 mb-2">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Tag size={12} className="text-emerald-500" /> Category
                                    </label>
                                    <select 
                                        name="category" 
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Industrial">Industrial</option>
                                        <option value="Raw Material">Raw Material</option>
                                        <option value="Packaging">Packaging</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Activity size={12} className="text-emerald-500" /> Stock Status
                                    </label>
                                    <select 
                                        name="status" 
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select Status</option>
                                        <option value="In-Stock">In Stock</option>
                                        <option value="Low Stock">Low Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                        <option value="Discontinued">Discontinued</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Box size={12} className="text-emerald-500" /> Volume per item
                                    </label>
                                    <input 
                                        name="volume" 
                                        type="number"
                                        value={formData.volume}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="5 sqft" 
                                    />
                                </div>
                            </div>

                            {/* --- 3. Inventory Numbers (Stock, Reorder, Price) --- */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <Box size={12} className="text-emerald-500" /> Current Stock
                                    </label>
                                    <input 
                                        name="currentStock" 
                                        type="number"
                                        value={formData.currentStock}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="0" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <TrendingDown size={12} className="text-emerald-500" /> Reorder Lvl
                                    </label>
                                    <input 
                                        name="reorderLevel" 
                                        type="number"
                                        value={formData.reorderLevel}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="10" 
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
                                        <DollarSign size={12} className="text-emerald-500" /> Unit Price
                                    </label>
                                    <input 
                                        name="unitPrice" 
                                        type="number"
                                        step="0.01"
                                        value={formData.unitPrice}
                                        onChange={handleChange} 
                                        className="w-full bg-[#07090D] border border-zinc-800 rounded-lg py-2 px-3 text-sm text-zinc-200 focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-700" 
                                        placeholder="0.00" 
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
                                            {editMode ? "Updating SKU..." : "Adding SKU..."}
                                        </>
                                    ) : editMode ? "Update SKU" : "Add to Inventory"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}