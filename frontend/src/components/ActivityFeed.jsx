import React, { useState, useEffect } from 'react';
import { Activity, Clock } from 'lucide-react';

// Helper function for relative time
const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hrs ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " secs ago";
};

// Activity Item Sub-component (moved from your main file)
const ActivityItem = ({ type, loc, id, qty, time, status }) => (
    <div className="relative pl-6 border-l border-zinc-800 group cursor-default">
      <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-[#0B0E14] 
        ${status === 'Completed' ? 'bg-emerald-500' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'}`} />
      <div className="flex justify-between items-start">
        <div>
          <h5 className="text-[11px] font-black text-white uppercase tracking-wider">{type}</h5>
          <p className="text-[10px] text-zinc-500 font-bold">{loc}</p>
        </div>
        <span className="text-[9px] text-zinc-600 font-bold flex items-center gap-1"><Clock size={10} /> {time}</span>
      </div>
      <div className="mt-2 flex justify-between items-center bg-zinc-900/50 p-2 rounded-lg border border-zinc-800/50 group-hover:border-zinc-700 transition-colors">
        <span className="text-emerald-500 font-mono text-[10px] font-bold">{id}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-600 font-bold uppercase">Qty:</span>
          <span className="text-[10px] text-zinc-300 font-black">{qty}</span>
        </div>
      </div>
    </div>
);

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/activities', {
                    credentials: 'include'
                });
                if (response.status === 401) {
                    // Optional: handle auth errors quietly here or let the main page handle it
                    return; 
                }
                else if (response.status === 403) {
                    window.location.href = '/unauthorized';
                    return;
                }
                if (response.ok) {
                    const json = await response.json();
                    setActivities(json.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch activities:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, []);

    return (
        <div className="bg-[#0F1219] border border-zinc-800 rounded-xl flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Recent Activity</h3>
                <Activity size={16} className="text-emerald-500" />
            </div>
            
            <div className="p-4 space-y-6 flex-1 overflow-y-auto max-h-[460px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {isLoading ? (
                    <div className="text-center text-zinc-500 text-xs py-4">Loading activities...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center text-zinc-500 text-xs py-4">No recent activity.</div>
                ) : (
                    activities.map((act, index) => (
                        <ActivityItem 
                            key={index} 
                            type={act.activity_type} 
                            loc={act.location || "System"} 
                            id={act.reference_code} 
                            qty={act.quantity?.toLocaleString() || "0"} 
                            time={getTimeAgo(act.created_at)} 
                            status={act.status} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;