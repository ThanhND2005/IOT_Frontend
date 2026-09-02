import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

/**
 * Route bảo vệ các trang yêu cầu xác thực.
 * Nếu chưa đăng nhập (chưa có access_token), tự động chuyển hướng về /login
 * và lưu lại đường dẫn hiện tại vào state để redirect lại sau khi đăng nhập thành công.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
