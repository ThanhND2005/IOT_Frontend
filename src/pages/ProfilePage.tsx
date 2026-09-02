import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, PenSquare, FileText, BookOpen,
  Mail, BadgeCheck, CalendarDays, ExternalLink,
  User, Copy, Check
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { mockUserProfile, type UserProfile } from '../mock/data';

// ─── Link Card ───────────────────────────────────────────────
interface LinkCardProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  gradient: string;
  delay: number;
}

function LinkCard({ href, icon, label, description, color, gradient, delay }: LinkCardProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="glass-card p-4 flex items-center gap-4 group cursor-pointer relative overflow-hidden"
    >
      {/* BG gradient */}
      <div className={clsx('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300', gradient)} />

      <div className={clsx(
        'relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
        color
      )}>
        {icon}
      </div>

      <div className="relative flex-1 min-w-0">
        <p className="font-semibold text-white text-sm group-hover:text-white">{label}</p>
        <p className="text-xs text-slate-400 truncate">{description}</p>
      </div>

      <ExternalLink className="relative w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
    </motion.a>
  );
}

// ─── Copy Button ────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Profile Page ────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const t = setTimeout(() => {
      setProfile(mockUserProfile);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const linkCards: LinkCardProps[] = profile ? [
    {
      href: profile.githubUrl,
      icon: <Code2 className="w-5 h-5 text-white" />,
      label: 'GitHub Repository',
      description: profile.githubUrl,
      color: 'bg-slate-700',
      gradient: 'bg-gradient-to-r from-slate-700/20 to-transparent',
      delay: 0.5,
    },
    {
      href: profile.figmaUrl,
      icon: <PenSquare className="w-5 h-5 text-white" />,
      label: 'Figma Design',
      description: 'Thiết kế UI/UX của hệ thống',
      color: 'bg-purple-600/70',
      gradient: 'bg-gradient-to-r from-purple-600/10 to-transparent',
      delay: 0.6,
    },
    {
      href: profile.systemDocUrl,
      icon: <FileText className="w-5 h-5 text-white" />,
      label: 'System Documentation',
      description: 'Tài liệu kiến trúc & thiết kế hệ thống',
      color: 'bg-green-600/70',
      gradient: 'bg-gradient-to-r from-green-600/10 to-transparent',
      delay: 0.7,
    },
    {
      href: profile.apiDocUrl,
      icon: <BookOpen className="w-5 h-5 text-white" />,
      label: 'API Documentation',
      description: 'Tài liệu Postman API endpoints',
      color: 'bg-orange-600/70',
      gradient: 'bg-gradient-to-r from-orange-600/10 to-transparent',
      delay: 0.8,
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title="Profile" subtitle="Thông tin cá nhân" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skeleton */}
              <div className="glass-card p-6 space-y-4">
                <div className="w-24 h-24 rounded-full shimmer mx-auto" />
                <div className="h-5 rounded shimmer mx-auto w-36" />
                <div className="h-3 rounded shimmer mx-auto w-24" />
                {[1, 2, 3].map(i => <div key={i} className="h-3 rounded shimmer" />)}
              </div>
              <div className="md:col-span-2 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="glass-card p-4 flex gap-4">
                    <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded shimmer w-32" />
                      <div className="h-3 rounded shimmer w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const infoItems = [
    { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: profile.email },
    { icon: <BadgeCheck className="w-3.5 h-3.5" />, label: 'Mã sinh viên', value: profile.studentCode },
    { icon: <User className="w-3.5 h-3.5" />, label: 'Họ và tên', value: profile.fullName },
    { icon: <CalendarDays className="w-3.5 h-3.5" />, label: 'Ngày tạo', value: new Date(profile.createdAt).toLocaleDateString('vi-VN') },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Profile" subtitle="Thông tin cá nhân" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Top gradient */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-600/20 to-transparent" />

                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                  className="relative mt-4 mb-4"
                >
                  <div className="w-24 h-24 rounded-full border-4 border-blue-500/50 overflow-hidden bg-slate-700 shadow-xl shadow-blue-500/20">
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Online dot */}
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-slate-800 flex items-center justify-center"
                  >
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </motion.span>
                </motion.div>

                {/* Name & Code */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-lg font-bold text-white mb-1">{profile.fullName}</h2>
                  <p className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/25 rounded-full px-3 py-1 inline-block mb-4">
                    {profile.studentCode}
                  </p>
                </motion.div>

                {/* Divider */}
                <div className="w-full border-t border-slate-700/50 mb-4" />

                {/* Info items */}
                <div className="w-full space-y-2.5">
                  {infoItems.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.07 }}
                      className="flex items-center justify-between gap-2 text-left"
                    >
                      <div className="flex items-center gap-2 text-slate-400 min-w-0">
                        <span className="text-blue-400 flex-shrink-0">{item.icon}</span>
                        <span className="text-xs flex-shrink-0">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs text-slate-200 truncate font-medium">{item.value}</span>
                        <CopyButton text={item.value} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* School badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4 w-full text-center"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-400">
                    <span>🎓</span>
                    <span>PTIT · IoT và Ứng dụng</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Links Section */}
              <div className="md:col-span-2 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <h3 className="text-base font-semibold text-white mb-1">Tài liệu dự án</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Các tài nguyên kỹ thuật và thiết kế của hệ thống IoT
                  </p>
                </motion.div>

                <div className="space-y-3">
                  {linkCards.map(card => (
                    <LinkCard key={card.label} {...card} />
                  ))}
                </div>

                {/* Tech stack */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="glass-card p-5 mt-4"
                >
                  <h4 className="text-sm font-semibold text-white mb-3">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'ReactJS', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
                      { name: 'TypeScript', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
                      { name: 'TailwindCSS', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
                      { name: 'Spring Boot', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
                      { name: 'PostgreSQL', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
                      { name: 'MQTT', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
                      { name: 'ESP8266', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
                      { name: 'SSE Stream', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
                      { name: 'Framer Motion', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
                    ].map((tech, i) => (
                      <motion.span
                        key={tech.name}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.95 + i * 0.04 }}
                        whileHover={{ scale: 1.05 }}
                        className={clsx('px-2.5 py-1 rounded-full text-xs font-medium border', tech.color)}
                      >
                        {tech.name}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

                {/* System info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="glass-card p-5"
                >
                  <h4 className="text-sm font-semibold text-white mb-3">Thông tin hệ thống</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      { label: 'Vi điều khiển', value: 'ESP8266 NodeMCU' },
                      { label: 'Cảm biến', value: 'DHT11 + LDR' },
                      { label: 'Protocol', value: 'MQTT + SSE' },
                      { label: 'Broker', value: 'Mosquitto' },
                      { label: 'Database', value: 'PostgreSQL' },
                      { label: 'Backend', value: 'Java Spring Boot' },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col gap-0.5">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-slate-200 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
