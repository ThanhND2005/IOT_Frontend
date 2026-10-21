import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Filter, ChevronLeft, ChevronRight, ChevronDown,
  CheckCircle2, XCircle, Clock, Zap, ZapOff, History, RefreshCw,
  Search, RotateCcw, Calendar, Cpu, Lightbulb, Fan, SlidersHorizontal, X, ArrowUpDown,
  Copy, Check
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { DeviceHistoryItem, SearchParam, ActionStatus, ActionType, DeviceType, Device } from '../types';
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

function formatDateTime(dateInput: string | number | Date): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return String(dateInput);
  }
}

// Normalize user-entered date/time to ISO-compatible format for database query
// Ưu tiên: Năm -> Tháng -> Ngày -> Giờ -> Phút -> Giây
function normalizeSearchTime(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Case 0: Format dạng Ngày trước "DD/MM/YYYY" hoặc "DD/MM/YYYY HH:mm:ss"
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(.*)$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    const rest = ddmmyyyyMatch[4] ? ddmmyyyyMatch[4].trim() : '';
    return rest ? `${year}/${month}/${day} ${rest}` : `${year}/${month}/${day}`;
  }

  // Case 1: Format Giờ trước "HH:mm DD/MM/YYYY" hoặc "HH:mm:ss DD/MM/YYYY"
  const timeFirstMatch = trimmed.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (timeFirstMatch) {
    const time = timeFirstMatch[1];
    const day = timeFirstMatch[2].padStart(2, '0');
    const month = timeFirstMatch[3].padStart(2, '0');
    const year = timeFirstMatch[4];
    return `${year}/${month}/${day} ${time}`;
  }

  // Case 2: Format Năm trước "YYYY/MM/DD..." hoặc "YYYY-MM-DD..."
  const yyyymmddMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(.*)$/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    const rest = yyyymmddMatch[4] ? yyyymmddMatch[4].trim() : '';
    return rest ? `${year}/${month}/${day} ${rest}` : `${year}/${month}/${day}`;
  }

  // Case 3: Format Năm/Tháng "YYYY/MM" hoặc "YYYY-MM"
  const yyyymmMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})$/);
  if (yyyymmMatch) {
    const year = yyyymmMatch[1];
    const month = yyyymmMatch[2].padStart(2, '0');
    return `${year}/${month}`;
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<ActionType | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ActionStatus | 'ALL'>('ALL');
  const [searchTime, setSearchTime] = useState('');
  const [appliedSearchTime, setAppliedSearchTime] = useState('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyTime = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  // Fetch devices from API on component mount
  useEffect(() => {
    deviceService
      .getAllDevices()
      .then((res) => {
        if (res && res.length > 0) {
          setDevices(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load devices:', err);
      });
  }, []);

  // Distinct device names from system devices, loaded history, or fallback defaults
  const deviceOptions = useMemo(() => {
    const names = new Set<string>();
    devices.forEach((d) => {
      if (d.deviceName) names.add(d.deviceName);
    });
    historyItems.forEach((h) => {
      if (h.deviceName) names.add(h.deviceName);
    });
    if (names.size === 0) {
      names.add('Đèn LED 1');
      names.add('Đèn LED 2');
    }
    return Array.from(names);
  }, [devices, historyItems]);

  // Fetch device history from API
  const fetchHistory = useCallback(
    async (
      targetPage = page,
      targetPageSize = pageSize,
      targetDevice = selectedDevice,
      targetAction = selectedAction,
      targetStatus = selectedStatus,
      targetTime = appliedSearchTime,
      targetSortOrder = sortOrder
    ) => {
      setIsLoading(true);
      try {
        const filters: SearchParam[] = [];

        // 1. Lọc theo thiết bị (device.deviceName)
        if (targetDevice !== 'ALL') {
          filters.push({
            field: 'device.deviceName',
            value: targetDevice,
            operate: 'EQUAL',
            type: 'STRING',
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

        // 3. Lọc theo trạng thái thực hiện (ActionStatus: PENDING, SUCCESS, ERROR)
        if (targetStatus !== 'ALL') {
          filters.push({
            field: 'status',
            value: targetStatus,
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
          sortDirection: targetSortOrder,
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
    [page, pageSize, selectedDevice, selectedAction, selectedStatus, appliedSearchTime, sortOrder]
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
    const normalizedTime = normalizeSearchTime(searchTime);
    setAppliedSearchTime(normalizedTime);
    setPage(1);
    if (page === 1 && normalizedTime === appliedSearchTime) {
      fetchHistory(1, pageSize, selectedDevice, selectedAction, selectedStatus, normalizedTime, sortOrder);
    }
  };

  const handleReset = () => {
    setSelectedDevice('ALL');
    setSelectedAction('ALL');
    setSelectedStatus('ALL');
    setSortOrder('DESC');
    setSearchTime('');
    setAppliedSearchTime('');
    setPage(1);
    fetchHistory(1, pageSize, 'ALL', 'ALL', 'ALL', '', 'DESC');
  };


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

        <main className="flex-1 min-h-0 overflow-hidden p-4 md:p-6 flex flex-col gap-3.5">
          {/* Filter Panel */}
          <div className="glass-card overflow-hidden shrink-0">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-between px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Bộ lọc tìm kiếm lịch sử</span>
              </div>
              <ChevronDown className={clsx('w-4 h-4 text-slate-400 transition-transform', showFilter && 'rotate-180')} />
            </button>

            {showFilter && (
              <div className="overflow-hidden border-t border-slate-200">
                <div className="p-4 space-y-3">
                  {/* Dòng 1: 4 Dropdown bộ lọc */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Dropdown lọc thiết bị */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        Thiết bị
                      </label>
                      <select
                        value={selectedDevice}
                        onChange={(e) => {
                          setSelectedDevice(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="ALL">Tất cả thiết bị</option>
                        {deviceOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Dropdown lọc hành động */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Loại hành động
                      </label>
                      <select
                        value={selectedAction}
                        onChange={(e) => {
                          setSelectedAction(e.target.value as ActionType | 'ALL');
                          setPage(1);
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="ALL">Tất cả hành động</option>
                        <option value="ON">Bật thiết bị</option>
                        <option value="OFF">Tắt thiết bị</option>
                      </select>
                    </div>

                    {/* 3. Dropdown lọc trạng thái */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Trạng thái thực hiện
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => {
                          setSelectedStatus(e.target.value as ActionStatus | 'ALL');
                          setPage(1);
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="SUCCESS">Thành công</option>
                        <option value="ERROR">Lỗi</option>
                        <option value="PENDING">Đang xử lý</option>
                      </select>
                    </div>

                    {/* 4. Dropdown sắp xếp theo thời gian */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                        <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                        Sắp xếp theo thời gian
                      </label>
                      <select
                        value={sortOrder}
                        onChange={(e) => {
                          setSortOrder(e.target.value as 'DESC' | 'ASC');
                          setPage(1);
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="DESC">Mới nhất trước (Giảm dần)</option>
                        <option value="ASC">Cũ nhất trước (Tăng dần)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dòng 2: Ô điền tìm kiếm theo thời gian + Cụm nút thao tác */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
                    {/* Ô điền tìm kiếm theo thời gian */}
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        Thời điểm thao tác
                      </label>
                      <div className="relative flex items-center">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={searchTime}
                          onChange={(e) => setSearchTime(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="--:--:--"
                          className="w-full pl-9 pr-16 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <div className="absolute right-2.5 flex items-center gap-1">
                          {searchTime && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchTime('');
                                setAppliedSearchTime('');
                                setPage(1);
                                fetchHistory(1, pageSize, selectedDevice, selectedAction, selectedStatus, '', sortOrder);
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Xóa tìm kiếm thời gian"
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
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
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

                    {/* Cụm nút: Đặt lại & Tìm kiếm */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-all duration-200 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                        Đặt lại
                      </button>
                      <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm cursor-pointer"
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
              </div>
            )}
          </div>

          {/* Table Card */}
          <div className="glass-card overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{totalElements}</span> thao tác tìm thấy
                </p>
              </div>
            </div>

            {/* Table Scrollable Container */}
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    {['ID', 'Thiết bị', 'Loại thiết bị', 'Hành động', 'Trạng thái', 'Thời gian xử lý', 'Người thực hiện', 'Thời điểm'].map((col) => (
                      <th
                        key={col}
                        className="sticky top-0 z-10 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap shadow-[0_1px_0_0_#e2e8f0]"
                      >
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
                          'cursor-pointer transition-colors',
                          selectedRow === item.id ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                        )}
                      >
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-400 border-b border-slate-100 whitespace-nowrap">{item.id}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium whitespace-nowrap border-b border-slate-100">{item.deviceName}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap border-b border-slate-100">
                          <DeviceTypeBadge type={item.deviceType} deviceName={item.deviceName} />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap border-b border-slate-100">
                          <ActionBadge action={item.action} />
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap border-b border-slate-100">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-2.5 text-xs tabular-nums whitespace-nowrap border-b border-slate-100">
                          {item.executionTimeMs != null ? (
                            <span className="text-emerald-700 font-medium">{item.executionTimeMs}ms</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">{item.fullName || 'Admin'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap border-b border-slate-100">
                          {(() => {
                            const formattedTime = formatDateTime(item.createdAt);
                            const isCopied = copiedId === item.id;
                            return (
                              <div className="flex items-center gap-1.5">
                                <span>{formattedTime}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyTime(item.id, formattedTime, e)}
                                  className={clsx(
                                    'p-1 rounded transition-colors cursor-pointer',
                                    isCopied
                                      ? 'text-emerald-600 bg-emerald-50'
                                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  )}
                                  title={isCopied ? 'Đã sao chép' : 'Sao chép thời điểm'}
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })()}
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
                  className="overflow-hidden border-t border-red-200 bg-red-50 shrink-0"
                >
                  <div className="px-5 py-2.5 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-0.5">Chi tiết lỗi — {item.deviceName}</p>
                      <p className="text-xs text-red-600">{item.errorMessage}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-200 shrink-0 bg-white">
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
