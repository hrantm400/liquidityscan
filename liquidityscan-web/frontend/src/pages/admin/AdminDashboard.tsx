import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => analyticsApi.getDashboard(),
    retry: 2,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="dark:text-gray-400 light:text-text-light-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard data</p>
          <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  // Use default values if stats is null
  const dashboardStats = stats || {
    users: { total: 0, recentWeek: 0 },
    courses: { total: 0, published: 0, recentWeek: 0 },
    signals: { total: 0, active: 0 },
    lessons: { total: 0 },
  };

  const quickActions = [
    { label: 'Add Course', icon: 'add_circle', to: '/admin/courses?action=create', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { label: 'View Users', icon: 'people', to: '/admin/users', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { label: 'Manage Signals', icon: 'notifications', to: '/admin/signals', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { label: 'Analytics', icon: 'analytics', to: '/admin/analytics', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  ];

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Dashboard</h1>
          <p className="dark:text-gray-400 light:text-text-light-secondary">Welcome to the admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">people</span>
              </div>
              <span className="text-xs dark:text-gray-500 light:text-text-light-secondary">+{dashboardStats.users.recentWeek} this week</span>
            </div>
            <h3 className="text-3xl font-black dark:text-white light:text-text-dark mb-1">{dashboardStats.users.total}</h3>
            <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Total Users</p>
          </motion.div>

          <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500 text-2xl">school</span>
              </div>
              <span className="text-xs dark:text-gray-500 light:text-text-light-secondary">{dashboardStats.courses.published} published</span>
            </div>
            <h3 className="text-3xl font-black dark:text-white light:text-text-dark mb-1">{dashboardStats.courses.total}</h3>
            <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Total Courses</p>
          </motion.div>

          <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500 text-2xl">notifications</span>
              </div>
              <span className="text-xs dark:text-gray-500 light:text-text-light-secondary">{dashboardStats.signals.active} active</span>
            </div>
            <h3 className="text-3xl font-black dark:text-white light:text-text-dark mb-1">{dashboardStats.signals.total}</h3>
            <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Total Signals</p>
          </motion.div>

          <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500 text-2xl">menu_book</span>
              </div>
            </div>
            <h3 className="text-3xl font-black dark:text-white light:text-text-dark mb-1">{dashboardStats.lessons.total}</h3>
            <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Total Lessons</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.div key={action.label} variants={listItemVariants} custom={index}>
                <Link
                  to={action.to}
                  className={`glass-panel rounded-xl p-6 border ${action.color} hover:scale-105 transition-transform flex flex-col items-center gap-3 text-center`}
                >
                  <span className="material-symbols-outlined text-4xl">{action.icon}</span>
                  <span className="font-bold">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500">person_add</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white light:text-text-dark">New user registered</p>
                <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500">school</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white light:text-text-dark">Course completed</p>
                <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-500">notifications</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white light:text-text-dark">New signal generated</p>
                <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">30 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
