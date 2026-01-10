import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const AdminSettings: React.FC = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => settingsApi.get(),
  });

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Settings</h1>
          <p className="dark:text-gray-400 light:text-text-light-secondary">System configuration and settings</p>
        </div>

        {/* Admin Emails */}
        <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300 mb-6">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Admin Emails</h2>
          <div className="space-y-2">
            {settings.adminEmails.map((email: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                <span className="flex-1 dark:text-white light:text-text-dark">{email}</span>
                <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-bold">Admin</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Java Bot Integration */}
        <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300 mb-6">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Java Bot Integration</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium dark:text-white light:text-text-dark mb-1">Status</p>
                <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Java bot connection status</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                settings.javaBot.enabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {settings.javaBot.enabled ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {settings.javaBot.url && (
              <div className="p-4 rounded-xl bg-white/5">
                <p className="font-medium dark:text-white light:text-text-dark mb-1">URL</p>
                <p className="text-sm dark:text-gray-400 light:text-text-light-secondary font-mono">{settings.javaBot.url}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Exchange Integrations */}
        <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300 mb-6">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Exchange Integrations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium dark:text-white light:text-text-dark">Binance</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  settings.exchanges.binance.enabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {settings.exchanges.binance.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium dark:text-white light:text-text-dark">MEXC</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  settings.exchanges.mexc.enabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {settings.exchanges.mexc.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Actions */}
        <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">System Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="px-6 py-4 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">backup</span>
                <div>
                  <p className="font-bold mb-1">Backup Database</p>
                  <p className="text-xs opacity-80">Create a backup of all data</p>
                </div>
              </div>
            </button>
            <button className="px-6 py-4 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">download</span>
                <div>
                  <p className="font-bold mb-1">Export Data</p>
                  <p className="text-xs opacity-80">Export data to CSV/JSON</p>
                </div>
              </div>
            </button>
            <button className="px-6 py-4 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-all text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">refresh</span>
                <div>
                  <p className="font-bold mb-1">Restart Services</p>
                  <p className="text-xs opacity-80">Restart background services</p>
                </div>
              </div>
            </button>
            <button className="px-6 py-4 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all text-left">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
                <div>
                  <p className="font-bold mb-1">Clear Cache</p>
                  <p className="text-xs opacity-80">Clear all cached data</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
