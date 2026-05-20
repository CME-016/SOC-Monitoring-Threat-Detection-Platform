import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Security Dashboard',
  '/threats': 'Threat Intelligence',
  '/analytics': 'Visitor Analytics',
  '/websites': 'Website Management',
  '/alerts': 'Alert Center',
  '/logs': 'Log Explorer',
  '/settings': 'Settings',
  '/profile': 'User Profile',
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'CyberSOC Platform';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
