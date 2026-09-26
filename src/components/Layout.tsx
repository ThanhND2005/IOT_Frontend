import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  headerTitle?: string;
  headerSubtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Layout({ headerTitle = 'Dashboard', headerSubtitle, onRefresh, isRefreshing }: LayoutProps) {
  const [isConnected] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar isConnected={isConnected} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
