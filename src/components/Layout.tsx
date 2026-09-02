import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { motion } from 'framer-motion';

interface LayoutProps {
  headerTitle?: string;
  headerSubtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function Layout({ headerTitle = 'Dashboard', headerSubtitle, onRefresh, isRefreshing }: LayoutProps) {
  const [isConnected] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar isConnected={isConnected} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 overflow-y-auto p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
