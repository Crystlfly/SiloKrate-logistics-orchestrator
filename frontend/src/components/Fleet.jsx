import React from 'react';
import { useEffect, useState } from 'react';
import { Truck, MapPin, Gauge, Fuel, Calendar, Plus, Search, Loader2, MoreVertical, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import FleetModal from './FleetModal';
import CustomSelect from './CustomSelect'; 


const Fleet = () => {
  const [fleetData, setFleetData] = useState([]);
  const [stats, setStats] = useState({ total: 0, maintenance: 0, transit: 0, idle: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(currentPage);
  const [totalPages, setTotalPages] = useState(1); 
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // 3. Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [openMenuId, setOpenMenuId] = useState(null);
  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);


  const fetchFleet = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        type: typeFilter !== "All Types" ? typeFilter : "",
        status: statusFilter !== "All Statuses" ? statusFilter : ""
      });

      const response = await fetch(`http://localhost:3000/api/fleet?${params}`,{
        headers: {
          'Content-Type': 'application/json' 
        },
        credentials: 'include'
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

      if (data.status === 200) {
        setFleetData(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);

        if (data.stats) {
          setStats({
            total: data.stats.total,
            maintenance: data.stats.low,   // Backend 'low' -> Frontend 'maintenance'
            transit: data.stats.over,      // Backend 'over' -> Frontend 'transit'
            idle: data.stats.out           // Backend 'out' -> Frontend 'idle'
          });
        }
      }
    } catch (err) {
      console.error("Fleet API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (currentPage !== 1 && (searchQuery || typeFilter !== "All Types" || statusFilter !== "All Statuses")) {
            setCurrentPage(1);
        } else {
            fetchFleet();
        }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, typeFilter, statusFilter]);

  // 6. Pagination Handlers
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
      if (window.confirm("Are you sure you want to delete this Vehicle?")) {
        try {  
          const response = await fetch(`http://localhost:3000/api/deleteFleet/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json' 
            },
            credentials: 'include'
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
            fetchFleet(); 
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
      fetchFleet();    
    };
  
    useEffect(() => {
      toggleMenu();
    }, []);

  if (isLoading && currentPage === 1 && fleetData.length === 0) return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
  
  return (
    <div className="animate-in fade-in duration-500">
      <header className="my-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fleet Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor vehicles, drivers, and maintenance schedules</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <Calendar size={16} /> Schedule Maintenance
          </button>
          <button 
          onClick={()=>setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </header>

      <FleetModal isOpen={isOpen} onCloseAction={handleCloseModal} initialToBeUpdatedData={selectedItem}/>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <FleetStat icon={<Truck />} label="Total Vehicles" value={totalItems} trend="+4 new" color="emerald" />
      <FleetStat 
        icon={<MapPin />} 
        label="Active on Routes" 
        value={fleetData.filter(v => v.status === "In Transit").length} 
        trend={fleetData.length > 0 
            ? (fleetData.filter(v => v.status === "In Transit").length / fleetData.length * 100).toFixed(1) + "%" 
            : "0%"} 
        color="emerald" 
      />
        <FleetStat icon={<Gauge />} label="Idle / Available" value={stats.idle} trend={fleetData.length > 0
        ? (fleetData.filter(v => v.status === "Idle").length / fleetData.length * 100).toFixed(1) + "%" 
        : "0%"} color="emerald" />
        <FleetStat icon={<Fuel />} label="Maintenance Due" value={stats.maintenance} trend={fleetData.length > 0
        ? (fleetData.filter(v => v.status === "Maintenance").length / fleetData.length * 100).toFixed(1) + "%" 
        : "0%"} color="rose" />
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 bg-[#0F1219] p-4 rounded-xl border border-zinc-800 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by vehicle ID, driver, or location..." className="w-full bg-[#0B0E14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <CustomSelect 
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            'All Types', 'Refrigerated Truck', 'Cargo Van', 'Heavy Duty Semi'
          ]}
        />
        <CustomSelect 
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            'All Statuses', 'In Transit', 'Idle', 'Maintenance'
          ]}
        />
      </div>

      {/* Fleet List */}
      <div className="bg-[#0F1219] border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-white font-bold text-sm">Fleet Overview</h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{fleetData.length} vehicles shown</span>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {fleetData.map((vehicle) => (
            <FleetRow 
              key={vehicle.vehicle_id}
              vehicleData={vehicle}
              isOpen={openMenuId === vehicle.vehicle_id}
              onToggle={toggleMenu}
              onDelete={handleDelete}
              onUpdate={() => handleUpdate(vehicle)}
              
            />
          ))}
        </div>
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

const FleetStat = ({ icon, label, value, trend, color }) => (
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

const FleetRow = ({ vehicleData, isOpen, onToggle, onDelete, onUpdate }) => {
  const userRole = (localStorage.getItem('userRole'));
  const { 
    vehicle_id, 
    vehicle_type, 
    driver_name, 
    status, 
    warehouse_location, 
    odometer, 
    current_route, 
    progress, 
    fuel_level 
  } = vehicleData;

  // 2. Formatting
  const displayId = `VEH-${vehicle_id.toString().padStart(4, '0')}`;
  const distFormatted = `${(odometer || 0).toLocaleString()} km`;

  return (
    <div className="p-4 hover:bg-white/[0.02] transition-colors grid grid-cols-1 md:grid-cols-6 gap-6 items-center group">
      {/* Column 1: ID */}
      <div>
        <p className="text-emerald-500 font-mono text-xs font-bold">{displayId}</p>
        <p className="text-[10px] text-zinc-500 uppercase font-bold">{vehicle_type}</p>
      </div>

      {/* Column 2: Driver */}
      <div>
        <p className="text-white text-xs font-bold">{driver_name}</p>
        <p className="text-[10px] text-zinc-600">{distFormatted}</p>
      </div>

      {/* Column 3: Route */}
      <div>
        <p className="text-white text-xs font-bold">{current_route || 'Unassigned'}</p>
        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
          <MapPin size={8}/> {warehouse_location}
        </p>
      </div>

      {/* Column 4 & 5: Progress & Fuel */}
      <div className="col-span-2 flex gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-[9px] font-bold mb-1">
            <span className="text-zinc-500 uppercase">Progress</span>
            <span className="text-zinc-300">{progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-[9px] font-bold mb-1">
            <span className="text-zinc-500 uppercase flex items-center gap-1">
              <Fuel size={8}/> Fuel: {fuel_level}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${fuel_level < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                 style={{ width: `${fuel_level}%` }} />
          </div>
        </div>
      </div>

      {/* Column 6: Status & Menu */}
      <div className="flex items-center justify-end gap-3">
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          status === 'In Transit' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' : 
          status === 'Maintenance' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' : 
          'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'}`}>
          {status}
        </span>
        
        <div className="relative">
          <button 
            onClick={() => onToggle(vehicle_id)} 
            className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => onUpdate(vehicleData)}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
              >
                <Edit size={14} /> Update
              </button>
              {userRole === 'system_admin' && (
              <button 
                onClick={() => onDelete(vehicle_id)}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fleet;