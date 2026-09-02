import { request, API_BASE_URL } from './apiClient';
import type {
  SensorReading,
  ChartDataPoint,
  ChartHistoryResponse,
  SensorLog,
  PageResponse,
  DynamicSearchRequest,
  TelemetryStreamMessage,
} from '../types';

export const sensorService = {
  async getLatestSnapshot(): Promise<SensorReading> {
    const raw = await request<any>('/sensors/latest', { method: 'GET' });

    const now = new Date().toISOString();
    const defaultMetric = (unit: string, min: number, max: number) => ({
      value: 0,
      unit,
      status: 'ACTIVE',
      minThreshold: min,
      maxThreshold: max,
      recordedAt: now,
    });

    return {
      temperature: raw?.temperature
        ? {
            value: Number(raw.temperature.value ?? 0),
            unit: raw.temperature.unit || '°C',
            status: raw.temperature.status || 'ACTIVE',
            minThreshold: Number(raw.temperature.minThreshold ?? 0),
            maxThreshold: Number(raw.temperature.maxThreshold ?? 100),
            recordedAt: raw.temperature.recordedAt || now,
            sensorId: raw.temperature.sensorId,
            sensorName: raw.temperature.sensorName,
          }
        : defaultMetric('°C', 0, 100),
      humidity: raw?.humidity
        ? {
            value: Number(raw.humidity.value ?? 0),
            unit: raw.humidity.unit || '%',
            status: raw.humidity.status || 'ACTIVE',
            minThreshold: Number(raw.humidity.minThreshold ?? 0),
            maxThreshold: Number(raw.humidity.maxThreshold ?? 100),
            recordedAt: raw.humidity.recordedAt || now,
            sensorId: raw.humidity.sensorId,
            sensorName: raw.humidity.sensorName,
          }
        : defaultMetric('%', 0, 100),
      light: raw?.light
        ? {
            value: Number(raw.light.value ?? 0),
            unit: raw.light.unit || 'lux',
            status: raw.light.status || 'ACTIVE',
            minThreshold: Number(raw.light.minThreshold ?? 0),
            maxThreshold: Number(raw.light.maxThreshold ?? 1000),
            recordedAt: raw.light.recordedAt || now,
            sensorId: raw.light.sensorId,
            sensorName: raw.light.sensorName,
          }
        : defaultMetric('lux', 0, 1000),
    };
  },

  async getChartHistory(limit = 20): Promise<ChartDataPoint[]> {
    const res = await request<ChartHistoryResponse>(`/sensors/chart-history?limit=${limit}`, {
      method: 'GET',
    });

    if (!res || !res.timestamps || res.timestamps.length === 0) {
      return [];
    }

    const tempSeries = res.series?.find(
      s => s.unit === '°C' || s.name?.toLowerCase().includes('nhiệt')
    );
    const humSeries = res.series?.find(
      s => s.unit === '%' || s.name?.toLowerCase().includes('ẩm')
    );
    const lightSeries = res.series?.find(
      s => s.unit === 'lux' || s.name?.toLowerCase().includes('sáng')
    );

    return res.timestamps.map((ts, i) => ({
      timestamp: ts,
      temperature: tempSeries?.data[i] !== undefined ? Number(tempSeries.data[i]) : 0,
      humidity: humSeries?.data[i] !== undefined ? Number(humSeries.data[i]) : 0,
      light: lightSeries?.data[i] !== undefined ? Number(lightSeries.data[i]) : 0,
    }));
  },

  async searchSensorLogs(
    page = 1,
    pageSize = 10,
    searchRequest?: DynamicSearchRequest
  ): Promise<PageResponse<SensorLog>> {
    return request<PageResponse<SensorLog>>(
      `/sensors/data?page=${page}&pageSize=${pageSize}`,
      {
        method: 'POST',
        body: JSON.stringify(searchRequest || {}),
      }
    );
  },

  createSensorStream(
    onData: (data: TelemetryStreamMessage) => void,
    onError?: (err: any) => void,
    onOpen?: () => void
  ): () => void {
    const streamUrl = `${API_BASE_URL}/sensors/stream`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      onOpen?.();
    };

    const handlePayload = (eventData: string) => {
      try {
        const parsed = JSON.parse(eventData);
        onData(parsed);
      } catch (err) {
        console.error('Failed to parse SSE event data:', err);
      }
    };

    eventSource.addEventListener('SENSOR_METRICS_UPDATE', (e: MessageEvent) => {
      handlePayload(e.data);
    });

    eventSource.onmessage = (e: MessageEvent) => {
      handlePayload(e.data);
    };

    eventSource.onerror = (err) => {
      onError?.(err);
    };

    return () => {
      eventSource.close();
    };
  },
};
