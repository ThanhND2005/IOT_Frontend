import { useState, useEffect } from 'react';
import {
  Code2, Server, PenSquare, FileText, BookOpen,
  Mail, BadgeCheck, ExternalLink,
  User
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
  badge?: string;
}

function LinkCard({ href, icon, label, description, color, gradient, badge }: LinkCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card p-4 md:p-5 flex items-center gap-4 md:gap-5 group cursor-pointer relative overflow-hidden hover:border-blue-400 hover:shadow-md transition-all duration-200"
    >
      {/* BG gradient */}
      <div className={clsx('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300', gradient)} />

      <div className={clsx(
        'relative w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm',
        color
      )}>
        {icon}
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-800 text-base md:text-lg group-hover:text-blue-600 transition-colors">
            {label}
          </p>
          {badge && (
            <span
              className={clsx(
                'px-2.5 py-0.5 text-xs font-semibold rounded-full border',
                badge === 'Frontend'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 group-hover:bg-blue-100'
                  : badge === 'Backend'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-200'
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate mt-1">{description}</p>
      </div>

      <ExternalLink className="relative w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </a>
  );
}

// ─── Git Repo Parser ──────────────────────────────────────────
function parseGitRepositories(rawGitUrl: string): LinkCardProps[] {
  if (!rawGitUrl) return [];

  const urls = rawGitUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  if (urls.length === 0) return [];

  if (urls.length === 1) {
    return [
      {
        href: urls[0],
        icon: <Code2 className="w-6 h-6 md:w-7 md:h-7 text-white" />,
        label: 'GitHub Repository',
        description: urls[0],
        color: 'bg-slate-700',
        gradient: 'bg-gradient-to-r from-slate-700/20 to-transparent',
      },
    ];
  }

  return urls.map((url, index) => {
    const lower = url.toLowerCase();
    const isFe = lower.includes('frontend') || lower.includes('client') || lower.includes('ui');
    const isBe = lower.includes('backend') || lower.includes('server') || lower.includes('api');

    let badge = 'Frontend';
    let isBackend = false;

    if (isFe && !isBe) {
      badge = 'Frontend';
      isBackend = false;
    } else if (isBe && !isFe) {
      badge = 'Backend';
      isBackend = true;
    } else {
      if (index === 0) {
        badge = 'Frontend';
        isBackend = false;
      } else if (index === 1) {
        badge = 'Backend';
        isBackend = true;
      } else {
        badge = `Repo ${index + 1}`;
        isBackend = false;
      }
    }

    return {
      href: url,
      icon: isBackend ? (
        <Server className="w-6 h-6 md:w-7 md:h-7 text-white" />
      ) : (
        <Code2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
      ),
      label: 'GitHub Repository',
      badge,
      description: url,
      color: isBackend ? 'bg-slate-700' : 'bg-slate-800',
      gradient: isBackend
        ? 'bg-gradient-to-r from-slate-700/20 to-transparent'
        : 'bg-gradient-to-r from-slate-800/20 to-transparent',
    };
  });
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

  const rawGitUrl = (() => {
    const val = profile?.git_url || profile?.githubUrl || (profile as any)?.gitUrl;
    if (!val || val === 'https://github.com/your-github/iot-project') {
      return 'https://github.com/ThanhND2005/IOT_Frontend,https://github.com/ThanhND2005/IOT_Backend';
    }
    return val;
  })();

  const effectiveProfile: UserProfile | null = profile ? {
    ...profile,
    email: profile.email || 'b23dccn772@ptit.edu.vn',
    fullName: profile.fullName || 'Nguyễn Danh Thành',
    studentCode: profile.studentCode || 'B23DCCN772',
    avatarUrl: profile.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenDanhThanh&backgroundColor=b6e3f4',
    githubUrl: rawGitUrl,
    git_url: rawGitUrl,
    figmaUrl: profile.figmaUrl || 'https://www.figma.com/your-figma-link',
    systemDocUrl: profile.systemDocUrl || 'https://docs.google.com/document/your-system-doc',
    apiDocUrl: profile.apiDocUrl || 'http://localhost:8080/swagger-ui/index.html',
    createdAt: profile.createdAt || new Date().toISOString(),
  } : null;

  const gitCards = parseGitRepositories(rawGitUrl);

  const linkCards: LinkCardProps[] = effectiveProfile ? [
    ...gitCards,
    {
      href: effectiveProfile.figmaUrl || '',
      icon: <PenSquare className="w-6 h-6 md:w-7 md:h-7 text-white" />,
      label: 'Figma Design',
      description: 'Thiết kế UI/UX của hệ thống',
      color: 'bg-purple-600/70',
      gradient: 'bg-gradient-to-r from-purple-600/10 to-transparent',
    },
    {
      href: effectiveProfile.systemDocUrl || '',
      icon: <FileText className="w-6 h-6 md:w-7 md:h-7 text-white" />,
      label: 'System Documentation',
      description: 'Tài liệu kiến trúc & thiết kế hệ thống',
      color: 'bg-green-600/70',
      gradient: 'bg-gradient-to-r from-green-600/10 to-transparent',
    },
    {
      href: effectiveProfile.apiDocUrl || '',
      icon: <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-white" />,
      label: 'API Docs',
      description: 'OpenAPI 3.0 tài liệu các endpoints backend',
      color: 'bg-blue-600/70',
      gradient: 'bg-gradient-to-r from-blue-600/10 to-transparent',
    },
  ] : [];

  const infoItems = effectiveProfile ? [
    { label: 'Họ và tên', value: effectiveProfile.fullName, icon: <User className="w-5 h-5" /> },
    { label: 'Mã sinh viên', value: effectiveProfile.studentCode || 'B23DCCN772', icon: <BadgeCheck className="w-5 h-5" /> },
    { label: 'Email', value: effectiveProfile.email, icon: <Mail className="w-5 h-5" /> },
  ] : [];

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Thông tin sinh viên"
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {isLoading && !effectiveProfile && (
              <div className="glass-card p-12 text-center text-slate-400 text-sm">
                Đang tải thông tin hồ sơ...
              </div>
            )}

            {effectiveProfile && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

                {/* Profile Card */}
                <div className="glass-card p-6 lg:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  {/* Top gradient */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />

                  {/* Avatar */}
                  <div className="relative mb-6">
                    <div className="w-32 h-32 lg:w-36 lg:h-36 rounded-full border-4 border-blue-500/20 overflow-hidden bg-slate-100 shadow-lg">
                      <img
                        src={effectiveProfile.avatarUrl || ''}
                        alt={effectiveProfile.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full border-t border-slate-200/80 mb-6" />

                  {/* Info items */}
                  <div className="w-full space-y-4">
                    {infoItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-4 text-left py-2.5 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2.5 text-slate-500 flex-shrink-0">
                          <span className="text-blue-600 flex-shrink-0">{item.icon}</span>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <span className="text-sm lg:text-base text-slate-800 font-semibold text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Links Section */}
                <div className="flex flex-col justify-between gap-3.5">
                  {linkCards.map((card, index) => (
                    <LinkCard key={`${card.label}-${card.href}-${index}`} {...card} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
