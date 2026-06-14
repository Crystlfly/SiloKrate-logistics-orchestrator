import { Users as UsersIcon, Shield, UserCheck, Package, Search, Download, Plus, Loader2, MoreVertical, ChevronLeft, ChevronRight, Edit, Trash2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import UserModal from './UserModal';
import csvDownloadHelper from './csvDownloadHelper'
import CustomSelect from './CustomSelect';

const ROLE_MAP = {
  system_admin: { label: "System Admin", color: "purple" },
  inventory_manager: { label: "Inventory Manager", color: "blue" },
  inventory_staff: { label: "Inventory Staff", color: "orange" },
  logistics_manager: { label: "Logistics Manager", color: "emerald" },
  warehouse_manager: { label: "Warehouse Manager", color: "zinc" },
  warehouse_staff: { label: "Warehouse Staff", color: "zinc" },
};

const Users = () => {
  const [usersData, setUsersData] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, admins: 0, suspended: 0 }); 
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");

  const [openMenuId, setOpenMenuId] = useState(null);
  const toggleMenu = (id) => setOpenMenuId(openMenuId === id ? null : id);

  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        category: roleFilter === "All Roles" ? "" : roleFilter 
      });

      const response = await fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/users?${params}`, {
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
      } else if (response.status === 403) {
        window.location.href = '/unauthorized';
        return;
      }

      if (!response.ok) {
        setUsersData([]); 
        return;
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        setUsersData(data);
        setStats({
          total: data.length, 
          active: data.length,
          admins: data.filter(u => u.Role === "system_admin").length,
          opCost: data.filter(u => u.Role === "warehouse_staff").length,
        });
      } else {
        const extractedData = data.data || data;
        setUsersData(Array.isArray(extractedData) ? extractedData : []);

        setStats({
          total: data.pagination?.totalItems || extractedData.length, 
          active: data.pagination?.totalItems || extractedData.length,
          admins: extractedData.filter(u => u.Role === "system_admin").length,
          opCost: extractedData.filter(u => u.Role === "warehouse_staff").length,
        });
        
        const fetchedPages = data.pagination?.totalPages || 1;
        setTotalPages(fetchedPages === 0 ? 1 : fetchedPages); 
      }

    } catch (err) {
      console.error("User API Error:", err);
      setUsersData([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refetch when filters or page change
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers();
    }, 500);
    return () => clearTimeout(timer); 
  }, [currentPage, searchQuery, roleFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Pagination Handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Safe Input Handlers
  useEffect(() => {
    if (currentPage < 1) setCurrentPage(1);
    setPageInput(currentPage < 1 ? 1 : currentPage);
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this user access?")) {
      try {
        const response = await fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/deleteUser/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });

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

        if (response.ok) {
          fetchUsers(); 
        } else if (response.status === 403) {
          alert('You do not have permission to delete yourself.');
        } else {
          alert('Failed to delete user');
        }
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  const handleUpdate = (user) => {
    setSelectedUser(user); 
    setIsOpen(true); 
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setSelectedUser(null); 
    fetchUsers();    
  };

  const handleExport = async () => {
    const header = ["FullName", "Email", "Role"];
    try {
      const params = newSearchParams({
      page: 1,
      limit: 100000,
      search: searchQuery,
      category: roleFilter !== "All Roles" ? roleFilter : ""
    });

      const response = await fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/users?${params}`, {
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
      } else if (response.status === 403) {
        window.location.href = '/unauthorized';
        return;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
      const rows = data?.map(user => [
        `"${user.FullName || 'N/A'}"`, 
        user.Email || 'N/A',
        ROLE_MAP[user.Role]?.label || user.Role || 'N/A'
      ]);
      
      csvDownloadHelper(header, rows);
    } else {
      alert("No users found to export.");
    }
  } catch(err) {
      console.error("Error in downloading:", err);
    }
  }

  if (isLoading && currentPage === 1 && usersData.length === 0) {
    return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center text-zinc-500">
      <Loader2 className="animate-spin mr-2" /> Loading SiloKrate Protocol...
    </div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="my-5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Control access permissions and personnel roles</p>
        </div>
        <div className="flex gap-3">
          <button 
          onClick={() => handleExport()}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold transition-all">
            <Download size={16} /> Export List
          </button>
          <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Plus size={16} /> Add User
          </button>
        </div>
      </header>

      <UserModal isOpen={isOpen} onCloseAction={handleCloseModal} initialData={selectedUser}/> 

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <UserStatCard icon={<UsersIcon />} label="Total Users" value={stats.total} trend="+12" color="blue" />
        <UserStatCard icon={<UserCheck />} label="Active Now" value={stats.active} trend="+4" color="emerald" />
        <UserStatCard icon={<Shield />} label="Administrators" value={stats.admins} trend="0" color="purple" />
        <UserStatCard icon={<Package />} label="Operational Cost" value={stats.opCost} trend="-1" color="rose" />
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 bg-[#0F1219] p-4 rounded-xl border border-zinc-800 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..." 
            className="w-full bg-[#0B0E14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        
        <CustomSelect 
          value={
            roleFilter === 'system_admin' ? 'System Admin' :
            roleFilter === 'inventory_manager' ? 'Inventory Manager' :
            roleFilter === 'inventory_staff' ? 'Inventory Staff' :
            roleFilter === 'logistics_manager' ? 'Logistics Manager' :
            roleFilter === 'warehouse_manager' ? 'Warehouse Manager' :
            roleFilter === 'warehouse_staff' ? 'Warehouse Staff' :
            'All Roles'
          }
          onChange={(selectedValue) => {
            const filterMap = {
              'All Roles': 'All Roles',
              'System Admin': 'system_admin',
              'Inventory Manager': 'inventory_manager',
              'Inventory Staff': 'inventory_staff',
              'Logistics Manager': 'logistics_manager',
              'Warehouse Manager': 'warehouse_manager',
              'Warehouse Staff': 'warehouse_staff'
            };
            setRoleFilter(filterMap[selectedValue] || 'All Roles');
          }}
          options={[
            'All Roles', 
            'System Admin', 
            'Inventory Manager', 
            'Inventory Staff',
            'Logistics Manager', 
            'Warehouse Manager', 
            'Warehouse Staff'
          ]}
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#0F1219] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-white font-bold text-sm">Personnel Roster</h3>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{usersData.length} users shown</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase font-black text-zinc-500 tracking-wider border-b border-zinc-800 bg-[#161a23]">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Role Permission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {usersData?.map((user) => (
                <UserRow 
                  key={user.UserId}
                  user={user}
                  isOpen={openMenuId === user.UserId}
                  onToggle={() => toggleMenu(user.UserId)}
                  onDelete={() => handleDelete(user.UserId)}
                  onUpdate={handleUpdate}
                />
              ))}
              {usersData.length === 0 && (
                  <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-zinc-500 text-sm font-medium">No users found matching parameters.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Updated Pagination Footer matching Logistics */}
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
    </div>
  );
};

const UserStatCard = ({ icon, label, value, trend, color }) => {
    const getColor = (c) => {
        if (c === 'emerald') return 'text-emerald-500 bg-emerald-500/10';
        if (c === 'blue') return 'text-blue-500 bg-blue-500/10';
        if (c === 'purple') return 'text-purple-500 bg-purple-500/10';
        return 'text-rose-500 bg-rose-500/10';
    };

    return (
        <div className="bg-[#0F1219] border border-zinc-800 p-5 rounded-xl group hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-start mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getColor(color)}`}>
                {icon}
            </div>
            <span className={`text-[10px] font-bold ${getColor(color).split(' ')[0]}`}>{trend}</span>
            </div>
            <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-tight">{label}</p>
            <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">{value}</h3>
        </div>
    );
};

const UserRow = ({ user, isOpen, onToggle, onDelete, onUpdate }) => {
  const { UserId, FullName, Email, Role } = user;
  const roleConfig = ROLE_MAP[Role ?? "warehouse_staff"];
  
  const isOnline = Math.random() > 0.5;

  const getRoleBadge = (color) => {
    const colors = {
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        zinc: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    }
    return colors[color] || colors.zinc;
  }

  return (
  <tr className="hover:bg-white/[0.02] transition-colors group">
    <td className="px-6 py-4">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                {FullName?.charAt(0).toUpperCase()}
            </div>
            <div>
                <div className="text-xs font-bold text-white">{FullName}</div>
                <div className="text-[10px] text-zinc-600 font-mono">ID: {UserId}</div>
            </div>
        </div>
    </td>
    <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <Mail size={12} className="text-zinc-600"/> {Email}
        </div>
    </td>
    <td className="px-6 py-4">
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(roleConfig.color)}`}>
        {roleConfig.label}
      </span>
    </td>
    <td className="px-6 py-4">
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`}></div>
            <span className={`text-[11px] font-bold ${isOnline ? 'text-emerald-500' : 'text-zinc-500'}`}>
                {isOnline ? 'Active Now' : 'Offline'}
            </span>
        </div>
    </td>
    
    <td className="px-6 py-4 text-right relative"> 
      <div className="flex items-center justify-end gap-3">
        <div className="relative">
          <button 
            onClick={() => onToggle(UserId)} 
            className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical size={16} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => onUpdate(user)}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
              >
                <Edit size={14} /> Edit Access
              </button>
              <button 
                onClick={() => onDelete(UserId)}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 size={14} /> Revoke
              </button>
            </div>
          )}
        </div>
      </div>
    </td>
  </tr>
);
};

export default Users;