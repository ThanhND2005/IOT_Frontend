interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Title section */}
      <div>
        <h1 className="text-lg font-bold text-slate-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {(() => {
          const user = typeof window !== 'undefined' ? (() => {
            try {
              const raw = localStorage.getItem('user_info');
              return raw ? JSON.parse(raw) : null;
            } catch { return null; }
          })() : null;
          const fullName = user?.fullName || 'Nguyễn Danh Thành';
          const studentCode = user?.studentCode || 'B23DCCN772';
          const avatarUrl = user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenDanhThanh&backgroundColor=b6e3f4';

          return (
            <div className="flex items-center gap-2">
              <div>
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-8 h-8 rounded-full border-2 border-blue-500/30 bg-slate-100"
                />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-900">{fullName}</p>
                <p className="text-[10px] text-slate-500">{studentCode}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </header>
  );
}
