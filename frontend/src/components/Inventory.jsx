import { Package, TrendingDown, TrendingUp, AlertCircle, Search, Download, Plus, Loader2, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import InventoryModal from './InventoryModal';
import csvDownloadHelper from './csvDownloadHelper'
import CustomSelect from './CustomSelect'; 

const Inventory = () => {
  const userRole = (localStorage.getItem('nexus_user_role'));
  const [inventoryData, setInventoryData] = useState([]);
  const [stats, setStats] = useState({ total: 0, low: 0, over: 0, out: 0 }); 
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage);
  const [totalPages, setTotalPages] = useState(1); 
  const [totalItems, setTotalItems] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [openMenuId, setOpenMenuId] = useState(null);
  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

  const itemsPerPage = 10;

  const fetchInventory = async () => {
    try {
      // Create Query String with Page + Filters
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        category: categoryFilter !== "All Categories" ? categoryFilter : "",
        status: statusFilter !== "All Statuses" ? statusFilter : ""
      });

      const response = await fetch(`http://localhost:3000/api/inventory?${params}`,{
        headers: {
          'Content-Type': 'application/json' 
        },
        credentials: 'include'
      });
      const data = await response.json();
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

      if (data.status === 200) {
        setInventoryData(data.data); // This is now ONLY the 10 items
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
   
        if(data.stats) setStats(data.stats); 
      }
    } catch (err) {
      console.error("Inventory API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1 && (searchQuery || categoryFilter !== "All Categories" || statusFilter !== "All Statuses")) {
          setCurrentPage(1);
      } else {
          fetchInventory();
      }
    }, 500);

    return () => clearTimeout(timer); 
  }, [currentPage, searchQuery, categoryFilter, statusFilter]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  useEffect(() => {
    setPageInput(currentPage);
  }, [currentPage]);
  useEffect(() => {
    const timer = setTimeout(() => {
      let value = parseInt(pageInput);
  
      if (isNaN(value)) return;
      if (value < 1) value = 1;
      if (value > totalPages) value = totalPages;
  
      if (value !== currentPage) {
        setCurrentPage(value);
      }
    }, 800); // debounce delay
  
    return () => clearTimeout(timer);
  }, [pageInput]);
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      let value = parseInt(pageInput);
  
      if (!value) value = 1;
      if (value < 1) value = 1;
      if (value > totalPages) value = totalPages;
  
      setCurrentPage(value);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this SKU?")) {
      try {
        const response = await fetch(`http://localhost:3000/api/deleteProduct/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
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

        if (response.ok) {
          fetchInventory(); // Refresh list after deletion
        } else {
          const errorData = await response.json();
          console.error("Delete Failed:", errorData);
          alert(`Error: ${errorData.error || 'Failed to delete'}`);
        }
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  const handleUpdate = (item) => {
    setSelectedItem(item); 
    setIsOpen(true); 
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedItem(null); 
    fetchInventory();    
  };

  const handleExport=async ()=>{
    const header=["Name","SKU","reorder_level","current_stock","unit_price","Category","Status"];
    try{
      const params = new URLSearchParams({
      page: 1,
      limit: 100000,
      search: searchQuery,
      category: categoryFilter !== "All Categories" ? categoryFilter : "",
      status: statusFilter !== "All Statuses" ? statusFilter : ""
    });

      const response = await fetch(`http://localhost:3000/api/inventory?${params}`,{
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const result=await response.json();
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
      
      if(result.status==200){
        const data=result.data;
        const rows = data.map(item => [
          `"${item.name}"`,
          item.sku,
          item.reorder_level,
          item.current_stock,
          item.unit_price,
          item.category,
          item.status
        ]);
        csvDownloadHelper(header, rows);
      }

    }catch(err){
      console.error("Error in downloading:", err);
    }
  }

  useEffect(() => {
    toggleMenu();
  }, []);

  if (isLoading && currentPage === 1 && inventoryData.length === 0) {
    return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center 
    text-zinc-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  }
  return (
    <div className="animate-in fade-in duration-500">
      <header className="my-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inventory Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor and optimize stock levels across warehouses</p>
        </div>
        <div className="flex gap-3">
          <button 
          onClick={()=>handleExport()}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <Download size={16} /> Export Report
          </button>
          {(userRole === 'system_admin' || userRole === 'inventory_manager') &&(
            <button 
            onClick={()=>setIsOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Plus size={16} /> Add New SKU
            </button>
          )}
        </div>
      </header>

      <InventoryModal isOpen={isOpen} onCloseAction={handleCloseModal} initialToBeUpdatedData={selectedItem}/> 

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <InvStatCard icon={<Package />} label="Total SKUs" value={totalItems} trend="+124" color="emerald" />
        <InvStatCard icon={<TrendingDown />} label="Low Stock Items" value={stats.low} trend="+23" color="rose" />
        <InvStatCard icon={<TrendingUp />} label="Overstocked" value={stats.over} trend="-12" color="emerald" />
        <InvStatCard icon={<AlertCircle />} label="Out of Stock" value={stats.out} trend="-8" color="rose" />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 bg-[#0F1219] p-4 rounded-xl border border-zinc-800 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, product name, or category..." 
            className="w-full bg-[#0B0E14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <CustomSelect 
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            'All Categories', 'Electronics', 'Furniture', 'Apparel', 
            'Pharmaceuticals', 'Food & Bev', 'Biologics', 
            'Enterprise Hardware', 'Data Storage', 'Secure Documents'
          ]}
        />
        <CustomSelect 
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            'All Statuses', 'In-Stock', 'Low Stock', 'Out of Stock'
          ]}
        />
      </div>

      {/* Inventory Table */}
      <div className="bg-[#0F1219] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-white font-bold text-sm">Inventory Levels</h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">9 items shown</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase font-black text-zinc-500 tracking-wider border-b border-zinc-800 bg-[#161a23]">
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Warehouse ID</th>
              <th className="px-6 py-4">Zone ID</th>
              <th className="px-6 py-4">Current / Optimal</th>
              <th className="px-6 py-4">Stock Level</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">

            {inventoryData.map((item) => (
              <InventoryRow 
                key={item.product_id}
                item={item}
                isOpen={openMenuId === item.product_id}
                onToggle={() => toggleMenu(item.product_id)}
                onDelete={() => handleDelete(item.product_id)}
                onUpdate={handleUpdate}
              />
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-white/[0.02]">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1 || isLoading}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <span className="text-xs text-zinc-500 font-medium flex items-center gap-2">
            Page
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-12 text-center bg-[#0F1219] border border-zinc-800 rounded px-2 py-1 text-white focus:border-emerald-500/50 outline-none"
            />
              of {totalPages}
          </span> 

          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
            className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const InvStatCard = ({ icon, label, value, trend, color }) => (
  <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl group hover:border-zinc-700 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>
    </div>
    <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">{label}</p>
    <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">{value}</h3>
  </div>
);

const InventoryRow = ({ item, isOpen, onToggle, onDelete, onUpdate }) => {
  const userRole = (localStorage.getItem('nexus_user_role'));
  const { product_id, sku, name, category, current_stock, reorder_level, status, unit_price, warehouse_id, zone_id } = item;

  const val = `$${(unit_price || 0).toLocaleString()}`;
  
  const percent = Math.min((current_stock / reorder_level) * 100, 100);
  const getStatusColor = (s) => {
    if (s === 'Out of Stock') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (s === 'Low Stock') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
  <tr className="hover:bg-white/[0.02] transition-colors group">
    <td className="px-6 py-4 text-xs font-mono font-bold text-emerald-500/80">{sku}</td>
    <td className="px-6 py-4 text-xs font-bold text-white">{name}</td>
    <td className="px-6 py-4 text-[11px] text-zinc-500">{category}</td>
    <td className="px-6 py-4 text-[11px] text-zinc-400 font-medium">{warehouse_id}</td>
    <td className="px-6 py-4 text-[11px] text-zinc-400 font-medium">{zone_id}</td>
    <td className="px-6 py-4 text-xs font-bold text-zinc-300">
      {current_stock} <span className="text-zinc-600 font-normal">/ {reorder_level}</span>
    </td>
    <td className="px-6 py-4 min-w-[120px]">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-zinc-500 w-6">{Math.round(percent)}%</span>
        <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ${percent < 25 ? 'bg-rose-500' : percent < 50 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(status)}`}>
        {status}
      </span>
    </td>
    
    <td className="px-6 py-4 text-right relative"> {/* relative is important here */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-xs font-bold text-white">{val}</span>
        
        <div className="relative">
          <button 
            onClick={() => onToggle(product_id)} 
            className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>

          {/* The Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => onUpdate(item)}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
              >
                <Edit size={14} /> Update
              </button>
              {userRole === 'system_admin' && (
              <button 
                onClick={() => onDelete(product_id)}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
              )}
            </div>
          )}
        </div>
      </div>
    </td>
  </tr>
);
};

export default Inventory;