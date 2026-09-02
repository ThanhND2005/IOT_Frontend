import { request } from './apiClient';
import type {
  Device,
  DeviceControlResponse,
  DeviceHistoryItem,
  PageResponse,
  DynamicSearchRequest,
} from '../types';

export const deviceService = {
  async getAllDevices(): Promise<Device[]> {
    const list = await request<Device[]>('/devices', {
      method: 'GET',
    });
    return list || [];
  },

  async controlDevice(deviceId: string, action: 'ON' | 'OFF'): Promise<DeviceControlResponse> {
    return request<DeviceControlResponse>(`/devices/control/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  async searchDeviceHistory(
    page = 1,
    pageSize = 10,
    searchRequest?: DynamicSearchRequest
  ): Promise<PageResponse<DeviceHistoryItem>> {
    return request<PageResponse<DeviceHistoryItem>>(
      `/devices/history?page=${page}&pageSize=${pageSize}`,
      {
        method: 'POST',
        body: JSON.stringify(searchRequest || {}),
      }
    );
  },
};
