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
    const user = await request<UserResponse>('/auth/me', {
      method: 'GET',
    });

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

  /**
   * Tạo phiên đăng nhập giả lập trực tiếp (Bypass không cần mật khẩu / Backend)
   */
  bypassLogin(username: string = 'admin'): AuthResponse {
    const isUserRole = username.toLowerCase() === 'user';
    const mockUser: UserResponse = {
      id: isUserRole ? 2 : 1,
      username: username || 'admin',
      email: isUserRole ? 'user@ptit.edu.vn' : 'b23dccn772@ptit.edu.vn',
      fullName: isUserRole ? 'Người dùng IoT' : 'Nguyễn Danh Thành',
      studentCode: isUserRole ? 'B23DCCN000' : 'B23DCCN772',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${isUserRole ? 'IoTUser' : 'NguyenDanhThanh'}&backgroundColor=b6e3f4`,
      githubUrl: 'https://github.com/your-github/iot-project',
      figmaUrl: 'https://www.figma.com/your-figma-link',
      systemDocUrl: 'https://docs.google.com/document/your-system-doc',
      apiDocUrl: 'http://localhost:8080/swagger-ui/index.html',
      role: isUserRole ? 'ROLE_USER' : 'ROLE_ADMIN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockAuth: AuthResponse = {
      accessToken: `dev-bypass-${Date.now()}`,
      refreshToken: `dev-bypass-refresh-${Date.now()}`,
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: mockUser,
    };

    localStorage.setItem('access_token', mockAuth.accessToken);
    localStorage.setItem('refresh_token', mockAuth.refreshToken);
    localStorage.setItem('user_info', JSON.stringify(mockUser));
    localStorage.removeItem('manual_logout');

    return mockAuth;
  },

  /**
   * Đăng nhập thông minh:
   * - Nếu backend hoạt động và nhập pass -> gửi backend
   * - Nếu không có pass hoặc backend offline -> tự động bypass đăng nhập luôn
   */
  async loginWithBypass(usernameOrEmail: string = 'admin', password?: string): Promise<AuthResponse> {
    const user = usernameOrEmail.trim() || 'admin';
    const defaultPassword = user.toLowerCase() === 'user' ? 'User@123' : 'Admin@123';
    const effectivePassword = password?.trim() || defaultPassword;

    try {
      const res = await this.login({
        usernameOrEmail: user,
        password: effectivePassword,
      });
      localStorage.removeItem('manual_logout');
      return res;
    } catch {
      // Backend offline hoặc xác thực thất bại -> fallback vào chế độ bypass
      return this.bypassLogin(user);
    }
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.setItem('manual_logout', 'true');
    window.location.href = '/login';
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('access_token'));
  },
};
