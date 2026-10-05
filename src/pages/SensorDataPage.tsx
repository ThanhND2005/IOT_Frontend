import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search, Filter, ChevronLeft, ChevronRight, ChevronDown,
  Thermometer, Droplets, Sun, SlidersHorizontal, RefreshCw,
  Database, RotateCcw, X, Calendar, ArrowUpDown, Hash
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { SensorLog, SearchParam, SearchOperation } from '../types';
import { sensorService } from '../services';

// ─── Sensor type config ─────────────────────────────────────
const SENSOR_TYPE_CONFIG = {
  TEMPERATURE: {
    label: 'Nhiệt độ',
    icon: <Thermometer className="w-3.5 h-3.5 text-orange-600" />,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  HUMIDITY: {
    label: 'Độ ẩm',
    icon: <Droplets className="w-3.5 h-3.5 text-blue-600" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  LIGHT: {
    label: 'Ánh sáng',
    icon: <Sun className="w-3.5 h-3.5 text-amber-600" />,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

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

// Parse value input supporting comparison operators (>=, <=, >, <, =) or text/numeric LIKE
function parseValueFilter(input: string): SearchParam | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Comparison matches: >=, <=, >, <, =
  const compMatch = trimmed.match(/^([><]=?|=)\s*([0-9]+(?:\.[0-9]+)?)$/);
  if (compMatch) {
    const opStr = compMatch[1];
    const num = compMatch[2];
    let operate: SearchOperation = 'EQUAL';
    if (opStr === '>=') operate = 'GREATER_THAN_EQUAL';
    else if (opStr === '<=') operate = 'LESS_THAN_EQUAL';
    else if (opStr === '>') operate = 'GREATER_THAN';
    else if (opStr === '<') operate = 'LESS_THAN';
    else if (opStr === '=') operate = 'EQUAL';

    return {
      field: 'value',
      value: num,
      operate,
      type: 'NUMBER',
    };
  }

  return {
    field: 'value',
    value: trimmed,
    operate: 'LIKE',
    type: 'STRING',
  };
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

// ─── Sensor Type Badge ───────────────────────────────────────
function SensorTypeBadge({ type }: { type: SensorLog['sensorType'] }) {
  const config = SENSOR_TYPE_CONFIG[type] || {
    label: type,
    icon: <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
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

// ─── SensorData Page ─────────────────────────────────────────
export default function SensorDataPage() {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [searchTime, setSearchTime] = useState('');
  const [appliedSearchTime, setAppliedSearchTime] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [appliedSearchValue, setAppliedSearchValue] = useState('');

  const datePickerRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [sensorLogs, setSensorLogs] = useState<SensorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch sensor logs from backend API
  const fetchLogs = useCallback(
    async (
      targetPage = page,
      targetPageSize = pageSize,
      targetType = selectedType,
      targetSortOrder = sortOrder,
      targetTime = appliedSearchTime,
      targetValue = appliedSearchValue
    ) => {
      setIsLoading(true);
      try {
        const filters: SearchParam[] = [];

        // 1. Lọc theo loại cảm biến (sensor.sensorType: TEMPERATURE, HUMIDITY, LIGHT)
        if (targetType !== 'ALL') {
          filters.push({
            field: 'sensor.sensorType',
            value: targetType,
            operate: 'EQUAL',
            type: 'ENUM',
          });
        }

        // 2. Tìm kiếm theo thời gian ghi nhận (recordedAt)
        const queryTime = targetTime.trim();
        if (queryTime) {
          filters.push({
            field: 'recordedAt',
            value: queryTime,
            operate: 'LIKE',
            type: 'STRING',
          });
        }

        // 3. Tìm kiếm theo giá trị cảm biến (value)
        const queryVal = targetValue.trim();
        if (queryVal) {
          const valFilter = parseValueFilter(queryVal);
          if (valFilter) {
            filters.push(valFilter);
          }
        }

        const res = await sensorService.searchSensorLogs(targetPage, targetPageSize, {
          filters,
          sortBy: 'recordedAt',
          sortDirection: targetSortOrder,
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
    },
    [page, pageSize, selectedType, sortOrder, appliedSearchTime, appliedSearchValue]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    const normalizedTime = normalizeSearchTime(searchTime);
    const trimmedVal = searchValue.trim();
    setAppliedSearchTime(normalizedTime);
    setAppliedSearchValue(trimmedVal);
    setPage(1);
    if (page === 1 && normalizedTime === appliedSearchTime && trimmedVal === appliedSearchValue) {
      fetchLogs(1, pageSize, selectedType, sortOrder, normalizedTime, trimmedVal);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
  }, [fetchLogs]);

  const handleReset = () => {
    setSelectedType('ALL');
    setSortOrder('DESC');
    setSearchTime('');
    setAppliedSearchTime('');
    setSearchValue('');
    setAppliedSearchValue('');
    setPage(1);
    fetchLogs(1, pageSize, 'ALL', 'DESC', '', '');
  };

  // Active filter count
  const activeFilterCount = [
    selectedType !== 'ALL',
    appliedSearchTime !== '',
    appliedSearchValue !== '',
    sortOrder !== 'DESC',
  ].filter(Boolean).length;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Sensor Data"
          subtitle="Lịch sử dữ liệu cảm biến"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 min-h-0 overflow-hidden p-4 md:p-6 flex flex-col gap-3.5">
          {/* Filter Panel */}
          <div className="glass-card overflow-hidden shrink-0">
            {/* Filter header */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-between px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Bộ lọc tìm kiếm dữ liệu cảm biến</span>
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
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Dropdown tìm kiếm theo loại cảm biến */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                        Loại cảm biến
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => {
                          setSelectedType(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="ALL">Tất cả loại cảm biến</option>
                        <option value="TEMPERATURE">Nhiệt độ (TEMPERATURE)</option>
                        <option value="HUMIDITY">Độ ẩm (HUMIDITY)</option>
                        <option value="LIGHT">Ánh sáng (LIGHT)</option>
                      </select>
                    </div>

                    {/* 2. Dropdown sắp xếp theo thời gian */}
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

                    {/* 3. Ô điền tìm kiếm theo thời gian */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center justify-between font-medium">
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
                                fetchLogs(1, pageSize, selectedType, sortOrder, '', appliedSearchValue);
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

                    {/* 4. Ô điền tìm kiếm theo giá trị */}
                    <div>
                      <label className="text-xs text-slate-600 mb-1 flex items-center justify-between font-medium">
                        <span className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-emerald-600" />
                          Giá trị cảm biến
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          VD: 28.5 hoặc &gt;30
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Nhập giá trị (28, 65, >30...)"
                          className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        {searchValue && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchValue('');
                              setAppliedSearchValue('');
                              setPage(1);
                              fetchLogs(1, pageSize, selectedType, sortOrder, appliedSearchTime, '');
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Xóa tìm kiếm giá trị"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5. Nút đặt lại & Nút tìm kiếm */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
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
            )}
          </div>

          {/* Table Card */}
          <div className="glass-card overflow-hidden flex-1 min-h-0 flex flex-col">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{totalElements}</span> bản ghi tìm thấy
                </p>
              </div>
            </div>

            {/* Table Scrollable Container */}
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    {['ID', 'Tên cảm biến', 'Loại', 'Giá trị', 'Đơn vị', 'Thời điểm đo'].map((col) => (
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
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                          <p>Đang tải dữ liệu...</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sensorLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-xs font-mono text-slate-400 border-b border-slate-100 whitespace-nowrap">{log.id}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium border-b border-slate-100 whitespace-nowrap">{log.sensorName || 'Cảm biến'}</td>
                        <td className="px-4 py-2.5 border-b border-slate-100 whitespace-nowrap">
                          <SensorTypeBadge type={log.sensorType} />
                        </td>
                        <td className="px-4 py-2.5 border-b border-slate-100 whitespace-nowrap">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {typeof log.value === 'number' ? log.value.toFixed(1) : log.value}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 border-b border-slate-100 whitespace-nowrap">{log.unit}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 border-b border-slate-100 whitespace-nowrap">
                          {new Date(log.recordedAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))
                  )}

                  {!isLoading && sensorLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-3">
                          <Search className="w-8 h-8 text-slate-300" />
                          <p>Không tìm thấy dữ liệu phù hợp</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">/ trang</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                {getPaginationRange(page, totalPages).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={clsx(
                      'w-7 h-7 text-xs font-medium rounded-lg cursor-pointer',
                      page === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
