import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MapPin, LayoutDashboard, Settings, Moon, Sun, Menu, X, LogOut, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar({ darkMode, setDarkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
     logout();
     navigate('/login');
  };

  const navItems = [
    { name: 'Navigation', path: '/navigation', icon: MapPin },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  if (user?.role === 'admin') {
     navItems.push({ name: 'Admin', path: '/admin', icon: Settings });
  }

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-theme-panel rounded-md shadow-md text-theme-main border border-theme">
           {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 md:relative transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out bg-theme-panel border-r border-theme shadow-lg flex flex-col justify-between`}>
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-theme">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
               CN
            </div>
            <h1 className="text-xl font-bold tracking-tight text-theme-main">CampusNav</h1>
          </div>
          
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.path} 
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-theme-muted hover:bg-theme-main hover:text-theme-main'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-theme">
          
          {user && (
            <div className="p-4 flex items-center gap-3 border-b border-theme">
               <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-theme-main">
                  <User size={20} />
               </div>
               <div className="overflow-hidden">
                  <p className="text-sm font-bold text-theme-main truncate">{user.name}</p>
                  <p className="text-xs text-theme-muted uppercase tracking-wider mt-0.5">{user.role}</p>
               </div>
            </div>
          )}

          <div className="p-4 space-y-2">
              <button 
                 onClick={() => setDarkMode(!darkMode)}
                 className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-colors text-theme-muted hover:bg-theme-main hover:text-theme-main"
              >
                {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
                <span className="font-medium text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button 
                 onClick={handleLogout}
                 className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 font-medium text-sm"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
          </div>
        </div>
      </div>
    </>
  );
}
