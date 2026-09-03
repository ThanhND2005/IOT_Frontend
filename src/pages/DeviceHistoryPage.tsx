import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, ChevronLeft, ChevronRight, Download,
  CheckCircle2, XCircle, Clock, Zap, ZapOff, History, RefreshCw,
  Search, RotateCcw, Calendar, Cpu, Lightbulb, Fan, SlidersHorizontal, X
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { DeviceHistoryItem, SearchParam, ActionStatus, ActionType, DeviceType } from '../types';
import { deviceService } from '../services';

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
  }[status] || {
    label: status,
    icon: <Clock className="w-3 h-3" />,
    className: 'badge-pending',
  };

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

// ─── Device Type Badge ───────────────────────────────────────
function DeviceTypeBadge({ type, deviceName }: { type?: DeviceType | string | null; deviceName?: string }) {
  let resolvedType = type;
  if (!resolvedType && deviceName) {
    const lower = deviceName.toLowerCase();
    if (lower.includes('led') || lower.includes('đèn')) resolvedType = 'LED';
    else if (lower.includes('relay') || lower.includes('rơ-le')) resolvedType = 'RELAY';
    else if (lower.includes('fan') || lower.includes('quạt')) resolvedType = 'FAN';
  }

  if (!resolvedType) return <span className="text-slate-500">—</span>;

  const config = {
    LED: {
      label: 'LED',
      icon: <Lightbulb className="w-3 h-3" />,
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    },
    RELAY: {
      label: 'RELAY',
      icon: <Cpu className="w-3 h-3" />,
      className: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    },
    FAN: {
      label: 'FAN',
      icon: <Fan className="w-3 h-3" />,
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    },
  }[resolvedType as DeviceType] || {
    label: resolvedType,
    icon: <SlidersHorizontal className="w-3 h-3" />,
    className: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border', config.className)}>
      {config.icon}
      {config.label}
    </span>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Normalize user-entered date/time to ISO-compatible format for database query
function normalizeSearchTime(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Case 1: "HH:mm DD/MM/YYYY" or "HH:mm:ss DD/MM/YYYY"
  const timeFirstMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (timeFirstMatch) {
    const time = timeFirstMatch[1];
    const day = timeFirstMatch[2].padStart(2, '0');
    const month = timeFirstMatch[3].padStart(2, '0');
    const year = timeFirstMatch[4];
    return `${year}-${month}-${day} ${time}`;
  }

  // Case 2: "DD/MM/YYYY" or "DD/MM/YYYY HH:mm"
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(.*)$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    const rest = ddmmyyyyMatch[4] ? ddmmyyyyMatch[4].trim() : '';
    return rest ? `${year}-${month}-${day} ${rest}` : `${year}-${month}-${day}`;
  }

  return trimmed;
}

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

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.02, duration: 0.25 },
  }),
};

// ─── Device History Page ─────────────────────────────────────
export default function DeviceHistoryPage() {
  const [searchTime, setSearchTime] = useState<string>('');
  const [appliedSearchTime, setAppliedSearchTime] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<ActionStatus | 'ALL'>('ALL');
  const [selectedAction, setSelectedAction] = useState<ActionType | 'ALL'>('ALL');
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | 'ALL'>('ALL');

  const datePickerRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [historyItems, setHistoryItems] = useState<DeviceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Fetch device history from API
  const fetchHistory = useCallback(
    async (
      targetPage = page,
      targetPageSize = pageSize,
      targetTime = appliedSearchTime,
      targetStatus = selectedStatus,
      targetAction = selectedAction,
      targetDeviceType = selectedDeviceType
    ) => {
      setIsLoading(true);
      try {
        const filters: SearchParam[] = [];

        // 1. Lọc theo trạng thái thực hiện (ActionStatus: PENDING, SUCCESS, ERROR)
        if (targetStatus !== 'ALL') {
          filters.push({
            field: 'status',
            value: targetStatus,
            operate: 'EQUAL',
            type: 'ENUM',
          });
        }

        // 2. Lọc theo loại hành động (ActionType: ON, OFF)
        if (targetAction !== 'ALL') {
          filters.push({
            field: 'action',
            value: targetAction,
            operate: 'EQUAL',
            type: 'ENUM',
          });
        }

        // 3. Lọc theo loại thiết bị (DeviceType: LED, RELAY, FAN)
        if (targetDeviceType !== 'ALL') {
          filters.push({
            field: 'device.deviceType',
            value: targetDeviceType,
            operate: 'EQUAL',
            type: 'ENUM',
          });
        }

        // 4. Tìm kiếm theo thời điểm đo / thao tác (createdAt)
        const queryTime = targetTime.trim();
        if (queryTime) {
          filters.push({
            field: 'createdAt',
            value: queryTime,
            operate: 'LIKE',
            type: 'STRING',
          });
        }

        const res = await deviceService.searchDeviceHistory(targetPage, targetPageSize, {
          filters,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
        });

        if (res) {
          const records = res.items || res.content || [];
          setHistoryItems(records);
          setTotalPages(res.totalPages || 1);
          setTotalElements(res.totalElements || 0);
        }
      } catch (err) {
        console.error('Failed to fetch device history:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize, appliedSearchTime, selectedStatus, selectedAction, selectedDeviceType]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHistory();
    setIsRefreshing(false);
  }, [fetchHistory]);

  const handleSearch = () => {
    const normalized = normalizeSearchTime(searchTime);
    setAppliedSearchTime(normalized);
    setPage(1);
    if (page === 1 && normalized === appliedSearchTime) {
      fetchHistory(1, pageSize, normalized, selectedStatus, selectedAction, selectedDeviceType);
    }
  };

  const handleReset = () => {
    setSearchTime('');
    setAppliedSearchTime('');
    setSelectedStatus('ALL');
    setSelectedAction('ALL');
    setSelectedDeviceType('ALL');
    setPage(1);
    fetchHistory(1, pageSize, '', 'ALL', 'ALL', 'ALL');
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status as ActionStatus | 'ALL');
    setPage(1);
  };

  const handleActionFilter = (action: string) => {
    setSelectedAction(action as ActionType | 'ALL');
    setPage(1);
  };

  const handleDeviceTypeFilter = (devType: string) => {
    setSelectedDeviceType(devType as DeviceType | 'ALL');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (historyItems.length === 0) return;
    const headers = ['ID', 'Thiết bị', 'Loại thiết bị', 'Hành động', 'Trạng thái', 'Thời gian xử lý (ms)', 'Lỗi', 'Người thực hiện', 'Thời điểm'];
    const rows = historyItems.map((item) => [
      item.id,
      `"${item.deviceName || ''}"`,
      `"${item.deviceType || ''}"`,
      item.action,
      item.status,
      item.executionTimeMs ?? '',
      `"${item.errorMessage || ''}"`,
      `"${item.fullName || 'Admin'}"`,
      `"${new Date(item.createdAt).toLocaleString('vi-VN')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `device_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active filter count
  const activeFilterCount = [
    appliedSearchTime !== '',
    selectedStatus !== 'ALL',
    selectedAction !== 'ALL',
    selectedDeviceType !== 'ALL',
  ].filter(Boolean).length;

  // Summary counts based on loaded items
  const summary = {
    total: totalElements,
    SUCCESS: historyItems.filter((h) => h.status === 'SUCCESS').length,
    ERROR: historyItems.filter((h) => h.status === 'ERROR').length,
    PENDING: historyItems.filter((h) => h.status === 'PENDING').length,
  };

  const summaryCards: {
    key: ActionStatus | 'ALL';
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }[] = [
    { key: 'ALL', label: 'Tổng thao tác', value: summary.total, icon: <History className="w-4 h-4" />, color: 'text-slate-300', bg: 'bg-slate-700/50' },
    { key: 'SUCCESS', label: 'Thành công (Trang)', value: summary.SUCCESS, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/10' },
    { key: 'ERROR', label: 'Lỗi (Trang)', value: summary.ERROR, icon: <XCircle className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/10' },
    { key: 'PENDING', label: 'Đang xử lý (Trang)', value: summary.PENDING, icon: <Clock className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
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
                onClick={() => handleStatusFilter(item.key)}
                className={clsx(
                  'glass-card p-3 flex items-center gap-3 cursor-pointer transition-all duration-200',
                  selectedStatus === item.key && 'border-blue-500/40 shadow-blue-500/10 shadow-md'
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
              <div className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-blue-400" />
                <span>Bộ lọc tìm kiếm lịch sử</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-medium">
                    {activeFilterCount} bộ lọc đang áp dụng
                  </span>
                )}
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
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 1. Thanh tìm kiếm theo thời điểm đo */}
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 flex items-center justify-between font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            Thời điểm đo
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            VD: 2026-09-02, 14:30
                          </span>
                        </label>
                        <div className="relative flex items-center">
                          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            value={searchTime}
                            onChange={(e) => setSearchTime(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Nhập ngày, giờ (2026-09-02, 14:30...)"
                            className="w-full pl-9 pr-16 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                          />
                          <div className="absolute right-2.5 flex items-center gap-1">
                            {searchTime && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchTime('');
                                  setAppliedSearchTime('');
                                  setPage(1);
                                  fetchHistory(1, pageSize, '', selectedStatus, selectedAction, selectedDeviceType);
                                }}
                                className="p-0.5 text-slate-400 hover:text-slate-200 rounded"
                                title="Xóa tìm kiếm"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  datePickerRef.current?.showPicker();
                                } catch {
                                  datePickerRef.current?.focus();
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                              title="Mở lịch chọn ngày"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            ref={datePickerRef}
                            type="date"
                            className="sr-only"
                            onChange={(e) => {
                              if (e.target.value) {
                                setSearchTime(e.target.value);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* 2. Dropdown lọc theo trạng thái thực hiện */}
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          Trạng thái thực hiện
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => handleStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
                        >
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="SUCCESS">Thành công (SUCCESS)</option>
                          <option value="ERROR">Lỗi (ERROR)</option>
                          <option value="PENDING">Đang xử lý (PENDING)</option>
                        </select>
                      </div>

                      {/* 3. Dropdown lọc theo loại hành động */}
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-yellow-400" />
                          Loại hành động
                        </label>
                        <select
                          value={selectedAction}
                          onChange={(e) => handleActionFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
                        >
                          <option value="ALL">Tất cả hành động</option>
                          <option value="ON">Bật thiết bị (ON)</option>
                          <option value="OFF">Tắt thiết bị (OFF)</option>
                        </select>
                      </div>

                      {/* 4. Dropdown lọc theo loại thiết bị */}
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-medium">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                          Loại thiết bị
                        </label>
                        <select
                          value={selectedDeviceType}
                          onChange={(e) => handleDeviceTypeFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer"
                        >
                          <option value="ALL">Tất cả loại thiết bị</option>
                          <option value="LED">Đèn LED (LED)</option>
                          <option value="RELAY">Rơ-le (RELAY)</option>
                          <option value="FAN">Quạt (FAN)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/60">
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg border border-slate-700 transition-all duration-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Đặt lại
                      </button>
                      <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm shadow-blue-500/25"
                      >
                        <Search className="w-4 h-4" />
                        {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                      </button>
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-white">{totalElements}</span> thao tác tìm thấy
              </p>
              <button
                onClick={handleExportCSV}
                disabled={historyItems.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    {['ID', 'Thiết bị', 'Loại thiết bị', 'Hành động', 'Trạng thái', 'Thời gian xử lý', 'Người thực hiện', 'Thời điểm'].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                          <p>Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {historyItems.map((item, i) => (
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
                          <td className="px-4 py-3 whitespace-nowrap">
                            <DeviceTypeBadge type={item.deviceType} deviceName={item.deviceName} />
                          </td>
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
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{item.fullName || 'Admin'}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}

                  {!isLoading && historyItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
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
                const item = historyItems.find((h) => h.id === selectedRow);
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
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500/50"
                >
                  {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
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

                {getPaginationRange(page, totalPages).map((pn) => (
                  <button
                    key={pn}
                    onClick={() => setPage(pn)}
                    className={clsx(
                      'w-7 h-7 text-xs font-medium rounded-lg transition-all',
                      page === pn
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    )}
                  >
                    {pn}
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
