// ============================================================
// MOCK DATA - Thay thế bằng API calls thực tế sau
// ============================================================

// --- Types ---
export interface SensorReading {
  temperature: { value: number; unit: string; status: string; minThreshold: number; maxThreshold: number; recordedAt: string };
  humidity: { value: number; unit: string; status: string; minThreshold: number; maxThreshold: number; recordedAt: string };
  light: { value: number; unit: string; status: string; minThreshold: number; maxThreshold: number; recordedAt: string };
}

export interface ChartDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  light: number;
}

export interface Device {
  id: string;
  deviceName: string;
  deviceType: string;
  pinGpio: string;
  currentStatus: 'ON' | 'OFF' | 'PENDING';
  lastActiveAt: string | null;
  description: string;
}

export interface SensorLog {
  id: string;
  sensorId: string;
  sensorName: string;
  sensorType: 'TEMPERATURE' | 'HUMIDITY' | 'LIGHT';
  value: number;
  unit: string;
  recordedAt: string;
}

export interface DeviceHistoryItem {
  id: string;
  deviceId: string;
  deviceName: string;
  action: 'ON' | 'OFF';
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  source: string;
  executionTimeMs: number | null;
  errorMessage: string | null;
  userId: string;
  username: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  studentCode: string;
  avatarUrl: string;
  githubUrl: string;
  figmaUrl: string;
  systemDocUrl: string;
  apiDocUrl: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

// --- Mock Sensor Latest Data ---
export const mockSensorLatest: SensorReading = {
  temperature: {
    value: 28.5,
    unit: '°C',
    status: 'ACTIVE',
    minThreshold: 10,
    maxThreshold: 40,
    recordedAt: new Date().toISOString(),
  },
  humidity: {
    value: 65.2,
    unit: '%',
    status: 'ACTIVE',
    minThreshold: 30,
    maxThreshold: 90,
    recordedAt: new Date().toISOString(),
  },
  light: {
    value: 340,
    unit: 'lux',
    status: 'ACTIVE',
    minThreshold: 0,
    maxThreshold: 1000,
    recordedAt: new Date().toISOString(),
  },
};

// Generate 20 chart history points
const now = Date.now();
export const mockChartHistory: ChartDataPoint[] = Array.from({ length: 20 }, (_, i) => ({
  timestamp: new Date(now - (19 - i) * 2000).toISOString(),
  temperature: 27 + Math.random() * 3,
  humidity: 60 + Math.random() * 10,
  light: 300 + Math.random() * 100,
}));

// --- Mock Devices ---
export const mockDevices: Device[] = [
  {
    id: 'd1a2b3c4-0001-0001-0001-000000000001',
    deviceName: 'Đèn LED 1',
    deviceType: 'LED',
    pinGpio: 'D1',
    currentStatus: 'OFF',
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
    description: 'Đèn LED điều khiển thử nghiệm số 1',
  },
  {
    id: 'd1a2b3c4-0002-0002-0002-000000000002',
    deviceName: 'Đèn LED 2',
    deviceType: 'LED',
    pinGpio: 'D2',
    currentStatus: 'ON',
    lastActiveAt: new Date(Date.now() - 600000).toISOString(),
    description: 'Đèn LED điều khiển thử nghiệm số 2',
  },
];

// --- Mock Sensor Logs ---
const sensorTypes: Array<'TEMPERATURE' | 'HUMIDITY' | 'LIGHT'> = ['TEMPERATURE', 'HUMIDITY', 'LIGHT'];
const sensorNames = { TEMPERATURE: 'DHT11 - Nhiệt độ', HUMIDITY: 'DHT11 - Độ ẩm', LIGHT: 'LDR - Ánh sáng' };
const sensorUnits = { TEMPERATURE: '°C', HUMIDITY: '%', LIGHT: 'lux' };

export const mockSensorLogs: SensorLog[] = Array.from({ length: 60 }, (_, i) => {
  const type = sensorTypes[i % 3];
  return {
    id: `sl-${String(i + 1).padStart(4, '0')}`,
    sensorId: `s-${i % 3 + 1}`,
    sensorName: sensorNames[type],
    sensorType: type,
    value: type === 'TEMPERATURE'
      ? parseFloat((25 + Math.random() * 5).toFixed(1))
      : type === 'HUMIDITY'
      ? parseFloat((60 + Math.random() * 15).toFixed(1))
      : parseFloat((300 + Math.random() * 200).toFixed(0)),
    unit: sensorUnits[type],
    recordedAt: new Date(Date.now() - i * 2000).toISOString(),
  };
});

// --- Mock Device History ---
const statuses: Array<'SUCCESS' | 'ERROR' | 'PENDING'> = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'ERROR', 'PENDING'];
const actions: Array<'ON' | 'OFF'> = ['ON', 'OFF'];

export const mockDeviceHistory: DeviceHistoryItem[] = Array.from({ length: 50 }, (_, i) => {
  const status = statuses[i % 5];
  const device = mockDevices[i % 2];
  return {
    id: `dh-${String(i + 1).padStart(4, '0')}`,
    deviceId: device.id,
    deviceName: device.deviceName,
    action: actions[i % 2],
    status,
    source: 'WEB_DASHBOARD',
    executionTimeMs: status === 'SUCCESS' ? Math.floor(100 + Math.random() * 400) : null,
    errorMessage: status === 'ERROR' ? 'Thiết bị không phản hồi sau 5000ms' : null,
    userId: 'user-001',
    username: 'admin@iot.com',
    fullName: 'Nguyễn Danh Thành',
    createdAt: new Date(Date.now() - i * 60000).toISOString(),
    updatedAt: new Date(Date.now() - i * 60000 + 500).toISOString(),
  };
});

// --- Mock User Profile ---
export const mockUserProfile: UserProfile = {
  id: 'user-001',
  email: 'b23dccn772@ptit.edu.vn',
  fullName: 'Nguyễn Danh Thành',
  studentCode: 'B23DCCN772',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenDanhThanh&backgroundColor=b6e3f4',
  githubUrl: 'https://github.com/your-github/iot-project',
  figmaUrl: 'https://www.figma.com/your-figma-link',
  systemDocUrl: 'https://docs.google.com/document/your-system-doc',
  apiDocUrl: 'https://your-postman-api-doc',
  createdAt: '2026-01-15T07:00:00.000Z',
};
