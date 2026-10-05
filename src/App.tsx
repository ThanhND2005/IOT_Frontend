import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SensorDataPage from './pages/SensorDataPage';
import DeviceHistoryPage from './pages/DeviceHistoryPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
      <Routes>
        {/* Public Routes: Chỉ dành cho khách, nếu đã đăng nhập sẽ tự động chuyển tới /dashboard */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected Routes: Yêu cầu đăng nhập, chưa đăng nhập tự động chuyển hướng về /login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sensor-data" element={<SensorDataPage />} />
          <Route path="/device-history" element={<DeviceHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Chuyển hướng mặc định */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </ToastProvider>
  );
}
