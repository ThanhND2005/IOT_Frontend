import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  History,
  User,
  Cpu,
  LogOut,
  ChevronRight,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

export default function Sidebar({ isConnected = true }: SidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  // Periodic pulse animation for connection indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseKey(k => k + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        'flex flex-col h-screen bg-slate-900 border-r border-slate-700/50 transition-all duration-300 relative z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700/50">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center glow-blue">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900 animate-pulse-slow" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">IoT Dashboard</span>
                <p className="text-[10px] text-slate-500">ESP8266 Controller</p>
              </div>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mx-auto"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center glow-blue">
                <Cpu className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 flex-shrink-0"
        >
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronRight className="w-3 h-3" />
          </motion.div>
        </button>
      </div>

      {/* Connection status */}
      {!collapsed && (
        <motion.div
          key={pulseKey}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          className={clsx(
            'mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 text-xs border',
            isConnected
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}
        >
          {isConnected ? (
            <Wifi className="w-3 h-3 flex-shrink-0 animate-pulse" />
          ) : (
            <WifiOff className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="font-medium">
            {isConnected ? 'Hardware Connected' : 'Disconnected'}
          </span>
          {isConnected && (
            <span className="ml-auto flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-green-500 rounded-full"
                  animate={{ height: ['4px', '12px', '4px'] }}
                  transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </span>
          )}
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
        )}
        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 + 0.1 }}
          >
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden',
                  collapsed && 'justify-center',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r"
                    />
                  )}
                  <item.icon
                    className={clsx(
                      'w-5 h-5 flex-shrink-0 transition-all duration-200',
                      isActive ? 'text-blue-400' : 'group-hover:scale-110'
                    )}
                  />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="activeDot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                    />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Live indicator */}
      {!collapsed && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center gap-2">
          <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
          <span className="text-xs text-slate-400">SSE Stream </span>
          <span className="ml-auto text-[10px] text-green-400 font-mono animate-pulse">LIVE</span>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform duration-200" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                key="logout-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Đăng xuất
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
