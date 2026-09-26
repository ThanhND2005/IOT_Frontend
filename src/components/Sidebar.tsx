import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  History,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface SidebarProps {
  isConnected?: boolean;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sensor-data', icon: Database, label: 'Sensor Data' },
  { to: '/device-history', icon: History, label: 'Device History' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar(_props: SidebarProps = {}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.setItem('manual_logout', 'true');
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-white border-r border-slate-200 relative z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div
        className={clsx(
          'flex items-center h-16 border-b border-slate-200 px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <span className="text-sm font-bold text-slate-900 tracking-tight">IoT Dashboard</span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 flex-shrink-0 cursor-pointer"
        >
          <ChevronRight className={clsx('w-3 h-3', !collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg group relative overflow-hidden',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600 rounded-r" />
                  )}
                  <item.icon
                    className={clsx(
                      'w-5 h-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                      {item.label}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 group cursor-pointer',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-red-600 transition-colors" />
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
              Đăng xuất
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
