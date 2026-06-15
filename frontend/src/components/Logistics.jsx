import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Clock,
  MapPin,
  Search,
  Loader2,
  MoreVertical,
  ChevronLeft,  
  ChevronRight   
} from "lucide-react";
import CustomSelect from './CustomSelect'; 

const Logistics = () => {
  const [logisticData, setLogicticData]= useState([]);
  const [isLoading, setIsLoading]= useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(1); // ADDED THIS MISSING STATE
  const [totalPages, setTotalPages] = useState(1); 
  const [searchQueryLogistic, setSearchQueryLogistic] = useState("");
  const [statusFilterLogistic, setStatusFilterLogistic] = useState("All Statuses");
  const [vehicleFilterLogistic, setVehicleFilterLogistic] = useState("");
  const itemsPerPage = 10;

  useEffect(()=>{
    const fetchLogistics = async() => {
     try{
        const params = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQueryLogistic,
          status: statusFilterLogistic === "All Statuses" ? "" : statusFilterLogistic,
          vehicle: vehicleFilterLogistic
        });
        
        const response=await fetch(`${import.meta.env.VITE_SERVER_URL}/api/logistics?${params}`,{
          headers: {
            'Content-Type': 'application/json' 
          },
          credentials: 'include',
        })
        
        if (response.status === 401) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem('SiloKrate_user_role');
          localStorage.removeItem('SiloKrate_expires_at');
          window.location.href = '/login';
          return; 
        } else if (response.status === 403) {
          window.location.href = '/unauthorized';
          return;
        }
      
       if(!response.ok){
        setLogicticData([]);
       }
       
        const data = await response.json();
        setLogicticData(data.data || []);
        setTotalPages(data?.totalPages || 0);
     } catch(err) {
        console.error("Logistics API Error:",err);
        setLogicticData([]);
     } finally {
        setIsLoading(false);
     }
    }

    const timer = setTimeout(() => {
        fetchLogistics();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchQueryLogistic, statusFilterLogistic, vehicleFilterLogistic]);

  // Reset to page 1 when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQueryLogistic, statusFilterLogistic, vehicleFilterLogistic]);

  // Pagination Handlers
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
      const maxPage = totalPages > 0 ? totalPages : 1;
      if (value > maxPage) value = maxPage;
  
      if (value !== currentPage) {
        setCurrentPage(value);
      }
    }, 800); 
  
    return () => clearTimeout(timer);
  }, [pageInput, totalPages, currentPage]);
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      let value = parseInt(pageInput);
  
      if (!value || isNaN(value)) value = 1;
      if (value < 1) value = 1;
      
      const maxPage = totalPages > 0 ? totalPages : 1;
      if (value > maxPage) value = maxPage;
  
      setCurrentPage(value);
    }
  };

  const activeCount = logisticData.length; 
  const transitCount = logisticData.length; 
  const uniqueRoutes = new Set(logisticData.map(s => s.destination)).size;

  if (isLoading) return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <header className="my-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Logistics Operations</h1>
          <p className="text-sm text-zinc-500 mt-1">Track and manage shipments in real-time</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <Package size={16} /> New Shipment
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Package />} label="Total Shipments" value={totalPages * itemsPerPage || activeCount} trend="+18%" color="emerald" />
        <StatCard icon={<TrendingUp />} label="Active in Fleet" value={transitCount} trend="+5%" color="emerald" />
        <StatCard icon={<Clock />} label="Avg. Transit" value="4.2d" trend="-12%" color="rose" />
        <StatCard icon={<MapPin />} label="Active Routes" value={uniqueRoutes || "12"} trend="+8%" color="emerald" />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 bg-[#0F1219] p-4 rounded-xl border border-zinc-800">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"><Search size={16} /></span>
          <input 
            type="text" 
            value={searchQueryLogistic}
            onChange={(e) => setSearchQueryLogistic(e.target.value)}
            placeholder="Search shipments by ID, origin, or destination..." 
            className="w-full bg-[#0B0E14] border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <CustomSelect 
          value={statusFilterLogistic}
          onChange={setStatusFilterLogistic}
          options={[
            'All Statuses', 'In Transit', 'Packed', 'Delivered'
          ]}
        />
      </div>

      {/* Shipments List */}
      <div className="bg-[#0F1219] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm">Active Shipments</h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase">{logisticData.length} Total Shipments</span>
        </div>
        
        <div className="divide-y divide-zinc-800">
          {logisticData.map((shipment) => {
            const startTime = new Date(shipment.order_date).getTime();
            const currentTime = new Date().getTime();
            const deliveryWindow = 7 * 24 * 60 * 60 * 1000; 
            
            // 1. Initial raw calculation
            let dynamicProgress = Math.floor(((currentTime - startTime) / deliveryWindow) * 100);
            
            // 2.This to fake progress for old data
            if (dynamicProgress >= 100 && shipment.order_status !== 'Delivered') {
              dynamicProgress = 60 + (shipment.order_id % 35); 
            }

            // 3. Status Overrides (Forces the bar to 0% or 100%)
            if (shipment.order_status === 'Packed') {
              dynamicProgress = 0; 
            } else if (shipment.order_status === 'Delivered') {
              dynamicProgress = 100; 
            }

            // 4. Calculate hours remaining 
            const totalHours = 7 * 24; // 168 total hours in 7-day window
            const hoursRemaining = Math.floor((totalHours * (100 - dynamicProgress)) / 100);

            // 5. Apply context-aware ETA text based on status
            let safeEta = "";
            if (shipment.order_status === 'Delivered') {
              safeEta = "Completed";
            } else if (shipment.order_status === 'Packed') {
              safeEta = "Pending Dispatch"; 
            } else {
              safeEta = hoursRemaining > 0 ? `${hoursRemaining}h remaining` : "Arriving Soon";
            }

            const actualStatus = shipment.order_status;
            const statusColor = actualStatus === 'Delivered' ? 'emerald' : (actualStatus === 'In Transit' ? 'blue' : 'amber');

            return (
              <ShipmentRow
                key={shipment.order_id}
                id={`#SHP-${shipment.order_id}`}
                origin={shipment.origin || "SiloKrate Hub"}
                dest={shipment.destination || "Destination"}
                status={actualStatus}
                carrier={shipment.carrier || "N/A"}
                color={statusColor}
                progress={dynamicProgress} 
                eta={safeEta}
                weight={shipment.weight}
              />
            );
          })}
        </div>
      </div>
      
      {/* Pagination Footer */}
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
              of {totalPages || 1}
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
  );
};

// Helper Components
const StatCard = ({ icon, label, value, trend, color }) => (
  <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>
    </div>
    <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">{label}</p>
    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
  </div>
);

const ShipmentRow = ({ id, origin, dest, progress, status, eta, carrier, weight, color }) => {
  const barColor = { blue: 'bg-blue-500', rose: 'bg-rose-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' }[color];
  const textColor = { blue: 'text-blue-400', rose: 'text-rose-400', emerald: 'text-emerald-400', amber: 'text-amber-400' }[color];
  const bgColor = { blue: 'bg-blue-500/10', rose: 'bg-rose-500/10', emerald: 'bg-emerald-500/10', amber: 'bg-amber-500/10' }[color];

  return (
    <div className="p-4 hover:bg-white/[0.02] transition-colors grid grid-cols-1 md:grid-cols-5 gap-4 items-center group">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Shipment ID</p>
          <div className="flex items-center gap-2">
            <p className="text-emerald-500 font-mono text-sm font-bold">{id}</p>
            {status !== 'Delivered' && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Column 2: Route */}
      <div>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Route</p>
        <p className="text-white text-xs font-medium">{origin} <span className="text-zinc-600 px-1">→</span> {dest}</p>
      </div>

      {/* Column 3: Progress Bar */}
      <div className="col-span-1">
        <div className="flex justify-between text-[10px] font-bold mb-1.5">
          <span className="text-zinc-500 uppercase tracking-tighter">Progress</span>
          <span className="text-zinc-300">{progress}%</span>
        </div>
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Column 4: Status Pill & ETA */}
      <div className="flex flex-col items-center">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current ${textColor} ${bgColor}`}>
          {status}
        </span>
        <span className="text-[9px] text-zinc-600 mt-1 font-bold">ETA: {eta}</span>
      </div>

      {/* --- Modified Last Column: Carrier info + Menu Button --- */}
      <div className="flex items-center justify-end gap-4 text-right">
        <div>
          <p className="text-white text-xs font-bold">{carrier}</p>
          <p className="text-[10px] text-zinc-600 font-medium">{weight}</p>
        </div>
        
        {/* Triple Dot Button (Visible on Hover) */}
        <button className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
};

export default Logistics;