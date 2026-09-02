import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Thermometer, Droplets, Sun, Download, SlidersHorizontal
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { mockSensorLogs, type SensorLog } from '../mock/data';

// ─── Sensor type config ─────────────────────────────────────
const SENSOR_TYPE_CONFIG = {
  TEMPERATURE: {
    label: 'Nhiệt độ',
    icon: <Thermometer className="w-3.5 h-3.5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  HUMIDITY: {
    label: 'Độ ẩm',
    icon: <Droplets className="w-3.5 h-3.5" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  LIGHT: {
    label: 'Ánh sáng',
    icon: <Sun className="w-3.5 h-3.5" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ─── Sensor Type Badge ───────────────────────────────────────
function SensorTypeBadge({ type }: { type: SensorLog['sensorType'] }) {
  const config = SENSOR_TYPE_CONFIG[type];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.color, config.bg, config.border
    )}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Table Row Animation ────────────────────────────────────
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
};

// ─── SensorData Page ─────────────────────────────────────────
export default function SensorDataPage() {
  const [searchId, setSearchId] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter logic (mock)
  const filteredData = mockSensorLogs.filter(log => {
    const matchId = searchId === '' || log.id.toLowerCase().includes(searchId.toLowerCase());
    const matchType = selectedType === 'ALL' || log.sensorType === selectedType;
    return matchId && matchType;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = useCallback(async () => {
    setIsFiltering(true);
    await new Promise(r => setTimeout(r, 400));
    setPage(1);
    setIsFiltering(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsRefreshing(false);
  }, []);

  const handleReset = () => {
    setSearchId('');
    setSelectedType('ALL');
    setPage(1);
  };

  // Summary counts
  const summaryCounts = {
    total: mockSensorLogs.length,
    TEMPERATURE: mockSensorLogs.filter(l => l.sensorType === 'TEMPERATURE').length,
    HUMIDITY: mockSensorLogs.filter(l => l.sensorType === 'HUMIDITY').length,
    LIGHT: mockSensorLogs.filter(l => l.sensorType === 'LIGHT').length,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Sensor Data"
          subtitle="Lịch sử dữ liệu cảm biến"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'total', label: 'Tổng bản ghi', value: summaryCounts.total, icon: <SlidersHorizontal className="w-4 h-4" />, color: 'text-slate-300', bg: 'bg-slate-700/50' },
              { key: 'TEMPERATURE', label: 'Nhiệt độ', value: summaryCounts.TEMPERATURE, icon: <Thermometer className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { key: 'HUMIDITY', label: 'Độ ẩm', value: summaryCounts.HUMIDITY, icon: <Droplets className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { key: 'LIGHT', label: 'Ánh sáng', value: summaryCounts.LIGHT, icon: <Sun className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            ].map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-3 flex items-center gap-3 cursor-default"
              >
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', item.bg, item.color)}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className={clsx('text-lg font-bold', item.color)}>{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filter Panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            {/* Filter header */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                Bộ lọc
              </div>
              <motion.div animate={{ rotate: showFilter ? 0 : -90 }} transition={{ duration: 0.2 }}>
                <ChevronLeft className="w-4 h-4 text-slate-400 rotate-90" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-slate-700/50"
                >
                  <div className="p-5">
                    <div className="flex flex-wrap gap-4 items-end">
                      {/* Search by ID */}
                      <div className="flex-1 min-w-48">
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium">Tìm theo ID</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Nhập ID bản ghi..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                          />
                        </div>
                      </div>

                      {/* Type Filter */}
                      <div className="flex-1 min-w-48">
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium">Loại cảm biến</label>
                        <select
                          value={selectedType}
                          onChange={e => setSelectedType(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                        >
                          <option value="ALL">Tất cả loại</option>
                          <option value="TEMPERATURE">Nhiệt độ</option>
                          <option value="HUMIDITY">Độ ẩm</option>
                          <option value="LIGHT">Ánh sáng</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSearch}
                          disabled={isFiltering}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200"
                        >
                          <Search className="w-3.5 h-3.5" />
                          {isFiltering ? 'Đang tìm...' : 'Tìm kiếm'}
                        </button>
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-all duration-200"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card overflow-hidden"
          >
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">{filteredData.length}</span> bản ghi
              </p>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all">
                <Download className="w-3.5 h-3.5" />
                Xuất CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['ID', 'Tên cảm biến', 'Loại', 'Giá trị', 'Đơn vị', 'Thời điểm đo'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedData.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: 20 }}
                        className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.id}</td>
                        <td className="px-4 py-3 text-slate-200 font-medium">{log.sensorName}</td>
                        <td className="px-4 py-3">
                          <SensorTypeBadge type={log.sensorType} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-white tabular-nums">{log.value.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{log.unit}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(log.recordedAt).toLocaleString('vi-VN')}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>

                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <Search className="w-8 h-8 opacity-30" />
                          <p>Không tìm thấy dữ liệu phù hợp</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  {PAGE_SIZE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">/ trang</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={clsx(
                        'w-7 h-7 text-xs font-medium rounded-lg transition-all',
                        page === pageNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-slate-400 hidden sm:block">
                Trang {page} / {totalPages || 1}
              </span>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
