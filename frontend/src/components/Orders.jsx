import React, { useState, useEffect, useMemo} from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  Search,
  Download,
  Eye,
  Box,
  User,
  MapPin,
  X,
  FileText,
  Truck,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import CustomSelect from './CustomSelect'; 

export default function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rawOrdersData, setRawOrdersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage);
  const [totalPages, setTotalPages] = useState(1); 
  const [searchQueryOrder, setSearchQueryOrder] = useState("");
  const [statusFilterOrder, setStatusFilterOrder] = useState("All Statuses");
  const [priorityFilterOrder, setPriorityFilterOrder] = useState("All Priorities");
  const itemsPerPage = 10;

  useEffect(()=>{
    const fetchOrders = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQueryOrder,
          status: statusFilterOrder === "All Statuses" ? "" : statusFilterOrder,
          priority: priorityFilterOrder === "All Priorities"?"" : priorityFilterOrder=== "Low" ? 1 : priorityFilterOrder === "Normal" ? 2 : 3
        });

        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/orders?${params}`,{
          headers: { 
            'Content-Type': 'application/json'
          },
          credentials: 'include'
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
        if(!response.ok){
          setRawOrdersData([]);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data= await response.json();

        setRawOrdersData(data?.data || []);
        setTotalPages(data?.pagination.totalPages || 0);

      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setRawOrdersData([]);
      }finally {
      setIsLoading(false);
    }
    }
    const timer = setTimeout(() => {
        fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  },[currentPage, searchQueryOrder, statusFilterOrder, priorityFilterOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQueryOrder, statusFilterOrder, priorityFilterOrder]);

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
   
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newStatus })
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
        setRawOrdersData(prevData => 
          prevData.map(order => 
            order.order_id === orderId ? { ...order, order_status: newStatus } : order
          )
        );
        
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder(prev => ({ ...prev, order_status: newStatus }));
        }
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };


  // Helper function to format priority tags matching 
  const getPriorityBadge = (level) => {
    switch(level) {
      case 1: return <span className="bg-rose-500/10 text-rose-500 px-2 py-1 rounded text-[10px] font-bold border border-rose-500/20 uppercase tracking-widest">Low</span>;
      case 2: return <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-[10px] font-bold border border-orange-500/20 uppercase tracking-widest">Normal</span>;
      case 3: return <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">High</span>;
      default: return <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-[10px] font-bold border border-zinc-700 uppercase tracking-widest">Unset</span>;
    }
  };

  // Helper function to format status tags matching Logistics logic
  const getStatusBadge = (status) => {
    let color = '';
    if (status === 'Pending' ) {
      color = 'text-orange-500 bg-orange-500/10 border-orange-500';
    } else if (status === 'Packed') {
      color = 'text-purple-500 bg-purple-500/10 border-purple-500';
    } else if (status === 'shipped' || status === 'dispatched') {
      color = 'text-blue-500 bg-blue-500/10 border-blue-500';
    } else if (status === 'delivered') {
      color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500';
    } else {
      color = 'text-zinc-500 bg-zinc-500/10 border-zinc-500';
    }
    return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current ${color}`}>{status}</span>;
  };

  //DYNAMIC KPI CALCULATIONS
  const stats = useMemo(() => {
    if (!rawOrdersData || rawOrdersData.length === 0) {
      return { total: 0, pending: 0, delivered: 0, deliveredPercent: 0, revenue: "$0" };
    }

    let pending = 0;
    let delivered = 0;
    let rawRevenue = 0;

    rawOrdersData.forEach(order => {
      // 1. Count Statuses
      const status = order.order_status?.toLowerCase();
      if (status === 'pending') pending++;
      if (status === 'delivered') delivered++;

      // 2. Parse Revenue (handles strings like "$24,500" or raw numbers)
      // Check both TotalValue and value depending on what DB returns
      let val = order.TotalValue || order.value || 0; 
      if (typeof val === 'string') {
        val = Number(val.replace(/[^0-9.-]+/g, ""));
      }
      rawRevenue += (val || 0);
    });

    // 3. Calculate Percentages & Formatting
    const deliveredPercent = Math.round((delivered / rawOrdersData.length) * 100);
    
    // Format Revenue nicely (e.g. $24.5K or $1.2M)
    let formattedRevenue = `$${rawRevenue.toLocaleString()}`;
    if (rawRevenue >= 1000000) {
      formattedRevenue = `$${(rawRevenue / 1000000).toFixed(1)}M`;
    } else if (rawRevenue >= 1000) {
      formattedRevenue = `$${(rawRevenue / 1000).toFixed(1)}K`;
    }

    return {
      total: rawOrdersData.length,
      pending,
      delivered,
      deliveredPercent,
      revenue: formattedRevenue
    };
  }, [rawOrdersData]);

  if (isLoading && currentPage === 1 && rawOrdersData.length === 0) {
    return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center 
    text-zinc-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <header className="my-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Order Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Track and manage all customer orders across the supply chain</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-transparent border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <Download size={16} /> Export Orders
          </button>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <ShoppingCart size={16} /> New Order
          </button>
        </div>
      </header>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500">
              <ShoppingCart size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500">Active</span>
          </div>
          <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">Total Orders</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.total}</h3>
            <span className="text-[10px] text-zinc-600 font-bold mb-1">On this page</span>
          </div>
        </div>

        {/* Pending Processing */}
        <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-500">
              <Clock size={20} />
            </div>
            <span className={`text-[10px] font-bold ${stats.pending > 0 ? 'text-orange-500' : 'text-zinc-500'}`}>
              {stats.pending > 0 ? `${stats.pending} active` : 'All clear'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">Pending Processing</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.pending}</h3>
            <span className="text-[10px] text-zinc-600 font-bold mb-1">Requires attention</span>
          </div>
        </div>

        {/* Successfully Delivered */}
        <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <CheckCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500">{stats.deliveredPercent}%</span>
          </div>
          <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">Successfully Delivered</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.delivered}</h3>
            <span className="text-[10px] text-zinc-600 font-bold mb-1">Completed</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500">Value</span>
          </div>
          <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">Total Revenue</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.revenue}</h3>
            <span className="text-[10px] text-zinc-600 font-bold mb-1">From active list</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 bg-[#0F1219] p-4 rounded-xl border border-zinc-800">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Search size={16} /></span>
          <input 
            type="text" 
            value={searchQueryOrder}
            onChange={(e) => setSearchQueryOrder(e.target.value)}
            placeholder="Search by order ID, customer, or product..." 
            className="w-full bg-[#0B0E14] border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <CustomSelect 
          value={statusFilterOrder}
          onChange={setStatusFilterOrder}
          options={[
            'All Statuses', 'Pending', 'Packed', 'In Transit', 'Delivered'
          ]}
        />
        <CustomSelect 
          value={priorityFilterOrder}
          onChange={setPriorityFilterOrder}
          options={[
            'All Priorities', 'Low', 'Normal', 'High'
          ]}
        />
        <button className="bg-[#0B0E14] border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300 outline-none hover:bg-zinc-800 transition-colors">
          Date Range
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0F1219] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#0F1219]">
          <h3 className="text-white font-bold text-sm">All Orders</h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{rawOrdersData.length} Orders</span>
        </div>
        
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#0B0E14] border-b border-zinc-800">
              <tr>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Order ID</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Customer</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Product</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Destination</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Qty</th>
                {/* <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Value</th> */}
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Priority</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Status</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Date/Time</th>
                <th className="p-4 text-[10px] text-zinc-500 font-bold uppercase tracking-tight text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-[#0F1219]">
              {rawOrdersData?.map((order) => (
                <tr key={order.order_id} className="hover:bg-white/[0.02] transition">
                  <td className="p-4 text-emerald-500 font-mono text-sm font-bold">ORD-{order.order_id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <User size={12} />
                      </div>
                      <span className="text-white text-xs font-medium">{order.customer_name || 'Unknown Customer'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-300 text-xs">{order.ProductName}</td>
                  <td className="p-4 text-zinc-400 text-xs flex items-center gap-1"><MapPin size={12} /> {order.destination_address}</td>
                  <td className="p-4 text-white text-xs font-bold">{order.quantity}</td>
                  {/* <td className="p-4 text-emerald-500 text-xs font-bold">{order.value}</td> */}
                  <td className="p-4">{getPriorityBadge(order.priority_level)}</td>
                  <td className="p-4">{getStatusBadge(order.order_status)}</td>
                  <td className="p-4">
                    <p className="text-[11px] font-bold text-zinc-300">{new Date(order.order_date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{new Date(order.order_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="p-4 flex gap-2 justify-center">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    
                    {/* ONLY show the pack button if the order is Pending */}
                    {order.order_status === 'Pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(order.order_id, 'Packed')}
                        className="p-1.5 text-orange-500 hover:text-white hover:bg-orange-500 rounded-lg transition border border-orange-500/20" 
                        title="Mark as Packed"
                      >
                        <Box size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-white/[0.02]">
            <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30"><ChevronLeft size={14} /> Previous</button>
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
            <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-30">Next <ChevronRight size={14} /></button>
        </div>
        </div>
      </div>

      {/* Refined Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F1219] border border-zinc-800 rounded-xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-black text-white mb-6">Order Details</h2>
            
            <div className="flex justify-between border-b border-zinc-800 pb-4 mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Order ID</p>
                <p className="text-emerald-500 font-mono text-sm font-bold">ORD-{selectedOrder.order_id}</p>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Update Status</p>
                <select 
                  value={selectedOrder.order_status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.order_id, e.target.value)}
                  className="bg-[#0B0E14] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-bold outline-none cursor-pointer hover:border-emerald-500/50 transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="border-b border-zinc-800 pb-4 mb-4">
              <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Customer Information</p>
              <p className="text-white font-bold text-lg">{selectedOrder.customer_name}</p>
              <p className="text-zinc-500 text-xs font-medium">Destination: {selectedOrder.destination_address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4 mb-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Product</p>
                <p className="text-zinc-300 text-sm font-medium">{selectedOrder.ProductName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Quantity</p>
                <p className="text-white font-bold">{selectedOrder.quantity}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Warehouse Id</p>
                <p className="text-emerald-500 font-bold">{selectedOrder.warehouse_id}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Value</p>
                <p className="text-emerald-500 font-bold">{selectedOrder.TotalValue}</p>
              </div>
            </div>

            <div className="bg-[#0B0E14] rounded-lg p-4 mb-6 flex justify-between items-center border border-zinc-800">
               <div>
                 <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Tracking Number</p>
                 <p className="text-white font-mono text-sm font-bold">{selectedOrder.assigned_vehicle_id ? `TRK-${selectedOrder.assigned_vehicle_id}11` : 'Not Assigned'}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Shipment ID</p>
                 <p className="text-blue-500 font-mono text-sm font-bold">{selectedOrder.assigned_vehicle_id ? `SHP-${selectedOrder.assigned_vehicle_id}` : 'N/A'}</p>
               </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-zinc-800 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-sm font-bold transition">
                <FileText size={16} /> Download Invoice
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-lg text-sm font-bold transition">
                <Truck size={16} /> Track Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}