import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { authService } from '../services';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route bảo vệ các trang yêu cầu xác thực.
 * Tự động bypass đăng nhập nếu chưa có token để người dùng vào thẳng không cần mật khẩu.
 * Nếu người dùng chủ động bấm 'Đăng xuất', mới chuyển hướng về /login.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  let token = localStorage.getItem('access_token');
  const manualLogout = localStorage.getItem('manual_logout');

  // Tự động bypass đăng nhập nếu chưa có token và không phải người dùng vừa chủ động logout
  if (!token && !manualLogout) {
    authService.bypassLogin('admin');
    token = localStorage.getItem('access_token');
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
