import { request } from './apiClient';
import type { AuthResponse, LoginRequest, UserResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data?.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
    }
    if (data?.refreshToken) {
      localStorage.setItem('refresh_token', data.refreshToken);
    }
    if (data?.user) {
      localStorage.setItem('user_info', JSON.stringify(data.user));
    }

    return data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    let user: UserResponse;
    try {
      user = await request<UserResponse>('/profile/me', {
        method: 'GET',
      });
    } catch {
      user = await request<UserResponse>('/auth/me', {
        method: 'GET',
      });
    }

    if (user) {
      localStorage.setItem('user_info', JSON.stringify(user));
    }

    return user;
  },

  getStoredUser(): UserResponse | null {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('manual_logout');
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('access_token'));
  },
};
