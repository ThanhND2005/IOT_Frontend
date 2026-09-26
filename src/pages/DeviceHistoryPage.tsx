import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Filter, ChevronLeft, ChevronRight, ChevronDown,
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
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      className: 'badge-success',
    },
    ERROR: {
      label: 'Lỗi',
      icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
      className: 'badge-error',
    },
    PENDING: {
      label: 'Đang xử lý',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
      className: 'badge-pending',
    },
  }[status] || {
    label: status,
    icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    className: 'badge-pending',
  };

  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', config.className)}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Action Badge ────────────────────────────────────────────
function ActionBadge({ action }: { action: 'ON' | 'OFF' }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
      action === 'ON'
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : 'bg-slate-100 text-slate-700 border border-slate-200'
    )}>
      {action === 'ON' ? <Zap className="w-3.5 h-3.5 text-blue-600" /> : <ZapOff className="w-3.5 h-3.5 text-slate-500" />}
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

  if (!resolvedType) return <span className="text-slate-400">—</span>;

  const config = {
    LED: {
      label: 'LED',
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-600" />,
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    RELAY: {
      label: 'RELAY',
      icon: <Cpu className="w-3.5 h-3.5 text-cyan-600" />,
      className: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    },
    FAN: {
      label: 'FAN',
      icon: <Fan className="w-3.5 h-3.5 text-emerald-600" />,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  }[resolvedType as DeviceType] || {
    label: resolvedType,
    icon: <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
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
    { key: 'ALL', label: 'Tổng thao tác', value: summary.total, icon: <History className="w-4 h-4 text-indigo-600" />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { key: 'SUCCESS', label: 'Thành công (Trang)', value: summary.SUCCESS, icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    { key: 'ERROR', label: 'Lỗi (Trang)', value: summary.ERROR, icon: <XCircle className="w-4 h-4 text-red-600" />, color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
    { key: 'PENDING', label: 'Đang xử lý (Trang)', value: summary.PENDING, icon: <Clock className="w-4 h-4 text-amber-600" />, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-white">
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
            {summaryCards.map((item) => (
              <div
                key={item.key}
                onClick={() => handleStatusFilter(item.key)}
                className={clsx(
                  'glass-card p-3 flex items-center gap-3 cursor-pointer',
                  selectedStatus === item.key && 'border-blue-500 shadow-sm'
                )}
              >
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center border', item.bg)}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={clsx('text-lg font-bold', item.color)}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Panel */}
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Bộ lọc tìm kiếm lịch sử</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium">
                    {activeFilterCount} bộ lọc đang áp dụng
                  </span>
                )}
              </div>
              <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', showFilter && 'rotate-180')} />
            </button>

            {showFilter && (
              <div className="overflow-hidden border-t border-slate-200">
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* 1. Thanh tìm kiếm theo thời điểm đo */}
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 flex items-center justify-between font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            Thời điểm đo
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
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
                            className="w-full pl-9 pr-16 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded"
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
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
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
                        <label className="text-xs text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Trạng thái thực hiện
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => handleStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="SUCCESS">Thành công (SUCCESS)</option>
                          <option value="ERROR">Lỗi (ERROR)</option>
                          <option value="PENDING">Đang xử lý (PENDING)</option>
                        </select>
                      </div>

                      {/* 3. Dropdown lọc theo loại hành động */}
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Loại hành động
                        </label>
                        <select
                          value={selectedAction}
                          onChange={(e) => handleActionFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="ALL">Tất cả hành động</option>
                          <option value="ON">Bật thiết bị (ON)</option>
                          <option value="OFF">Tắt thiết bị (OFF)</option>
                        </select>
                      </div>

                      {/* 4. Dropdown lọc theo loại thiết bị */}
                      <div>
                        <label className="text-xs text-slate-600 mb-1.5 flex items-center gap-1.5 font-medium">
                          <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                          Loại thiết bị
                        </label>
                        <select
                          value={selectedDeviceType}
                          onChange={(e) => handleDeviceTypeFilter(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="ALL">Tất cả loại thiết bị</option>
                          <option value="LED">Đèn LED (LED)</option>
                          <option value="RELAY">Rơ-le (RELAY)</option>
                          <option value="FAN">Quạt (FAN)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-all duration-200 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                        Đặt lại
                      </button>
                      <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 text-white" />
                        )}
                        {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{totalElements}</span> thao tác tìm thấy
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {['ID', 'Thiết bị', 'Loại thiết bị', 'Hành động', 'Trạng thái', 'Thời gian xử lý', 'Người thực hiện', 'Thời điểm'].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                          <p>Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRow(selectedRow === item.id ? null : item.id)}
                        className={clsx(
                          'border-b border-slate-100 cursor-pointer',
                          selectedRow === item.id ? 'bg-blue-50/60 border-l-2 border-l-blue-600' : 'hover:bg-slate-50/80'
                        )}
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">{item.id}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{item.deviceName}</td>
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
                            <span className="text-emerald-700 font-medium">{item.executionTimeMs}ms</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{item.fullName || 'Admin'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}

                  {!isLoading && historyItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <History className="w-8 h-8 text-slate-300" />
                          <p>Không có dữ liệu lịch sử</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Error detail row */}
            {selectedRow && (() => {
              const item = historyItems.find((h) => h.id === selectedRow);
              if (!item?.errorMessage) return null;
              return (
                <div
                  key="error-detail"
                  className="overflow-hidden border-t border-red-200 bg-red-50"
                >
                  <div className="px-5 py-3 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-0.5">Chi tiết lỗi — {item.deviceName}</p>
                      <p className="text-xs text-red-600">{item.errorMessage}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="text-xs text-slate-500">/ trang</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                {getPaginationRange(page, totalPages).map((pn) => (
                  <button
                    key={pn}
                    onClick={() => setPage(pn)}
                    className={clsx(
                      'w-7 h-7 text-xs font-medium rounded-lg transition-all cursor-pointer',
                      page === pn
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {pn}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <span className="text-xs text-slate-500 hidden sm:block">
                Trang {page} / {totalPages || 1}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
