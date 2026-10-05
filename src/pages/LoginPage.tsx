import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Cpu, Lock,
  ArrowRight,
  User
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../services';

// ─── Login Page ───────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string; search?: string } })?.from;
  const redirectPath = from ? `${from.pathname}${from.search || ''}` : '/dashboard';

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'usernameOrEmail' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập/email và mật khẩu.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await authService.login({
        usernameOrEmail: usernameOrEmail.trim(),
        password,
      });
      setIsLoading(false);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.');
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

      {/* Left panel – Branding (50%) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative px-12 xl:px-20 py-16 bg-slate-50 border-r border-slate-200">
        {/* Glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="text-center relative z-10 max-w-lg">
          <div className="w-28 h-28 xl:w-32 xl:h-32 rounded-3xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Cpu className="w-14 h-14 xl:w-16 xl:h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight">
            IoT <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-600 text-lg xl:text-xl max-w-md mx-auto leading-relaxed">
            Hệ thống giám sát cảm biến và điều khiển thiết bị điện thông minh
          </p>
        </div>
      </div>

      {/* Right panel – Form (50%) */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-8 sm:px-12 xl:px-20 py-12 lg:py-16">
        <div className="w-full max-w-md xl:max-w-lg">

          {/* Mobile logo */}
          <div className="flex items-center gap-3.5 mb-10 lg:hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">IoT Dashboard</h1>
              <p className="text-xs text-slate-500">PTIT · B23DCCN772</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-slate-900 mb-2.5">Đăng nhập</h2>
            <p className="text-base text-slate-500">Nhập tài khoản để truy cập hệ thống</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username or Email */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Tài khoản / Email</label>
              <div className={clsx(
                'relative flex items-center rounded-2xl border transition-colors',
                focusedField === 'usernameOrEmail'
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
                  : 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
              )}>
                <User className={clsx(
                  'absolute left-4 w-5 h-5',
                  focusedField === 'usernameOrEmail' ? 'text-blue-600' : 'text-slate-400'
                )} />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  onFocus={() => setFocusedField('usernameOrEmail')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin hoặc admin@example.com"
                  className="w-full pl-12 pr-4 py-3.5 xl:py-4 bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none rounded-2xl"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Mật khẩu</label>
              <div className={clsx(
                'relative flex items-center rounded-2xl border transition-colors',
                focusedField === 'password'
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white'
                  : 'border-slate-200 bg-slate-50/80 hover:border-slate-300'
              )}>
                <Lock className={clsx(
                  'absolute left-4 w-5 h-5',
                  focusedField === 'password' ? 'text-blue-600' : 'text-slate-400'
                )} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 xl:py-4 bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none rounded-2xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-base font-semibold mt-8 cursor-pointer transition-colors shadow-lg shadow-blue-500/20',
                isLoading
                  ? 'bg-blue-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
