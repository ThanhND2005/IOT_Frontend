import { Navigate, Outlet } from 'react-router-dom';

interface PublicRouteProps {
  children?: React.ReactNode;
}

/**
 * Route dành cho khách (chưa đăng nhập).
 * Nếu người dùng đã đăng nhập (đã có access_token), tự động chuyển hướng về /dashboard.
 */
export default function PublicRoute({ children }: PublicRouteProps) {
  const token = localStorage.getItem('access_token');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
