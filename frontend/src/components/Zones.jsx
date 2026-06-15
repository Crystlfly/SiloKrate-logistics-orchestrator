import React, { useState, useEffect, useMemo } from 'react';
import ZonesModal, { ZoneCard } from './ZonesModal';

const Zones = () => {
  const [zoneData, setZoneData] = useState([]);
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [currPage, setCurrPage]=useState(1);
  const [totalPages, setTotalPages] = useState(0); 
  const itemsPerPage=150;  

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const params = new URLSearchParams({
          page: currPage,
          limit: itemsPerPage,
        });
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/zones?${params}`, {
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (response.status === 401 ) {
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
        if (!response.ok) throw new Error('Failed to fetch zone data');
        
        const json = await response.json();
        const rawData = json.data || json;
        
        // values mapping
        const mappedData = rawData.map(row => {
          const cap = row.capacity_limit || 0;
          const occ = row.current_occupancy || 0;
          const pct = cap > 0 ? ((occ / cap) * 100).toFixed(1) : 0;
          
          return {
            name: row.zone_name,                          
            location: `${row.warehouse_name || 'Unknown'} • Zone ${row.zone_id}`,
            volume: occ,       // Raw volume number for the display box
            capacity: cap,     // Raw capacity number
            temp: row.temperature,
            percentage: pct,   // Calculated percentage for the progress bar
            type: row.zone_type,
            alert: pct > 85    // Alert triggers if over 85% full
          };
        });
        
        setZoneData(mappedData);
      } catch (err) {
        console.error("Fetch Zones Error:", err);
      }
    };
    fetchZones();
  }, [currPage]); 

  //DASHBOARD LOGIC: TOP 6 CRITICAL
  const dashboardZones = useMemo(() => {
    return [...zoneData]
      .sort((a, b) => {
        if (a.alert && !b.alert) return -1; // Alerts first
        if (!a.alert && b.alert) return 1;
        return Number(b.percentage) - Number(a.percentage); // Then sorting by highest %
      })
      .slice(0, 4);
  }, [zoneData]);

  return (
    <>
      {showZonesModal && (
        <ZonesModal 
          data={zoneData}
          onClose={() => setShowZonesModal(false)} 
        />
      )}

      {/* The Dashboard Section */}
      <div className="space-y-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Zones Overview</h3>
          
          <button 
            onClick={() => setShowZonesModal(true)}
            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-tighter"
          >
            View All Zones 
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {dashboardZones.map((zone, idx) => (
            <ZoneCard key={idx} {...zone} />
          ))}
          {dashboardZones.length === 0 && (
            <div className="col-span-2 p-8 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-xl">
              No active zones found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Zones;