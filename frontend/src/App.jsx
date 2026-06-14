import Dashboard from './components/Dashboard';
import RealMap from './components/RealMap';
import Orders from './components/Orders.jsx';
import Logistics from './components/Logistics.jsx';
import Inventory from './components/Inventory';
import Fleet from './components/Fleet.jsx';
import WarehouseManagement from './components/warehouse.jsx';
import Zones from './components/Zones.jsx';
import User from './components/User.jsx';
import Signup from './components/Signup.jsx';
import Login from './components/Login.jsx';
import SiloKrateSplash from './components/SiloKrateSplash.jsx';
import Unauthorized from './components/Unauthorized.jsx';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'; 
import ResetPasswordPage from './components/ResetPassword.jsx';
import { jwtDecode } from 'jwt-decode';
import OrderModal from './components/OrderModal.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ChatWidget from './components/ai-bot/ChatWidget.jsx';
import SetupPassword from './components/SetupPassword';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Truck, Activity, Plus } from "lucide-react";

const checkTokenValidity = () => {
  const expiresAt = localStorage.getItem('SiloKrate_expires_at');
  if (!expiresAt) return false;
  
  return Date.now() < parseInt(expiresAt);
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(checkTokenValidity);

  const userRole = (localStorage.getItem('SiloKrate_user_role'));
  const expiresAt = localStorage.getItem('SiloKrate_expires_at');
  const [WAREHOUSE_POINTS, setWAREHOUSE_POINTS] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = (role, expiresAt) => {
    localStorage.setItem('SiloKrate_user_role', role);
    localStorage.setItem('SiloKrate_expires_at', expiresAt);
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleLogout = async () => {
    await fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/auth/logout`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' 
        },
        credentials: 'include' 
    });
    localStorage.removeItem('SiloKrate_user_role');
    localStorage.removeItem('SiloKrate_expires_at');
    setIsLoggedIn(false);
    navigate('/login');
  };

  useEffect(() => {
    if (isLoggedIn && !checkTokenValidity()) {
      console.warn("Session expired. Forcing logout.");
      handleLogout();
    }
  }, [location.pathname, isLoggedIn]);

  useEffect(() => {
    fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/logistics/coordinates`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((json) => {
        setWAREHOUSE_POINTS(json.data);
      })
      .catch(err => console.error("API Error:", err));
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800); 
  }, []);

  if (isLoading) {
    return <SiloKrateSplash />;
  }

  return (
    <>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* AUTHENTICATION GATE */}
        {!isLoggedIn ? (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
            <Route path="/setup-password" element={<SetupPassword />} />
          </>
        ) : (
          /* PROTECTED ROUTES */
          <Route path="*" element={
            <Dashboard onLogout={handleLogout}>
              {/* Nested Routes inside your Dashboard Layout */}
              <Routes>
                <Route path="/" element={<MainDashboardView setIsOpen={setIsOpen} WAREHOUSE_POINTS={WAREHOUSE_POINTS} />} />
                <Route element={<ProtectedRoute allowedRoles={['system_admin', 'warehouse_manager', 'warehouse_staff', 'inventory_manager', 'inventory_staff', 'logistics_manager']} />}>
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/warehouse" element={<WarehouseManagement />} />
                  <Route path="/zones" element={<Zones />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['system_admin', 'warehouse_manager', 'logistics_manager']} />}>
                  <Route path="/logistics" element={<Logistics />} />
                  <Route path="/fleet" element={<Fleet />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={['system_admin', 'warehouse_manager', 'warehouse_staff', 'inventory_manager', 'inventory_staff']} />}>
                  <Route path="/inventory" element={<Inventory />} />
                </Route>
                <Route path="/unauthorized" element={<Unauthorized />} />
                {userRole === 'system_admin' && <Route path="/user" element={<User />} />}
                {/* Fallback route - redirects unknown URLs back to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Dashboard>
          } />
        )}
      </Routes>
      <OrderModal isOpen={isOpen} onCloseAction={() => setIsOpen(false)} />
      <ChatWidget />
    </>
  );
}

const MainDashboardView = ({ setIsOpen, WAREHOUSE_POINTS }) => {
  const [stats, setStats] = useState({
    totalActiveOrders: 0,
    criticalInventoryAlerts: 0,
    fleet: { availabilityPercentage: 0, idle: 0, inTransit: 0 },
    operationalUptime: 100,
    inventoryHealth: []
  });

  useEffect(() => {
    fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/dashboard-stats`, {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setStats(json.data);
        }
      })
      .catch((err) => console.error("Failed to fetch dashboard stats:", err));
  }, []);

  return (
    <>
      <header className="my-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">SiloKrate</h1>
          <p className="text-sm text-zinc-500 mt-1">Logistics Command Center</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          <Plus size={16} /> Place New Order
        </button>
      </header>
      
      {/* 3. Injecting Live Data into StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<Package />} 
          label="Total Active Orders" 
          value={stats.totalActiveOrders.toLocaleString()} 
          color="emerald" 
        />
        <StatCard 
          icon={<AlertTriangle />} 
          label="Critical Inventory Alerts" 
          value={stats.criticalInventoryAlerts} 
          color="rose" 
        />
        <StatCard 
          icon={<Truck />} 
          label="Fleet Availability" 
          value={`${stats.fleet.availabilityPercentage}%`} 
          sub={`${stats.fleet.idle} Idle / ${stats.fleet.inTransit} In-Transit`} 
          color="emerald" 
        />
        <StatCard 
          icon={<Activity />} 
          label="Operational Uptime" 
          value={`${stats.operationalUptime}%`} 
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0F1219] border border-zinc-800 rounded-xl overflow-hidden relative min-h-[400px]">
          <div className="absolute top-4 left-4 z-[1000] bg-[#0F1219]/80 p-2 rounded border border-zinc-700">
            <h3 className="text-white font-bold text-xs uppercase tracking-widest text-[10px]">Live Network</h3>
          </div>
          <RealMap points={WAREHOUSE_POINTS} />
        </div>

        <div className="bg-[#0F1219] border border-zinc-800 rounded-xl flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-white font-bold text-sm">Inventory Health</h3>
            {stats.criticalInventoryAlerts > 0 && (
              <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded border border-rose-500/20">
                {stats.criticalInventoryAlerts} Alerts
              </span>
            )}
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent max-h-[300px]">
            {/* 4. Map over the dynamic inventory health array from the backend */}
            {stats.inventoryHealth.length > 0 ? (
              stats.inventoryHealth.map((item, index) => (
                <InventoryItem 
                  key={index}
                  name={item.name} 
                  loc={`Warehouse Hub ${item.warehouse_id}`} 
                  stock={item.current_stock} 
                  target={item.reorder_level} 
                  alert={item.current_stock <= item.reorder_level} 
                />
              ))
            ) : (
              <div className="text-zinc-500 text-xs text-center py-6">
                All inventory levels are healthy.
              </div>
            )}
          </div>
          <button className="m-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors">
            View All Alerts
          </button>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ icon, label, value, trend, sub, color }) => (
  <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {icon}
      </div>
      {trend && <span className={`text-[10px] font-bold ${color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`}>{trend}</span>}
    </div>
    <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">{label}</p>
    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
  </div>
);

const InventoryItem = ({ name, loc, stock, target, alert }) => (
  <div className={`p-3 rounded-lg border ${alert ? 'border-rose-500/30 bg-rose-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="text-xs font-bold text-white">{name}</h4>
        <p className="text-[10px] text-zinc-500">{loc}</p>
      </div>
      {alert && <span className="text-[8px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black">HIGH ALERT</span>}
    </div>
    <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
      <div className={`h-full ${alert ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(stock/target)*100}%` }}></div>
    </div>
    <div className="flex justify-between mt-2 text-[9px]">
      <span className={alert ? 'text-rose-400 font-bold' : 'text-zinc-400'}>Current: {stock} units</span>
      <span className="text-zinc-600 font-bold">Threshold: {target}</span>
    </div>
  </div>
);

export default App;