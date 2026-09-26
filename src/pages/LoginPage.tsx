import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Cpu, Lock,
  ArrowRight, Wifi, Zap, Activity,
  Crown, User, GraduationCap
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../services';

// ─── Stat badge ────────────────────────────────────────────
function StatBadge({
  icon, label, value, iconColor = 'text-blue-600', iconBg = 'bg-blue-50 border-blue-100'
}: { icon: React.ReactNode; label: string; value: string; iconColor?: string; iconBg?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border', iconBg, iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search?: string } })?.from;
  const redirectPath = from ? `${from.pathname}${from.search || ''}` : '/dashboard';

  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'usernameOrEmail' | 'password' | null>(null);

  const handleQuickBypass = (user: string = 'admin') => {
    authService.bypassLogin(user);
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.loginWithBypass(usernameOrEmail || 'admin', password);
      setIsLoading(false);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Đăng nhập không thành công.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden relative">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Left panel – Branding */}
      <div className="hidden lg:flex lg:flex-1 flex-col items-center justify-center relative px-12 py-16 bg-slate-50 border-r border-slate-200">
        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Cpu className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
            IoT <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-600 text-base max-w-xs mx-auto leading-relaxed">
            Hệ thống giám sát cảm biến và điều khiển thiết bị điện thông minh
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
          <StatBadge icon={<Wifi className="w-4 h-4" />} label="Protocol" value="MQTT + SSE Stream" iconColor="text-blue-600" iconBg="bg-blue-50 border-blue-200" />
          <StatBadge icon={<Zap className="w-4 h-4" />} label="Thiết bị" value="2 LED Devices" iconColor="text-amber-600" iconBg="bg-amber-50 border-amber-200" />
          <StatBadge icon={<Activity className="w-4 h-4" />} label="Cảm biến" value="DHT11 + LDR" iconColor="text-emerald-600" iconBg="bg-emerald-50 border-emerald-200" />
        </div>

        {/* Footer info */}
        <div className="mt-10 text-center text-xs text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            <span>Học viện Công nghệ Bưu chính Viễn thông</span>
          </p>
          <p className="mt-0.5">Môn: IoT và Ứng dụng · Nhóm 11</p>
        </div>
      </div>

      {/* Right panel – Form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">IoT Dashboard</h1>
              <p className="text-xs text-slate-500">PTIT · B23DCCN772</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Đăng nhập</h2>
            <p className="text-sm text-slate-500">Nhập tài khoản để truy cập hệ thống</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email */}
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1.5">Tài khoản / Email</label>
              <div className={clsx(
                'relative flex items-center rounded-xl border transition-colors',
                focusedField === 'usernameOrEmail'
                  ? 'border-blue-500 ring-1 ring-blue-500/20 bg-white'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              )}>
                <User className={clsx(
                  'absolute left-3.5 w-4 h-4',
                  focusedField === 'usernameOrEmail' ? 'text-blue-600' : 'text-slate-400'
                )} />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  onFocus={() => setFocusedField('usernameOrEmail')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin hoặc admin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-xl"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">Mật khẩu</label>
                <span className="text-[11px] text-emerald-600 font-medium">Không bắt buộc</span>
              </div>
              <div className={clsx(
                'relative flex items-center rounded-xl border transition-colors',
                focusedField === 'password'
                  ? 'border-blue-500 ring-1 ring-blue-500/20 bg-white'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              )}>
                <Lock className={clsx(
                  'absolute left-3.5 w-4 h-4',
                  focusedField === 'password' ? 'text-blue-600' : 'text-slate-400'
                )} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Không cần mật khẩu (Bỏ trống để bypass)"
                  className="w-full pl-10 pr-10 py-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none rounded-xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-6 cursor-pointer',
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập ngay
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Bypass Button */}
            <button
              type="button"
              onClick={() => handleQuickBypass(usernameOrEmail || 'admin')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              Vào thẳng Dashboard (Bypass không cần mật khẩu)
            </button>
          </form>

          {/* Hint & Quick Account Chips */}
          <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
            <p className="text-slate-500 font-medium">Bấm để đăng nhập nhanh:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickBypass('admin')}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 flex items-center gap-1.5 font-medium text-xs cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Admin (Vào ngay)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickBypass('user')}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 flex items-center gap-1.5 font-medium text-xs cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>User (Vào ngay)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
