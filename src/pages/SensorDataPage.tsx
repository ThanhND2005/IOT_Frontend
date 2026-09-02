import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, ChevronLeft, ChevronRight,
  Thermometer, Droplets, Sun, Download, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { SensorLog, SearchParam } from '../types';
import { sensorService } from '../services';

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

// UUID regex check
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getPaginationRange(currentPage: number, totalPages: number, maxVisible = 5): number[] {
  if (totalPages <= 0) return [1];
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ─── Sensor Type Badge ───────────────────────────────────────
function SensorTypeBadge({ type }: { type: SensorLog['sensorType'] }) {
  const config = SENSOR_TYPE_CONFIG[type] || {
    label: type,
    icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
  };

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
    transition: { delay: i * 0.02, duration: 0.25 },
  }),
};

// ─── SensorData Page ─────────────────────────────────────────
export default function SensorDataPage() {
  const [searchId, setSearchId] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [sensorLogs, setSensorLogs] = useState<SensorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch sensor logs from backend API
  const fetchLogs = useCallback(async (targetPage = page, targetPageSize = pageSize, targetSearch = appliedSearch) => {
    setIsLoading(true);
    try {
      const filters: SearchParam[] = [];

      if (selectedType !== 'ALL') {
        filters.push({
          field: 'sensor.sensorType',
          value: selectedType,
          operate: 'EQUAL',
          type: 'ENUM',
        });
      }

      const query = targetSearch.trim();
      if (query) {
        if (UUID_REGEX.test(query)) {
          filters.push({
            field: 'id',
            value: query,
            operate: 'EQUAL',
            type: 'UUID',
          });
        } else {
          filters.push({
            field: 'sensor.sensorName',
            value: query,
            operate: 'LIKE',
            type: 'STRING',
          });
        }
      }

      const res = await sensorService.searchSensorLogs(targetPage, targetPageSize, {
        filters,
        sortBy: 'recordedAt',
        sortDirection: 'DESC',
      });

      if (res) {
        const records = res.items || res.content || [];
        setSensorLogs(records);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to fetch sensor logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedType, appliedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    const trimmed = searchId.trim();
    setAppliedSearch(trimmed);
    setPage(1);
    if (page === 1 && trimmed === appliedSearch) {
      fetchLogs(1, pageSize, trimmed);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
  }, [fetchLogs]);

  const handleReset = () => {
    setSearchId('');
    setAppliedSearch('');
    setSelectedType('ALL');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (sensorLogs.length === 0) return;
    const headers = ['ID', 'Tên cảm biến', 'Loại', 'Giá trị', 'Đơn vị', 'Thời điểm đo'];
    const rows = sensorLogs.map((log) => [
      log.id,
      `"${log.sensorName || ''}"`,
      log.sensorType,
      log.value,
      log.unit,
      `"${new Date(log.recordedAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sensor_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary counts based on loaded data
  const summaryCounts = {
    total: totalElements,
    TEMPERATURE: sensorLogs.filter(l => l.sensorType === 'TEMPERATURE').length,
    HUMIDITY: sensorLogs.filter(l => l.sensorType === 'HUMIDITY').length,
    LIGHT: sensorLogs.filter(l => l.sensorType === 'LIGHT').length,
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
              { key: 'TEMPERATURE', label: 'Nhiệt độ (Trang)', value: summaryCounts.TEMPERATURE, icon: <Thermometer className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { key: 'HUMIDITY', label: 'Độ ẩm (Trang)', value: summaryCounts.HUMIDITY, icon: <Droplets className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { key: 'LIGHT', label: 'Ánh sáng (Trang)', value: summaryCounts.LIGHT, icon: <Sun className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
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
                Bộ lọc tìm kiếm
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
                      {/* Search by ID or Name */}
                      <div className="flex-1 min-w-48">
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium">Tìm theo ID hoặc Tên cảm biến</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Nhập UUID bản ghi hoặc tên cảm biến..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                          />
                        </div>
                      </div>

                      {/* Type Filter */}
                      <div className="flex-1 min-w-48">
                        <label className="text-xs text-slate-400 mb-1.5 block font-medium">Loại cảm biến</label>
                        <select
                          value={selectedType}
                          onChange={(e) => {
                            setSelectedType(e.target.value);
                            setPage(1);
                          }}
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
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200"
                        >
                          <Search className="w-3.5 h-3.5" />
                          {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
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
                <span className="font-semibold text-white">{totalElements}</span> bản ghi tìm thấy
              </p>
              <button
                onClick={handleExportCSV}
                disabled={sensorLogs.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['ID', 'Tên cảm biến', 'Loại', 'Giá trị', 'Đơn vị', 'Thời điểm đo'].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                          <p>Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {sensorLogs.map((log, i) => (
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
                          <td className="px-4 py-3 text-slate-200 font-medium">{log.sensorName || 'Cảm biến'}</td>
                          <td className="px-4 py-3">
                            <SensorTypeBadge type={log.sensorType} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-white tabular-nums">
                              {typeof log.value === 'number' ? log.value.toFixed(1) : log.value}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{log.unit}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(log.recordedAt).toLocaleString('vi-VN')}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}

                  {!isLoading && sensorLogs.length === 0 && (
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
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">/ trang</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPaginationRange(page, totalPages).map((pageNum) => (
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
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
