import React, { useState, useMemo } from 'react';
import { Search, X, Box, Thermometer, Activity, Layers } from 'lucide-react';

export const ZoneCard = ({ name, location, volume, capacity, temp, percentage, type, alert }) => {
  return (
    <div className={`p-4 rounded-xl border ${alert ? 'border-rose-500/30 bg-rose-500/5' : 'border-zinc-800 bg-[#0F1219]'} transition-all hover:border-zinc-700`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className={alert ? "text-rose-500" : "text-emerald-500"} />
            <h4 className="text-sm font-bold text-white tracking-wide">{name}</h4>
          </div>
          <p className="text-[11px] text-zinc-500 flex items-center gap-1">
             <Box size={10} /> {location}
          </p>
        </div>
        <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest
          ${type === 'General Storage' ? 'bg-purple-500/10 text-purple-400' : 
            type === 'Cold Chain' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {type}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 bg-[#13161E] rounded-lg p-2.5 border border-zinc-800/50">
          <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mb-1"><Box size={10}/> Volume</p>
          <p className="text-xs font-bold text-white">{volume.toLocaleString()}</p>
        </div>
        <div className="flex-1 bg-[#13161E] rounded-lg p-2.5 border border-zinc-800/50">
          <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mb-1"><Thermometer size={10}/> Temp</p>
          <p className="text-xs font-bold text-white">{temp}°C</p>
        </div>
        <div className="flex-1 bg-[#13161E] rounded-lg p-2.5 border border-zinc-800/50">
          <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mb-1"><Activity size={10}/> Status</p>
          <p className="text-xs font-bold text-white">Active</p>
        </div>
      </div>

      {/* Progress Bar Area */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <p className="text-[10px] text-zinc-400 font-medium">Capacity Utilization</p>
          <p className={`text-[11px] font-bold ${alert ? 'text-rose-500' : 'text-orange-500'}`}>{percentage}%</p>
        </div>
        
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${alert ? 'bg-rose-500' : 'bg-orange-500'}`} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
          <span>{volume.toLocaleString()} sq ft</span>
          <span>{capacity.toLocaleString()} sq ft</span>
        </div>
      </div>
    </div>
  );
};

//MAIN MODAL
const ZonesModal = ({ data, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");

  // Filtering Logic
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(zone => {
      const matchesSearch = 
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        zone.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "All Types" || zone.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [data, searchQuery, typeFilter]);

  // Calculate Dashboard Summary Stats
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { totalVol: 0, totalCap: 0, avgUtil: 0, activeCount: 0 };
    
    let totalVol = 0;
    let totalCap = 0;
    
    filteredData.forEach(z => {
      totalVol += z.volume;
      totalCap += z.capacity;
    });

    const avgUtil = totalCap > 0 ? ((totalVol / totalCap) * 100).toFixed(1) : 0;

    return { totalVol, totalCap, avgUtil, activeCount: filteredData.length };
  }, [filteredData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#13161E] border border-zinc-800 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-emerald-500" /> All Warehouse Zones
            </h2>
            <p className="text-sm text-zinc-500 mt-1">Comprehensive zone management and monitoring</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 px-6 pt-6">
          <div className="bg-[#0F1219] border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1">Total Zones</p>
            <h3 className="text-2xl font-bold text-white">{filteredData.length}</h3>
          </div>
          <div className="bg-[#0F1219] border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1 flex justify-between">
              Avg. Utilization <Activity size={14} className="text-blue-500"/>
            </p>
            <h3 className="text-2xl font-bold text-white">{stats.avgUtil}%</h3>
            <p className="text-[10px] text-zinc-500 mt-1">{stats.totalVol.toLocaleString()} / {stats.totalCap.toLocaleString()} sq ft</p>
          </div>
          <div className="bg-[#0F1219] border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1 flex justify-between">
              Total Space Used <Box size={14} className="text-purple-500"/>
            </p>
            <h3 className="text-2xl font-bold text-white">{stats.totalVol.toLocaleString()}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Across all visible zones</p>
          </div>
          <div className="bg-[#0F1219] border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1 flex justify-between">
              Active Zones <Thermometer size={14} className="text-emerald-500"/>
            </p>
            <h3 className="text-2xl font-bold text-white">{stats.activeCount}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Operational status normal</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 p-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by zone ID, name, or warehouse..." 
                className="w-full bg-[#0F1219] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500/50 outline-none text-white" 
              />
            </div>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)} 
              className="bg-[#0F1219] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm outline-none text-zinc-400"
            >
              <option>All Types</option>
              <option>General Storage</option>
              <option>Cold Chain</option>
              <option>High Value Security</option>
            </select>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((zone, idx) => (
              <ZoneCard key={idx} {...zone} />
            ))}
            {filteredData.length === 0 && (
                <div className="col-span-full text-center py-10 text-zinc-500">
                    No zones found matching your filters.
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ZonesModal;