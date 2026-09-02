// ============================================================
// TypeScript Type Definitions matching Backend API DTOs
// ============================================================

// --- Common Base Response ---
export interface BaseResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  errors?: Record<string, string> | null;
  timestamp?: string;
}

// --- Common Page Response ---
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// --- Dynamic Search Types ---
export type SearchOperation =
  | 'EQUAL'
  | 'NOT_EQUAL'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_THAN_EQUAL'
  | 'LESS_THAN_EQUAL'
  | 'LIKE'
  | 'IN'
  | 'IS_NULL'
  | 'IS_NOT_NULL';

export type SearchDataType =
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'DATE'
  | 'UUID'
  | 'ENUM';

export interface SearchParam {
  field: string;
  value: any;
  operate: SearchOperation;
  type: SearchDataType;
}

export interface DynamicSearchRequest {
  filters?: SearchParam[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

// --- Auth Module Types ---
export interface LoginRequest {
  usernameOrEmail: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  id: number | string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  studentCode?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  figmaUrl?: string | null;
  systemDocUrl?: string | null;
  apiDocUrl?: string | null;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Alias for Profile page
export type UserProfile = UserResponse;

// --- Device Module Types ---
export interface Device {
  id: string;
  deviceName: string;
  deviceType: string;
  pinGpio: string;
  currentStatus: 'ON' | 'OFF' | 'PENDING';
  lastActiveAt: string | null;
  description?: string | null;
}

export interface DeviceControlRequest {
  action: 'ON' | 'OFF';
}

export interface DeviceControlResponse {
  actionId: string;
  deviceId: string;
  deviceName: string;
  action: 'ON' | 'OFF';
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  executionTimeMs: number;
  confirmedAt: string;
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
  userId?: number | string | null;
  fullName?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// --- Sensor Module Types ---
export interface MetricDetail {
  sensorId?: string;
  sensorName?: string;
  value: number;
  unit: string;
  status?: string;
  minThreshold?: number;
  maxThreshold?: number;
  recordedAt: string;
}

export interface SensorReading {
  temperature: MetricDetail;
  humidity: MetricDetail;
  light: MetricDetail;
}

export interface ChartSeriesItem {
  name: string;
  sensorId?: string;
  unit: string;
  data: number[];
}

export interface ChartHistoryResponse {
  timestamps: string[];
  series: ChartSeriesItem[];
}

export interface ChartDataPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  light: number;
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

export interface TelemetryStreamMessage {
  temperature?: { value: number; unit: string };
  humidity?: { value: number; unit: string };
  light?: { value: number; unit: string };
  timestamp?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}
