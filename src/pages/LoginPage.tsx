import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Cpu, Mail, Lock,
  ArrowRight, Wifi, Zap, Activity
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../services';

// ─── Floating particle background ───────────────────────────
function Particle({ index }: { index: number }) {
  const size = 2 + Math.random() * 4;
  const x = Math.random() * 100;
  const duration = 8 + Math.random() * 12;
  const delay = index * 0.4;

  return (
    <motion.div
      className="absolute rounded-full bg-blue-500/20"
      style={{ left: `${x}%`, bottom: '-10px', width: size, height: size }}
      animate={{ y: [0, -(400 + Math.random() * 400)], opacity: [0, 0.6, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ─── Stat badge ────────────────────────────────────────────
function StatBadge({
  icon, label, value, delay
}: { icon: React.ReactNode; label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm"
    >
      <div className="text-blue-400">{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

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
    if (!usernameOrEmail || !password) {
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
    <div className="min-h-screen bg-slate-950 flex overflow-hidden relative">
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => <Particle key={i} index={i} />)}
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Left panel – Branding */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex lg:flex-1 flex-col items-center justify-center relative px-12 py-16"
      >
        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mb-10 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-500/20">
            <Cpu className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            IoT <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xs mx-auto leading-relaxed">
            Hệ thống giám sát cảm biến và điều khiển thiết bị điện thông minh
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
          <StatBadge icon={<Wifi className="w-4 h-4" />} label="Protocol" value="MQTT + SSE Stream" delay={0.5} />
          <StatBadge icon={<Zap className="w-4 h-4" />} label="Thiết bị" value="2 LED Devices" delay={0.6} />
          <StatBadge icon={<Activity className="w-4 h-4" />} label="Cảm biến" value="DHT11 + LDR" delay={0.7} />
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-center text-xs text-slate-500"
        >
          <p>Học viện Công nghệ Bưu chính Viễn thông</p>
          <p className="mt-0.5">Môn: IoT và Ứng dụng · Nhóm 11</p>
        </motion.div>
      </motion.div>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />

      {/* Right panel – Form */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="flex-1 lg:max-w-md flex items-center justify-center px-8 py-12"
      >
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">IoT Dashboard</h1>
              <p className="text-xs text-slate-400">PTIT · B23DCCN772</p>
            </div>
          </div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-1.5">Đăng nhập</h2>
            <p className="text-sm text-slate-400">Nhập tài khoản để truy cập hệ thống</p>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Username or Email */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Tài khoản / Email</label>
              <div className={clsx(
                'relative flex items-center rounded-xl border transition-all duration-200',
                focusedField === 'usernameOrEmail'
                  ? 'border-blue-500/60 ring-1 ring-blue-500/25 bg-slate-800/80'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              )}>
                <Mail className={clsx(
                  'absolute left-3.5 w-4 h-4 transition-colors duration-200',
                  focusedField === 'usernameOrEmail' ? 'text-blue-400' : 'text-slate-500'
                )} />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  onFocus={() => setFocusedField('usernameOrEmail')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="admin hoặc admin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none rounded-xl"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Mật khẩu</label>
              <div className={clsx(
                'relative flex items-center rounded-xl border transition-all duration-200',
                focusedField === 'password'
                  ? 'border-blue-500/60 ring-1 ring-blue-500/25 bg-slate-800/80'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              )}>
                <Lock className={clsx(
                  'absolute left-3.5 w-4 h-4 transition-colors duration-200',
                  focusedField === 'password' ? 'text-blue-400' : 'text-slate-500'
                )} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none rounded-xl"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-6',
                isLoading
                  ? 'bg-blue-600/50 cursor-not-allowed text-blue-200'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
              )}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-blue-200/30 border-t-blue-200 rounded-full"
                  />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-xs text-slate-500 space-y-1"
          >
            <p>Tài khoản mẫu: <span className="font-mono text-slate-400">admin</span> / <span className="font-mono text-slate-400">Admin@123</span></p>
            <p>Hoặc: <span className="font-mono text-slate-400">user</span> / <span className="font-mono text-slate-400">User@123</span></p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
