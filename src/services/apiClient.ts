import type { BaseResponse } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  code?: number;
  errors?: Record<string, string> | null;

  constructor(message: string, code?: number, errors?: Record<string, string> | null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errors = errors;
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);

    // Handle 401 Unauthorized
    if (res.status === 401) {
      const isDevBypass = localStorage.getItem('access_token')?.startsWith('dev-bypass');
      if (!isDevBypass) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new ApiError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || `Yêu cầu thất bại (mã ${res.status})`;
      throw new ApiError(errorMsg, data?.code || res.status, data?.errors);
    }

    // Backend wraps response in BaseResponse<T>
    if (data && typeof data === 'object' && 'success' in data) {
      const baseRes = data as BaseResponse<T>;
      if (!baseRes.success) {
        throw new ApiError(baseRes.message || 'Thao tác không thành công', baseRes.code, baseRes.errors);
      }
      return baseRes.data;
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error?.message || 'Không thể kết nối tới máy chủ Backend.', 500);
  }
}
