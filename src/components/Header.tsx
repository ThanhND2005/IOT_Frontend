import { motion } from 'framer-motion';
import { Bell, Search, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ title, subtitle, onRefresh, isRefreshing }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate notification
  useEffect(() => {
    const timeout = setTimeout(() => setHasNotification(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-6 sticky top-0 z-10"
    >
      {/* Title section */}
      <div>
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-lg font-bold text-white"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <p className="text-xs text-slate-400">{subtitle}</p>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <div className="text-right">
            <p className="text-xs font-mono font-semibold text-white">{formatTime(currentTime)}</p>
            <p className="text-[10px] text-slate-400">{formatDate(currentTime)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-40 pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
          />
        </div>

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-200 disabled:opacity-50"
          >
            <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          </button>
        )}

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-200"
          onClick={() => setHasNotification(false)}
        >
          <Bell className="w-4 h-4" />
          {hasNotification && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-slate-900"
            />
          )}
        </button>

        {/* Avatar */}
        {(() => {
          const user = typeof window !== 'undefined' ? (() => {
            try {
              const raw = localStorage.getItem('user_info');
              return raw ? JSON.parse(raw) : null;
            } catch { return null; }
          })() : null;
          const fullName = user?.fullName || 'Nguyễn Danh Thành';
          const studentCode = user?.studentCode || 'B23DCCN772';
          const avatarUrl = user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenDanhThanh&backgroundColor=b6e3f4';

          return (
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-8 h-8 rounded-full border-2 border-blue-500/50 bg-slate-700"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-slate-900" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white">{fullName}</p>
                <p className="text-[10px] text-slate-400">{studentCode}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </motion.header>
  );
}
