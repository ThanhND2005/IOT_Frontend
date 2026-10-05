import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Thermometer, Droplets, Sun, Zap, ZapOff, Activity,
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Power, Lightbulb, Fan, Cpu, SlidersHorizontal
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { SensorReading, ChartDataPoint, Device } from '../types';
import { sensorService, deviceService } from '../services';
import { useToast } from '../context';

// ─── Initial Fallback State ────────────────────────────────
const initialSensors: SensorReading = {
  temperature: {
    value: 0,
    unit: '°C',
    status: 'ACTIVE',
    minThreshold: 0,
    maxThreshold: 100,
    recordedAt: new Date().toISOString(),
  },
  humidity: {
    value: 0,
    unit: '%',
    status: 'ACTIVE',
    minThreshold: 0,
    maxThreshold: 100,
    recordedAt: new Date().toISOString(),
  },
  light: {
    value: 0,
    unit: 'lux',
    status: 'ACTIVE',
    minThreshold: 0,
    maxThreshold: 1000,
    recordedAt: new Date().toISOString(),
  },
};

// ─── Sensor Card ────────────────────────────────────────────
interface SensorCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
  iconBg: string;
  glowClass: string;
  index?: number;
  trend: 'up' | 'down' | 'stable';
}

function SensorCard({ icon, label, value, unit, min, max, color, iconBg, glowClass, trend }: SensorCardProps) {
  const isAlert = max > min && (value >= max * 0.9 || (min > 0 && value <= min * 1.1));

  return (
    <div
      className={clsx(
        'glass-card p-5 relative overflow-hidden cursor-default',
        isAlert && 'border-orange-500/50'
      )}
    >
      {/* Background glow */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl ${color}`} />

      {/* Alert badge */}
      {isAlert && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-200">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
          Cảnh báo
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', iconBg, glowClass)}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
          {trend === 'stable' && <Activity className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      {/* Value */}
      <div className="mb-1">
        <span className="text-3xl font-bold text-slate-900 tabular-nums">{value.toFixed(1)}</span>
        <span className="text-sm text-slate-500 ml-1">{unit}</span>
      </div>

      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// ─── Device Switch Card ────────────────────────────────────
interface DeviceSwitchProps {
  device: Device;
  onToggle: (id: string, action: 'ON' | 'OFF') => Promise<void>;
  index?: number;
  disabled?: boolean;
}

function DeviceSwitch({ device, onToggle, disabled }: DeviceSwitchProps) {
  const [localStatus, setLocalStatus] = useState<'ON' | 'OFF' | 'PENDING'>(device.currentStatus);
  const isOn = localStatus === 'ON';
  const isPending = localStatus === 'PENDING';

  useEffect(() => {
    setLocalStatus(device.currentStatus);
  }, [device.currentStatus]);

  const handleToggle = async () => {
    if (isPending || disabled) return;
    const newAction = isOn ? 'OFF' : 'ON';
    setLocalStatus('PENDING');
    try {
      await onToggle(device.id, newAction);
      setLocalStatus(newAction);
    } catch {
      setLocalStatus(isOn ? 'ON' : 'OFF'); // revert
    }
  };

  const devType = device.deviceType?.toUpperCase() || (
    device.deviceName?.toLowerCase().includes('led') || device.deviceName?.toLowerCase().includes('đèn') ? 'LED' :
    device.deviceName?.toLowerCase().includes('fan') || device.deviceName?.toLowerCase().includes('quạt') ? 'FAN' :
    device.deviceName?.toLowerCase().includes('relay') || device.deviceName?.toLowerCase().includes('rơ-le') ? 'RELAY' : ''
  );

  const renderDeviceIcon = () => {
    if (isPending) return <RefreshCw className="w-6 h-6 text-amber-500" />;
    if (devType === 'LED') {
      return <Lightbulb className={clsx('w-6 h-6', isOn ? 'text-amber-500' : 'text-slate-400')} />;
    }
    if (devType === 'FAN') {
      return <Fan className={clsx('w-6 h-6', isOn ? 'text-emerald-500' : 'text-slate-400')} />;
    }
    if (devType === 'RELAY') {
      return <Cpu className={clsx('w-6 h-6', isOn ? 'text-cyan-600' : 'text-slate-400')} />;
    }
    return isOn ? <Zap className="w-6 h-6 text-blue-600" /> : <ZapOff className="w-6 h-6 text-slate-400" />;
  };

  const getIconContainerStyle = () => {
    if (isPending) return 'bg-amber-50 text-amber-600 border border-amber-200';
    if (!isOn) return 'bg-slate-100 text-slate-400 border border-slate-200';
    if (devType === 'LED') return 'bg-amber-50 text-amber-600 border border-amber-200';
    if (devType === 'FAN') return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    if (devType === 'RELAY') return 'bg-cyan-50 text-cyan-600 border border-cyan-200';
    return 'bg-blue-50 text-blue-600 border border-blue-200';
  };

  return (
    <div
      className={clsx(
        'glass-card p-5 relative overflow-hidden',
        isOn && !isPending && 'border-blue-500/40 shadow-sm',
        isPending && 'border-amber-400/50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
            getIconContainerStyle()
          )}>
            {renderDeviceIcon()}
          </div>

          {/* Info */}
          <div>
            <p className="font-semibold text-slate-900 text-sm">{device.deviceName}</p>
            <p className="text-xs text-slate-500">{device.description || `Pin GPIO: ${device.pinGpio}`}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={clsx(
                'w-1.5 h-1.5 rounded-full',
                isPending ? 'bg-amber-500' : isOn ? 'bg-emerald-500' : 'bg-slate-400'
              )} />
              <span className={clsx(
                'text-xs font-medium',
                isPending ? 'text-amber-600' : isOn ? 'text-emerald-600' : 'text-slate-500'
              )}>
                {isPending ? 'Đang xử lý...' : isOn ? 'Đang bật' : 'Đã tắt'}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending || disabled}
          className={clsx(
            'relative w-14 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed cursor-pointer transition-opacity',
            isPending ? 'bg-amber-300 focus:ring-amber-400' :
            isOn ? 'bg-blue-600 focus:ring-blue-500' : 'bg-slate-200 focus:ring-slate-400',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <div
            className={clsx(
              'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200',
              isOn ? 'left-7' : 'left-0.5'
            )}
          >
            <Power className={clsx('w-3 h-3', isOn ? 'text-blue-600' : 'text-slate-400')} />
          </div>
        </button>
      </div>

      {/* Last active */}
      {device.lastActiveAt && (
        <p className="text-[10px] text-slate-400 mt-3">
          Hoạt động lần cuối: {new Date(device.lastActiveAt).toLocaleString('vi-VN')}
        </p>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 text-xs shadow-xl border border-slate-200 rounded-xl">
        <p className="text-slate-500 mb-2 font-medium">
          {label ? new Date(label).toLocaleTimeString('vi-VN') : ''}
        </p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 capitalize">{entry.name}:</span>
            <span className="font-bold" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Dashboard Page ───────────────────────────────────────
export default function DashboardPage() {
  const toast = useToast();
  const [sensors, setSensors] = useState<SensorReading>(initialSensors);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sensorsRef = useRef(sensors);
  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  // Load initial data
  const loadDashboardData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const [latestSnap, history, deviceList] = await Promise.all([
        sensorService.getLatestSnapshot().catch(() => initialSensors),
        sensorService.getChartHistory(20).catch(() => []),
        deviceService.getAllDevices().catch(() => []),
      ]);

      setSensors(latestSnap);
      setChartData(history);
      setDevices(deviceList);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setErrorMessage('Không thể tải dữ liệu bảng điều khiển. Đang thử lại...');
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Connect SSE Stream
  useEffect(() => {
    const cleanup = sensorService.createSensorStream(
      (streamData) => {
        setIsConnected(true);
        const nowIso = streamData.timestamp || new Date().toISOString();

        setSensors((prev) => {
          const updated: SensorReading = {
            temperature: {
              ...prev.temperature,
              value: streamData.temperature?.value !== undefined ? Number(streamData.temperature.value) : prev.temperature.value,
              unit: streamData.temperature?.unit || prev.temperature.unit,
              recordedAt: nowIso,
            },
            humidity: {
              ...prev.humidity,
              value: streamData.humidity?.value !== undefined ? Number(streamData.humidity.value) : prev.humidity.value,
              unit: streamData.humidity?.unit || prev.humidity.unit,
              recordedAt: nowIso,
            },
            light: {
              ...prev.light,
              value: streamData.light?.value !== undefined ? Number(streamData.light.value) : prev.light.value,
              unit: streamData.light?.unit || prev.light.unit,
              recordedAt: nowIso,
            },
          };
          return updated;
        });

        // Update chart data point
        setChartData((prev) => {
          const currentLatest = sensorsRef.current;
          const newPoint: ChartDataPoint = {
            timestamp: nowIso,
            temperature: streamData.temperature?.value !== undefined
              ? Number(streamData.temperature.value)
              : currentLatest.temperature.value,
            humidity: streamData.humidity?.value !== undefined
              ? Number(streamData.humidity.value)
              : currentLatest.humidity.value,
            light: streamData.light?.value !== undefined
              ? Number(streamData.light.value)
              : currentLatest.light.value,
          };
          return [...prev.slice(-29), newPoint];
        });
      },
      () => {
        setIsConnected(false);
      },
      () => {
        setIsConnected(true);
      }
    );

    return () => {
      cleanup();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  }, [loadDashboardData]);

  const handleDeviceToggle = async (id: string, action: 'ON' | 'OFF') => {
    const targetDev = devices.find((d) => d.id === id);
    const devName = targetDev?.deviceName || 'Thiết bị';
    const actionText = action === 'ON' ? 'bật' : 'tắt';

    try {
      const response = await deviceService.controlDevice(id, action);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                currentStatus: action,
                lastActiveAt: response.confirmedAt || new Date().toISOString(),
              }
            : d
        )
      );
      toast.success(
        `Thao tác thành công`,
        `Đã ${actionText} thiết bị "${devName}" thành công.`
      );
    } catch (err: any) {
      console.error('Device control failed:', err);
      toast.error(
        `Thao tác thất bại`,
        err?.message || `Không thể ${actionText} thiết bị "${devName}" (Timeout hoặc lỗi máy chủ).`
      );
      throw err;
    }
  };

  const [isBatchControlling, setIsBatchControlling] = useState(false);

  const handleBulkControl = async (action: 'ON' | 'OFF') => {
    if (isBatchControlling || devices.length === 0) return;

    setIsBatchControlling(true);
    const actionText = action === 'ON' ? 'bật' : 'tắt';

    try {
      // Ưu tiên các thiết bị chưa ở trạng thái mong muốn; nếu tất cả đã ở trạng thái đó thì gửi lại toàn bộ để đồng bộ
      const targetDevices = devices.filter((d) => d.currentStatus !== action);
      const devicesToControl = targetDevices.length > 0 ? targetDevices : devices;

      // Đặt trạng thái PENDING hiển thị ngay trên UI
      setDevices((prev) =>
        prev.map((d) =>
          devicesToControl.some((td) => td.id === d.id)
            ? { ...d, currentStatus: 'PENDING' }
            : d
        )
      );

      const errors: string[] = [];

      // Gửi lệnh điều khiển tuần tự có khoảng trễ nhỏ (100ms) để ESP8266 & MQTT Broker xử lý ổn định
      const results = await Promise.allSettled(
        devicesToControl.map(async (dev, index) => {
          if (index > 0) {
            await new Promise((resolve) => setTimeout(resolve, index * 100));
          }
          const response = await deviceService.controlDevice(dev.id, action);
          setDevices((prev) =>
            prev.map((d) =>
              d.id === dev.id
                ? {
                    ...d,
                    currentStatus: action,
                    lastActiveAt: response.confirmedAt || new Date().toISOString(),
                  }
                : d
            )
          );
          return dev;
        })
      );

      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          const dev = devicesToControl[index];
          errors.push(dev.deviceName || dev.id);
          // Revert trạng thái nếu có lỗi
          setDevices((prev) =>
            prev.map((d) =>
              d.id === dev.id ? { ...d, currentStatus: dev.currentStatus } : d
            )
          );
        }
      });

      if (errors.length > 0) {
        if (errors.length === devicesToControl.length) {
          toast.error(
            `Thao tác thất bại`,
            `Không thể ${actionText} các thiết bị (${errors.join(', ')}). Vui lòng kiểm tra lại kết nối thiết bị.`
          );
        } else {
          toast.warning(
            `Hoàn tất một phần`,
            `Không thể ${actionText} một số thiết bị (${errors.join(', ')}). Các thiết bị khác đã ${actionText} thành công.`
          );
        }
      } else {
        toast.success(
          `Thao tác thành công`,
          `Đã ${actionText} tất cả thiết bị thành công.`
        );
      }
    } catch (err: any) {
      console.error('Bulk device control failed:', err);
      toast.error(
        `Thao tác thất bại`,
        err?.message || `Có lỗi xảy ra khi thực hiện ${actionText} thiết bị hàng loạt.`
      );
    } finally {
      setIsBatchControlling(false);
    }
  };

  const isAllOn = devices.length > 0 && devices.every((d) => d.currentStatus === 'ON');

  const handleMasterToggle = async () => {
    if (isBatchControlling || devices.length === 0) return;
    const nextAction = isAllOn ? 'OFF' : 'ON';
    await handleBulkControl(nextAction);
  };

  const getTrend = (current: number, prev?: number): 'up' | 'down' | 'stable' => {
    if (prev === undefined) return 'stable';
    const diff = current - prev;
    if (Math.abs(diff) < 0.2) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const prevChart = chartData.length > 1 ? chartData[chartData.length - 2] : undefined;

  const sensorCards = [
    {
      icon: <Thermometer className="w-5 h-5 text-orange-600" />,
      label: 'Nhiệt độ',
      value: sensors.temperature.value,
      unit: sensors.temperature.unit,
      min: sensors.temperature.minThreshold ?? 0,
      max: sensors.temperature.maxThreshold ?? 100,
      color: 'bg-orange-500',
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
      glowClass: 'shadow-orange-500/20',
      trend: getTrend(sensors.temperature.value, prevChart?.temperature),
    },
    {
      icon: <Droplets className="w-5 h-5 text-blue-600" />,
      label: 'Độ ẩm',
      value: sensors.humidity.value,
      unit: sensors.humidity.unit,
      min: sensors.humidity.minThreshold ?? 0,
      max: sensors.humidity.maxThreshold ?? 100,
      color: 'bg-blue-500',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      glowClass: 'shadow-blue-500/20',
      trend: getTrend(sensors.humidity.value, prevChart?.humidity),
    },
    {
      icon: <Sun className="w-5 h-5 text-amber-600" />,
      label: 'Ánh sáng',
      value: sensors.light.value,
      unit: sensors.light.unit,
      min: sensors.light.minThreshold ?? 0,
      max: sensors.light.maxThreshold ?? 1000,
      color: 'bg-amber-500',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      glowClass: 'shadow-yellow-500/20',
      trend: getTrend(sensors.light.value, prevChart?.light),
    },
  ];

  const chartLines = [
    { key: 'temperature', name: 'Nhiệt độ (°C)', color: '#f97316' },
    { key: 'humidity', name: 'Độ ẩm (%)', color: '#3b82f6' },
    { key: 'light', name: 'Ánh sáng (lux)', color: '#eab308' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar isConnected={isConnected} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Dashboard"
          subtitle="Giám sát thời gian thực · SSE Stream"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sensor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sensorCards.map((card, i) => (
              <SensorCard key={card.label} {...card} index={i} />
            ))}
          </div>

          {/* Chart + Devices */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Line Chart */}
            <div className="xl:col-span-2 glass-card p-5">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-slate-900">Biểu đồ thời gian thực</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Cập nhật tự động qua luồng SSE từ thiết bị</p>
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) => {
                        try {
                          return new Date(v).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        } catch {
                          return v;
                        }
                      }}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                      formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
                    />
                    {chartLines.map((line) => (
                      <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        name={line.name}
                        stroke={line.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="w-8 h-8 text-slate-300" />
                    <p>Đang chờ luồng dữ liệu cảm biến mới...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Device Controls */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Điều khiển thiết bị</h3>
                </div>

                {/* Master Toggle Switch - Cái gạt Bật tất cả */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Bật tất cả
                  </span>
                  <button
                    onClick={handleMasterToggle}
                    disabled={isBatchControlling || devices.length === 0}
                    className={clsx(
                      'relative w-14 h-7 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed cursor-pointer transition-colors',
                      isBatchControlling ? 'bg-amber-300 focus:ring-amber-400' :
                      isAllOn ? 'bg-blue-600 focus:ring-blue-500' : 'bg-slate-200 focus:ring-slate-400',
                      (isBatchControlling || devices.length === 0) && 'opacity-60 cursor-not-allowed'
                    )}
                    title={
                      devices.length === 0
                        ? 'Chưa có thiết bị kết nối'
                        : isAllOn
                        ? 'Gạt để tắt tất cả thiết bị'
                        : 'Gạt để bật tất cả thiết bị'
                    }
                  >
                    <div
                      className={clsx(
                        'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200',
                        isAllOn ? 'left-7' : 'left-0.5'
                      )}
                    >
                      {isBatchControlling ? (
                        <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                      ) : (
                        <Power className={clsx('w-3 h-3', isAllOn ? 'text-blue-600' : 'text-slate-400')} />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {devices.map((device, i) => (
                <DeviceSwitch
                  key={device.id}
                  device={device}
                  onToggle={handleDeviceToggle}
                  disabled={isBatchControlling}
                  index={i}
                />
              ))}

              {devices.length === 0 && (
                <div className="glass-card p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Cpu className="w-8 h-8 text-slate-300" />
                  <p>Chưa có thiết bị nào được kết nối trong hệ thống</p>
                </div>
              )}

              {/* Stats box */}
              <div className="glass-card p-4 space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thống kê</h4>
                </div>
                {[
                  { label: 'Thiết bị đang bật', value: devices.filter((d) => d.currentStatus === 'ON').length, color: 'text-emerald-600', icon: <Zap className="w-3.5 h-3.5 text-emerald-600" /> },
                  { label: 'Thiết bị đã tắt', value: devices.filter((d) => d.currentStatus === 'OFF').length, color: 'text-slate-600', icon: <ZapOff className="w-3.5 h-3.5 text-slate-400" /> },
                  { label: 'Đang xử lý', value: devices.filter((d) => d.currentStatus === 'PENDING').length, color: 'text-amber-600', icon: <RefreshCw className="w-3.5 h-3.5 text-amber-500" /> },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="text-xs text-slate-500">{stat.label}</span>
                    </div>
                    <span className={clsx('text-sm font-bold', stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
