import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Droplets, Sun, Zap, ZapOff, Activity,
  TrendingUp, TrendingDown, AlertTriangle, WifiOff, RefreshCw,
  Power
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
  glowClass: string;
  index: number;
  trend: 'up' | 'down' | 'stable';
}

function SensorCard({ icon, label, value, unit, min, max, color, glowClass, index, trend }: SensorCardProps) {
  const percentage = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 50;
  const isAlert = max > min && (value >= max * 0.9 || (min > 0 && value <= min * 1.1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={clsx(
        'glass-card p-5 relative overflow-hidden cursor-default',
        isAlert && 'border-orange-500/50'
      )}
    >
      {/* Background glow */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl ${color}`} />

      {/* Alert badge */}
      {isAlert && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs border border-orange-500/30"
        >
          <AlertTriangle className="w-3 h-3" />
          Cảnh báo
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-20 flex items-center justify-center ${glowClass}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          {trend === 'stable' && <Activity className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      {/* Value */}
      <motion.div
        key={value}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-1"
      >
        <span className="text-3xl font-bold text-white tabular-nums">{value.toFixed(1)}</span>
        <span className="text-sm text-slate-400 ml-1">{unit}</span>
      </motion.div>

      <p className="text-xs text-slate-400 mb-3">{label}</p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{min}</span>
        <span>{max}{unit}</span>
      </div>
    </motion.div>
  );
}

// ─── Device Switch Card ────────────────────────────────────
interface DeviceSwitchProps {
  device: Device;
  onToggle: (id: string, action: 'ON' | 'OFF') => Promise<void>;
  index: number;
}

function DeviceSwitch({ device, onToggle, index }: DeviceSwitchProps) {
  const [localStatus, setLocalStatus] = useState<'ON' | 'OFF' | 'PENDING'>(device.currentStatus);
  const isOn = localStatus === 'ON';
  const isPending = localStatus === 'PENDING';

  useEffect(() => {
    setLocalStatus(device.currentStatus);
  }, [device.currentStatus]);

  const handleToggle = async () => {
    if (isPending) return;
    const newAction = isOn ? 'OFF' : 'ON';
    setLocalStatus('PENDING');
    try {
      await onToggle(device.id, newAction);
      setLocalStatus(newAction);
    } catch {
      setLocalStatus(isOn ? 'ON' : 'OFF'); // revert
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 + 0.3 }}
      whileHover={{ scale: 1.01 }}
      className={clsx(
        'glass-card p-5 relative overflow-hidden transition-all duration-300',
        isOn && !isPending && 'border-blue-500/30 shadow-blue-500/10 shadow-lg',
        isPending && 'border-yellow-500/30'
      )}
    >
      {/* BG glow when ON */}
      {isOn && !isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none"
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={clsx(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
            isOn ? 'bg-blue-500/20' : 'bg-slate-700/50',
            isPending && 'bg-yellow-500/20'
          )}>
            {isPending ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw className="w-6 h-6 text-yellow-400" />
              </motion.div>
            ) : isOn ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-6 h-6 text-blue-400" />
              </motion.div>
            ) : (
              <ZapOff className="w-6 h-6 text-slate-500" />
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-semibold text-white text-sm">{device.deviceName}</p>
            <p className="text-xs text-slate-500">{device.description || `Pin GPIO: ${device.pinGpio}`}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={clsx(
                'w-1.5 h-1.5 rounded-full',
                isPending ? 'bg-yellow-400 animate-ping' : isOn ? 'bg-green-400' : 'bg-slate-500'
              )} />
              <span className={clsx(
                'text-xs font-medium',
                isPending ? 'text-yellow-400' : isOn ? 'text-green-400' : 'text-slate-500'
              )}>
                {isPending ? 'Đang xử lý...' : isOn ? 'Đang bật' : 'Đã tắt'}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={clsx(
            'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed',
            isPending ? 'bg-yellow-500/50 focus:ring-yellow-500' :
            isOn ? 'bg-blue-600 focus:ring-blue-500' : 'bg-slate-600 focus:ring-slate-500'
          )}
        >
          <motion.div
            className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
            animate={{ x: isOn ? 28 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Power className={clsx('w-3 h-3', isOn ? 'text-blue-600' : 'text-slate-500')} />
          </motion.div>
        </button>
      </div>

      {/* Last active */}
      {device.lastActiveAt && (
        <p className="text-[10px] text-slate-500 mt-3">
          Hoạt động lần cuối: {new Date(device.lastActiveAt).toLocaleString('vi-VN')}
        </p>
      )}
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs shadow-xl border border-slate-600/50">
        <p className="text-slate-400 mb-2 font-medium">
          {label ? new Date(label).toLocaleTimeString('vi-VN') : ''}
        </p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300 capitalize">{entry.name}:</span>
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
  const [sensors, setSensors] = useState<SensorReading>(initialSensors);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'all' | 'temperature' | 'humidity' | 'light'>('all');
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
    } catch (err: any) {
      console.error('Device control failed:', err);
      alert(err?.message || 'Không thể điều khiển thiết bị (Timeout hoặc lỗi máy chủ)');
      throw err;
    }
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
      icon: <Thermometer className="w-5 h-5 text-orange-400" />,
      label: 'Nhiệt độ',
      value: sensors.temperature.value,
      unit: sensors.temperature.unit,
      min: sensors.temperature.minThreshold ?? 0,
      max: sensors.temperature.maxThreshold ?? 100,
      color: 'bg-orange-500',
      glowClass: 'shadow-orange-500/20',
      trend: getTrend(sensors.temperature.value, prevChart?.temperature),
    },
    {
      icon: <Droplets className="w-5 h-5 text-blue-400" />,
      label: 'Độ ẩm',
      value: sensors.humidity.value,
      unit: sensors.humidity.unit,
      min: sensors.humidity.minThreshold ?? 0,
      max: sensors.humidity.maxThreshold ?? 100,
      color: 'bg-blue-500',
      glowClass: 'shadow-blue-500/20',
      trend: getTrend(sensors.humidity.value, prevChart?.humidity),
    },
    {
      icon: <Sun className="w-5 h-5 text-yellow-400" />,
      label: 'Ánh sáng',
      value: sensors.light.value,
      unit: sensors.light.unit,
      min: sensors.light.minThreshold ?? 0,
      max: sensors.light.maxThreshold ?? 1000,
      color: 'bg-yellow-500',
      glowClass: 'shadow-yellow-500/20',
      trend: getTrend(sensors.light.value, prevChart?.light),
    },
  ];

  const chartLines = [
    { key: 'temperature', name: 'Nhiệt độ (°C)', color: '#f97316', show: selectedChart === 'all' || selectedChart === 'temperature' },
    { key: 'humidity', name: 'Độ ẩm (%)', color: '#3b82f6', show: selectedChart === 'all' || selectedChart === 'humidity' },
    { key: 'light', name: 'Ánh sáng (lux)', color: '#eab308', show: selectedChart === 'all' || selectedChart === 'light' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar isConnected={isConnected} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Dashboard"
          subtitle="Giám sát thời gian thực · SSE Stream"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Disconnected Banner */}
          <AnimatePresence>
            {!isConnected && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
              >
                <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-medium">Đã ngắt kết nối với thiết bị / luồng SSE. Đang thử kết nối lại...</span>
              </motion.div>
            )}
            {errorMessage && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sensor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sensorCards.map((card, i) => (
              <SensorCard key={card.label} {...card} index={i} />
            ))}
          </div>

          {/* Chart + Devices */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="xl:col-span-2 glass-card p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="font-semibold text-white">Biểu đồ thời gian thực</h3>
                  <p className="text-xs text-slate-400">Cập nhật tự động qua luồng SSE từ thiết bị</p>
                </div>
                {/* Chart filter tabs */}
                <div className="flex gap-1 p-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'temperature', label: 'Nhiệt độ' },
                    { key: 'humidity', label: 'Độ ẩm' },
                    { key: 'light', label: 'Ánh sáng' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedChart(tab.key as typeof selectedChart)}
                      className={clsx(
                        'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                        selectedChart === tab.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
                      axisLine={{ stroke: '#1e293b' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                      formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                    />
                    {chartLines.map((line) => line.show && (
                      <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        name={line.name}
                        stroke={line.color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                        animationDuration={300}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-500 text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <Activity className="w-8 h-8 opacity-30 animate-pulse" />
                    <p>Đang chờ luồng dữ liệu cảm biến mới...</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Device Controls */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="font-semibold text-white mb-1">Điều khiển thiết bị</h3>
                <p className="text-xs text-slate-400 mb-4">2-Phase Control với handshake MQTT</p>
              </div>

              {devices.map((device, i) => (
                <DeviceSwitch
                  key={device.id}
                  device={device}
                  onToggle={handleDeviceToggle}
                  index={i}
                />
              ))}

              {devices.length === 0 && (
                <div className="glass-card p-6 text-center text-slate-500 text-xs">
                  Chưa có thiết bị nào được kết nối trong hệ thống
                </div>
              )}

              {/* Stats box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="glass-card p-4 space-y-2"
              >
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thống kê</h4>
                {[
                  { label: 'Thiết bị đang bật', value: devices.filter((d) => d.currentStatus === 'ON').length, color: 'text-green-400' },
                  { label: 'Thiết bị đã tắt', value: devices.filter((d) => d.currentStatus === 'OFF').length, color: 'text-slate-400' },
                  { label: 'Đang xử lý', value: devices.filter((d) => d.currentStatus === 'PENDING').length, color: 'text-yellow-400' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{stat.label}</span>
                    <span className={clsx('text-sm font-bold', stat.color)}>{stat.value}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
