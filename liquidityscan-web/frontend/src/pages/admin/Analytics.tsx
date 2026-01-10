import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const { data: userStats } = useQuery({
    queryKey: ['admin', 'analytics', 'users', period],
    queryFn: () => analyticsApi.getUsers(period),
  });

  const { data: courseStats } = useQuery({
    queryKey: ['admin', 'analytics', 'courses'],
    queryFn: () => analyticsApi.getCourses(),
  });

  const { data: signalStats } = useQuery({
    queryKey: ['admin', 'analytics', 'signals', period],
    queryFn: () => analyticsApi.getSignals(period),
  });

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Analytics</h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary">Platform insights and statistics</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>

        {/* User Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
                </div>
                <div>
                  <p className="text-3xl font-black dark:text-white light:text-text-dark">{userStats?.registrations || 0}</p>
                  <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">New Registrations</p>
                </div>
              </div>
            </motion.div>
            <motion.div variants={listItemVariants} className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500 text-2xl">trending_up</span>
                </div>
                <div>
                  <p className="text-3xl font-black dark:text-white light:text-text-dark">{userStats?.activeUsers || 0}</p>
                  <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">Active Users</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Course Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Course Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courseStats?.byCategory.map((cat: any, index: number) => (
              <motion.div
                key={cat.category}
                variants={listItemVariants}
                custom={index}
                className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    cat.category === 'beginner' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    cat.category === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {cat.category}
                  </span>
                  <p className="text-2xl font-black dark:text-white light:text-text-dark">{cat._count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Signal Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Signal Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signalStats?.byStrategy.map((strategy: any, index: number) => (
              <motion.div
                key={strategy.strategyType}
                variants={listItemVariants}
                custom={index}
                className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium dark:text-gray-400 light:text-text-light-secondary">{strategy.strategyType}</p>
                  <p className="text-2xl font-black dark:text-white light:text-text-dark">{strategy._count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top Rated Courses */}
        {courseStats?.topRated && (
          <div>
            <h2 className="text-xl font-black dark:text-white light:text-text-dark mb-4">Top Rated Courses</h2>
            <div className="glass-panel rounded-2xl border dark:border-white/5 light:border-green-300 overflow-hidden">
              <div className="divide-y dark:divide-white/5 light:divide-green-300">
                {courseStats.topRated.map((course: any, index: number) => (
                  <motion.div
                    key={course.id}
                    variants={listItemVariants}
                    custom={index}
                    className="p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold dark:text-white light:text-text-dark mb-1">{course.title}</h3>
                        <div className="flex items-center gap-4 text-sm dark:text-gray-400 light:text-text-light-secondary">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                            {Number(course.rating).toFixed(1)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">people</span>
                            {course.students} students
                          </div>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-primary">#{index + 1}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
