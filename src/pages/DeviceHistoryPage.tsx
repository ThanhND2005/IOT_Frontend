import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, ChevronLeft, ChevronRight, Download,
  CheckCircle2, XCircle, Clock, Zap, ZapOff, History
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { mockDeviceHistory, type DeviceHistoryItem } from '../mock/data';

// ─── Status Badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: DeviceHistoryItem['status'] }) {
  const config = {
    SUCCESS: {
      label: 'Thành công',
      icon: <CheckCircle2 className="w-3 h-3" />,
      className: 'badge-success',
    },
    ERROR: {
      label: 'Lỗi',
      icon: <XCircle className="w-3 h-3" />,
      className: 'badge-error',
    },
    PENDING: {
      label: 'Đang xử lý',
      icon: <Clock className="w-3 h-3 animate-spin" />,
      className: 'badge-pending',
    },
  }[status];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className)}
    >
      {config.icon}
      {config.label}
    </motion.span>
  );
}

// ─── Action Badge ────────────────────────────────────────────
function ActionBadge({ action }: { action: 'ON' | 'OFF' }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
      action === 'ON'
        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
        : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
    )}>
      {action === 'ON' ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
      {action}
    </span>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
};

// ─── Device History Page ─────────────────────────────────────
export default function DeviceHistoryPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilter, setShowFilter] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Filter
  const filteredData = mockDeviceHistory.filter(h => {
    return selectedStatus === 'ALL' || h.status === selectedStatus;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setIsRefreshing(false);
  }, []);

  // Summary
  const summary = {
    total: mockDeviceHistory.length,
    SUCCESS: mockDeviceHistory.filter(h => h.status === 'SUCCESS').length,
    ERROR: mockDeviceHistory.filter(h => h.status === 'ERROR').length,
    PENDING: mockDeviceHistory.filter(h => h.status === 'PENDING').length,
  };

  const summaryCards = [
    { key: 'total', label: 'Tổng thao tác', value: summary.total, icon: <History className="w-4 h-4" />, color: 'text-slate-300', bg: 'bg-slate-700/50' },
    { key: 'SUCCESS', label: 'Thành công', value: summary.SUCCESS, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/10' },
    { key: 'ERROR', label: 'Lỗi', value: summary.ERROR, icon: <XCircle className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { key: 'PENDING', label: 'Đang xử lý', value: summary.PENDING, icon: <Clock className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  const statusFilters = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'SUCCESS', label: 'Thành công' },
    { value: 'ERROR', label: 'Lỗi' },
    { value: 'PENDING', label: 'Đang xử lý' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Device History"
          subtitle="Lịch sử điều khiển thiết bị"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summaryCards.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedStatus(item.key === 'total' ? 'ALL' : item.key)}
                className={clsx(
                  'glass-card p-3 flex items-center gap-3 cursor-pointer transition-all duration-200',
                  (selectedStatus === item.key || (item.key === 'total' && selectedStatus === 'ALL')) && 'border-blue-500/40 shadow-blue-500/10 shadow-md'
                )}
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
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                Lọc theo trạng thái
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
                  <div className="p-5 flex flex-wrap gap-2">
                    {statusFilters.map(f => (
                      <button
                        key={f.value}
                        onClick={() => { setSelectedStatus(f.value); setPage(1); }}
                        className={clsx(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          selectedStatus === f.value
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-slate-700'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">{filteredData.length}</span> thao tác
              </p>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all">
                <Download className="w-3.5 h-3.5" />
                Xuất CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['ID', 'Thiết bị', 'Hành động', 'Trạng thái', 'Thời gian xử lý', 'Người thực hiện', 'Thời điểm'].map(col => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {paginatedData.map((item, i) => (
                      <motion.tr
                        key={item.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, scale: 0.98 }}
                        onClick={() => setSelectedRow(selectedRow === item.id ? null : item.id)}
                        className={clsx(
                          'border-b border-slate-800/50 transition-colors cursor-pointer',
                          selectedRow === item.id ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : 'hover:bg-slate-700/15'
                        )}
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{item.id}</td>
                        <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{item.deviceName}</td>
                        <td className="px-4 py-3">
                          <ActionBadge action={item.action} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums">
                          {item.executionTimeMs != null ? (
                            <span className="text-green-400 font-medium">{item.executionTimeMs}ms</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{item.fullName}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>

                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <History className="w-8 h-8 opacity-30" />
                          <p>Không có dữ liệu lịch sử</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Error detail row */}
            <AnimatePresence>
              {selectedRow && (() => {
                const item = paginatedData.find(h => h.id === selectedRow);
                if (!item?.errorMessage) return null;
                return (
                  <motion.div
                    key="error-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-700/50 bg-red-500/5"
                  >
                    <div className="px-5 py-3 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-0.5">Chi tiết lỗi — {item.deviceName}</p>
                        <p className="text-xs text-slate-400">{item.errorMessage}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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
                  const pn = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={pn}
                      onClick={() => setPage(pn)}
                      className={clsx(
                        'w-7 h-7 text-xs font-medium rounded-lg transition-all',
                        page === pn ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      )}
                    >
                      {pn}
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
