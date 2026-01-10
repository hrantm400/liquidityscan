import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const adminNavItems = [
  { path: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: 'people', label: 'Users' },
  { path: '/admin/courses', icon: 'school', label: 'Courses' },
  { path: '/admin/signals', icon: 'notifications', label: 'Signals' },
  { path: '/admin/analytics', icon: 'analytics', label: 'Analytics' },
  { path: '/admin/content', icon: 'article', label: 'Content' },
  { path: '/admin/settings', icon: 'settings', label: 'Settings' },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check if user is admin
  // @ts-ignore - isAdmin is added by JWT strategy
  const isAdmin = user?.isAdmin;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0A0B0D] via-[#0D0E10] to-[#0A0B0D] dark:bg-gradient-to-br dark:from-[#0A0B0D] dark:via-[#0D0E10] dark:to-[#0A0B0D] light:bg-gradient-to-br light:from-gray-50 light:via-white light:to-gray-50">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3 }}
        className="glass-panel border-r dark:border-white/5 light:border-green-300 flex flex-col shrink-0"
      >
        {/* Admin Logo */}
        <div className="p-6 border-b dark:border-white/5 light:border-green-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">admin_panel_settings</span>
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h2 className="text-lg font-black dark:text-white light:text-text-dark">Admin Panel</h2>
                <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">Management Console</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path, item.exact)
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'dark:text-gray-300 light:text-text-dark hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-4 border-t dark:border-white/5 light:border-green-300">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">
              {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Back to App */}
        <div className="p-4 border-t dark:border-white/5 light:border-green-300">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {!isSidebarCollapsed && (
              <span className="text-sm font-medium">Back to App</span>
            )}
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="glass-panel border-b dark:border-white/5 light:border-green-300 px-8 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xl font-black dark:text-white light:text-text-dark">Admin Panel</span>
              <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                ADMIN MODE
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white light:text-text-dark">{user?.name || 'Admin'}</p>
                  <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
