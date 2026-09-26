import { useState, useEffect } from 'react';
import {
  Code2, PenSquare, FileText, BookOpen,
  Mail, BadgeCheck, CalendarDays, ExternalLink,
  User, Copy, Check, GraduationCap, Layers
} from 'lucide-react';
import clsx from 'clsx';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import type { UserProfile } from '../types';
import { authService } from '../services';

// ─── Link Card ───────────────────────────────────────────────
interface LinkCardProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  gradient: string;
}

function LinkCard({ href, icon, label, description, color, gradient }: LinkCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card p-4 flex items-center gap-4 group cursor-pointer relative overflow-hidden hover:border-blue-400"
    >
      {/* BG gradient */}
      <div className={clsx('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300', gradient)} />

      <div className={clsx(
        'relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        color
      )}>
        {icon}
      </div>

      <div className="relative flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-600">{label}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>

      <ExternalLink className="relative w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
    </a>
  );
}

// ─── Copy Button ────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
      title="Sao chép"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Profile Page ─────────────────────────────────────────────
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(() => authService.getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const data = await authService.getCurrentUser();
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.warn('Cannot fetch fresh profile, using cached data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const effectiveProfile: UserProfile | null = profile ? {
    ...profile,
    email: profile.email || 'b23dccn772@ptit.edu.vn',
    fullName: profile.fullName || 'Nguyễn Danh Thành',
    studentCode: profile.studentCode || 'B23DCCN772',
    avatarUrl: profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenDanhThanh&backgroundColor=b6e3f4',
    githubUrl: profile.githubUrl || 'https://github.com/your-github/iot-project',
    figmaUrl: profile.figmaUrl || 'https://www.figma.com/your-figma-link',
    systemDocUrl: profile.systemDocUrl || 'https://docs.google.com/document/your-system-doc',
    apiDocUrl: profile.apiDocUrl || 'http://localhost:8080/swagger-ui/index.html',
    createdAt: profile.createdAt || new Date().toISOString(),
  } : null;

  const linkCards: LinkCardProps[] = effectiveProfile ? [
    {
      href: effectiveProfile.githubUrl || '',
      icon: <Code2 className="w-5 h-5 text-white" />,
      label: 'GitHub Repository',
      description: effectiveProfile.githubUrl || '',
      color: 'bg-slate-700',
      gradient: 'bg-gradient-to-r from-slate-700/20 to-transparent',
    },
    {
      href: effectiveProfile.figmaUrl || '',
      icon: <PenSquare className="w-5 h-5 text-white" />,
      label: 'Figma Design',
      description: 'Thiết kế UI/UX của hệ thống',
      color: 'bg-purple-600/70',
      gradient: 'bg-gradient-to-r from-purple-600/10 to-transparent',
    },
    {
      href: effectiveProfile.systemDocUrl || '',
      icon: <FileText className="w-5 h-5 text-white" />,
      label: 'System Documentation',
      description: 'Tài liệu kiến trúc & thiết kế hệ thống',
      color: 'bg-green-600/70',
      gradient: 'bg-gradient-to-r from-green-600/10 to-transparent',
    },
    {
      href: effectiveProfile.apiDocUrl || '',
      icon: <BookOpen className="w-5 h-5 text-white" />,
      label: 'Swagger / API Docs',
      description: 'OpenAPI 3.0 tài liệu các endpoints backend',
      color: 'bg-blue-600/70',
      gradient: 'bg-gradient-to-r from-blue-600/10 to-transparent',
    },
  ] : [];

  const infoItems = effectiveProfile ? [
    { label: 'Họ và tên', value: effectiveProfile.fullName, icon: <User className="w-4 h-4" /> },
    { label: 'Mã sinh viên', value: effectiveProfile.studentCode || 'B23DCCN772', icon: <BadgeCheck className="w-4 h-4" /> },
    { label: 'Email', value: effectiveProfile.email, icon: <Mail className="w-4 h-4" /> },
    {
      label: 'Ngày tham gia',
      value: effectiveProfile.createdAt
        ? new Date(effectiveProfile.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
        : '01/09/2026',
      icon: <CalendarDays className="w-4 h-4" />,
    },
  ] : [];

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Thông tin sinh viên"
          subtitle="Hồ sơ thành viên nhóm phát triển"
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {isLoading && !effectiveProfile && (
              <div className="glass-card p-12 text-center text-slate-400 text-sm">
                Đang tải thông tin hồ sơ...
              </div>
            )}

            {effectiveProfile && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Profile Card */}
                <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden">
                  {/* Top gradient */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-50 to-transparent" />

                  {/* Avatar */}
                  <div className="relative mt-4 mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 overflow-hidden bg-slate-100 shadow-md">
                      <img
                        src={effectiveProfile.avatarUrl || ''}
                        alt={effectiveProfile.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Online dot */}
                    <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </span>
                  </div>

                  {/* Name & Code */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">{effectiveProfile.fullName}</h2>
                    <p className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 inline-block mb-4">
                      {effectiveProfile.studentCode}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-full border-t border-slate-200 mb-4" />

                  {/* Info items */}
                  <div className="w-full space-y-2.5">
                    {infoItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 text-left"
                      >
                        <div className="flex items-center gap-2 text-slate-500 min-w-0">
                          <span className="text-blue-600 flex-shrink-0">{item.icon}</span>
                          <span className="text-xs flex-shrink-0">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs text-slate-800 truncate font-medium">{item.value}</span>
                          <CopyButton text={item.value} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* School badge */}
                  <div className="mt-4 w-full text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>PTIT · IoT và Ứng dụng</span>
                    </div>
                  </div>
                </div>

                {/* Links Section */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <h3 className="text-base font-semibold text-slate-900">Tài liệu dự án</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Các tài nguyên kỹ thuật và thiết kế của hệ thống IoT
                    </p>
                  </div>

                  <div className="space-y-3">
                    {linkCards.map((card) => (
                      <LinkCard key={card.label} {...card} />
                    ))}
                  </div>

                  {/* Tech stack */}
                  <div className="glass-card p-5 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-slate-900">Tech Stack</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'ReactJS', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                        { name: 'TypeScript', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { name: 'TailwindCSS', color: 'bg-teal-50 text-teal-700 border-teal-200' },
                        { name: 'Spring Boot', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        { name: 'PostgreSQL', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                        { name: 'MQTT', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                        { name: 'ESP8266', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                        { name: 'SSE Stream', color: 'bg-pink-50 text-pink-700 border-pink-200' },
                      ].map((tech) => (
                        <span
                          key={tech.name}
                          className={clsx('px-2.5 py-1 rounded-full text-xs font-medium border', tech.color)}
                        >
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
