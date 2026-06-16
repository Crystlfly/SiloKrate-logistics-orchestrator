import React from 'react';
import {
  Package,
  LayoutDashboard,
  Truck,
  Warehouse,
  Plus,
  CirclePile,
  LogOut,
  User,
  Menu
} from "lucide-react";
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const formatRole = (role) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getInitials = (name) => {
  if (!name) return "U"; 

  return name
    .replace(/_/g, " ")       
    .split(" ")
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .slice(0, 2)              
    .join(" ");
};

const Dashboard = ({ children, onLogout}) => {
    const userRole = (localStorage.getItem('SiloKrate_user_role'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-[#0B0E14] text-zinc-400 font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#0F1219] border-zinc-800 flex flex-col h-screen overflow-hidden sticky top-0 transition-all duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'w-64 border-r' : 'w-15 border-r-0'}`}>
        <div className="w-64 flex flex-col h-full">
          <div className="h-20 flex items-center px-4 gap-3">
            
            {/* The Toggle Button (Always visible on the far left) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>

            {/* The Logo (Hides when collapsed) */}
            <div className={`flex items-center gap-3 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-black font-bold shrink-0">N</div>
              <div className="whitespace-nowrap">
                <h2 className="text-white font-bold leading-none">SiloKrate</h2>
                <span className="text-[10px] text-zinc-500 uppercase">Supply Chain</span>
              </div>
            </div>

          </div>
          
          <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent max-h-[300px] pb-4">
            <SideItem to="/" icon={<LayoutDashboard size={18}/>} label="Dashboard" end />
            <SideItem to="/orders" icon={<Package size={18}/>} label="Orders" />
            <SideItem to="/logistics" icon={<Package size={18}/>} label="Logistics" />
            <SideItem to="/inventory" icon={<CirclePile size={18}/>} label="Inventory" />
            {userRole !== 'inventory_manager' && (
              <SideItem to="/fleet" icon={<Truck size={18}/>} label="Fleet" />
            )}
            
            <SideItem to="/warehouse" icon={<Warehouse size={18}/>} label="Warehouse" />
            
            {userRole === 'system_admin' && (
              <SideItem to="/user" icon={<User size={18}/>} label="Users" />
            )}
          </nav>

          <div className="p-4 border-t border-zinc-800 shrink-0">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-white">{getInitials(localStorage.getItem('SiloKrate_user_role'))}</div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{formatRole(localStorage.getItem('SiloKrate_user_role'))}</p>
                {/* <p className="text-[10px] text-zinc-500 truncate">manager@SiloKrate.io</p> */}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <LogOut size={16} className="shrink-0" />
              <span className={`ml-2 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const SideItem = ({ icon, label, to, end }) => (
  <NavLink 
    to={to} 
    end={end}
    className={({ isActive }) => 
      `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
        isActive 
          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300'
      }`
    }
  >
    <span>{icon}</span>
    {label}
  </NavLink>
);

export default Dashboard;