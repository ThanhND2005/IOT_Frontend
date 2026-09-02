import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SensorDataPage from './pages/SensorDataPage';
import DeviceHistoryPage from './pages/DeviceHistoryPage';
import ProfilePage from './pages/ProfilePage';

// ─── Dev bypass: đặt true để bỏ qua login khi phát triển ────
const DEV_BYPASS = true;

// ─── Private Route Guard ─────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (DEV_BYPASS) return <>{children}</>;
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/sensor-data" element={
          <PrivateRoute><SensorDataPage /></PrivateRoute>
        } />
        <Route path="/device-history" element={
          <PrivateRoute><DeviceHistoryPage /></PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute><ProfilePage /></PrivateRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
