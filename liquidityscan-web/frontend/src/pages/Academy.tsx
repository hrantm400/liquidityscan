import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, listItemVariants } from '../utils/animations';

interface Course {
  id: string;
  title: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessons: number;
  progress?: number;
  image?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor: string;
  rating: number;
  students: number;
  price: 'Free' | 'Premium';
  tags: string[];
}

const courses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Trading',
    description: 'Learn the fundamentals of trading, market basics, and how to get started in the financial markets.',
    category: 'beginner',
    duration: '4 hours',
    lessons: 12,
    progress: 0,
    level: 'Beginner',
    instructor: 'John Smith',
    rating: 4.8,
    students: 1250,
    price: 'Free',
    tags: ['Basics', 'Trading 101', 'Market Fundamentals'],
  },
  {
    id: '2',
    title: 'Super Engulfing Patterns Mastery',
    description: 'Master the Super Engulfing candlestick patterns, learn to identify RUN, REV, and PLUS patterns with x-logic.',
    category: 'intermediate',
    duration: '6 hours',
    lessons: 18,
    progress: 35,
    level: 'Intermediate',
    instructor: 'Sarah Johnson',
    rating: 4.9,
    students: 890,
    price: 'Premium',
    tags: ['Candlestick Patterns', 'Super Engulfing', 'Technical Analysis'],
  },
  {
    id: '3',
    title: 'RSI Divergence Trading',
    description: 'Deep dive into RSI divergence strategies, pivot detection, and how to use divergences for profitable trades.',
    category: 'intermediate',
    duration: '5 hours',
    lessons: 15,
    progress: 0,
    level: 'Intermediate',
    instructor: 'Mike Chen',
    rating: 4.7,
    students: 650,
    price: 'Premium',
    tags: ['RSI', 'Divergence', 'Indicators'],
  },
  {
    id: '4',
    title: 'ICT Daily Bias Strategy',
    description: 'Learn the Inner Circle Trader methodology for determining daily bias and making informed trading decisions.',
    category: 'advanced',
    duration: '8 hours',
    lessons: 24,
    progress: 0,
    level: 'Advanced',
    instructor: 'Alex Rodriguez',
    rating: 4.9,
    students: 420,
    price: 'Premium',
    tags: ['ICT', 'Bias', 'Market Structure'],
  },
  {
    id: '5',
    title: 'Hammer Pattern Recognition',
    description: 'Identify and trade hammer patterns across all timeframes with confidence and precision.',
    category: 'beginner',
    duration: '3 hours',
    lessons: 10,
    progress: 100,
    level: 'Beginner',
    instructor: 'Emma Wilson',
    rating: 4.6,
    students: 980,
    price: 'Free',
    tags: ['Patterns', 'Reversal', 'Candlesticks'],
  },
  {
    id: '6',
    title: 'Risk Management Essentials',
    description: 'Master position sizing, stop losses, risk-reward ratios, and protect your trading capital.',
    category: 'beginner',
    duration: '4 hours',
    lessons: 14,
    progress: 0,
    level: 'Beginner',
    instructor: 'David Lee',
    rating: 4.8,
    students: 1100,
    price: 'Free',
    tags: ['Risk Management', 'Money Management', 'Trading Psychology'],
  },
  {
    id: '7',
    title: 'Advanced Market Analysis',
    description: 'Learn advanced techniques for market analysis, including liquidity zones, order blocks, and institutional trading concepts.',
    category: 'advanced',
    duration: '10 hours',
    lessons: 30,
    progress: 0,
    level: 'Advanced',
    instructor: 'Lisa Anderson',
    rating: 5.0,
    students: 320,
    price: 'Premium',
    tags: ['Advanced', 'Market Structure', 'Institutional Trading'],
  },
  {
    id: '8',
    title: 'Trading Psychology & Discipline',
    description: 'Develop the mental framework needed for consistent trading success and emotional control.',
    category: 'intermediate',
    duration: '5 hours',
    lessons: 16,
    progress: 0,
    level: 'Intermediate',
    instructor: 'Robert Taylor',
    rating: 4.7,
    students: 750,
    price: 'Premium',
    tags: ['Psychology', 'Discipline', 'Mindset'],
  },
];

const categories = [
  { id: 'all', label: 'All Courses', icon: 'apps' },
  { id: 'beginner', label: 'Beginner', icon: 'trending_up' },
  { id: 'intermediate', label: 'Intermediate', icon: 'show_chart' },
  { id: 'advanced', label: 'Advanced', icon: 'insights' },
];

export const Academy: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showAchievements, setShowAchievements] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    courses.forEach(course => {
      course.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, []);

  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by price
    if (priceFilter !== 'all') {
      filtered = filtered.filter(course => course.price === (priceFilter === 'free' ? 'Free' : 'Premium'));
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.level.toLowerCase() === levelFilter);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(course =>
        selectedTags.some(tag => course.tags.includes(tag))
      );
    }

    // Sort courses
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return b.id.localeCompare(a.id);
        case 'popular':
        default:
          return b.students - a.students;
      }
    });

    return filtered;
  }, [selectedCategory, searchQuery, sortBy, priceFilter, levelFilter, selectedTags]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const inProgressCourses = courses.filter(c => c.progress && c.progress > 0 && c.progress < 100).length;
    const totalProgress = courses.reduce((sum, c) => sum + (c.progress || 0), 0) / totalCourses;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalProgress: Math.round(totalProgress),
    };
  }, []);

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={staggerContainer}
    >
      {/* Header */}
      <div className="flex flex-col gap-6 px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium dark:text-gray-500 light:text-text-light-secondary uppercase tracking-wider">
            <span className="dark:hover:text-white light:hover:text-text-dark cursor-pointer transition-colors">Academy</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary drop-shadow-[0_0_5px_rgba(19,236,55,0.5)]">Courses</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tight dark:text-white light:text-text-dark flex items-center gap-3">
              Trading Academy
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <motion.div
            variants={listItemVariants}
            className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium dark:text-gray-400 light:text-text-light-secondary mb-1">Total Courses</p>
                <p className="text-2xl font-black dark:text-white light:text-text-dark">{stats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">menu_book</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={listItemVariants}
            className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium dark:text-gray-400 light:text-text-light-secondary mb-1">In Progress</p>
                <p className="text-2xl font-black dark:text-white light:text-text-dark">{stats.inProgressCourses}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-500">play_circle</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={listItemVariants}
            className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium dark:text-gray-400 light:text-text-light-secondary mb-1">Completed</p>
                <p className="text-2xl font-black dark:text-white light:text-text-dark">{stats.completedCourses}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500">check_circle</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={listItemVariants}
            className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium dark:text-gray-400 light:text-text-light-secondary mb-1">Overall Progress</p>
                <p className="text-2xl font-black dark:text-white light:text-text-dark">{stats.totalProgress}%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-500">trending_up</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 px-8 pb-8 flex flex-col">
        <div className="glass-panel w-full h-full rounded-2xl p-6 md:p-8 flex flex-col relative overflow-y-auto custom-scrollbar border dark:border-white/5 light:border-green-300">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-6 shrink-0">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-400 light:text-text-light-secondary hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-400 light:text-text-light-secondary hover:bg-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined">view_list</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'popular' | 'newest' | 'rating')}
                  className="appearance-none bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 rounded-xl px-4 py-3 pr-10 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                  showFilters
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined">tune</span>
                Filters
              </button>

              {/* Achievements Button */}
              <button
                onClick={() => setShowAchievements(true)}
                className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all relative"
              >
                <span className="material-symbols-outlined">emoji_events</span>
                {stats.completedCourses > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                    {stats.completedCourses}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Price Filter */}
                    <div>
                      <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Price</label>
                      <div className="flex gap-2">
                        {(['all', 'free', 'premium'] as const).map((price) => (
                          <button
                            key={price}
                            onClick={() => setPriceFilter(price)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              priceFilter === price
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-300 light:text-text-dark hover:bg-white/10'
                            }`}
                          >
                            {price.charAt(0).toUpperCase() + price.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Level Filter */}
                    <div>
                      <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Level</label>
                      <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    {/* Tags Filter */}
                    <div>
                      <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                        {allTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags(prev =>
                                prev.includes(tag)
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              );
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              selectedTags.includes(tag)
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-300 light:text-text-dark hover:bg-white/10'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 shrink-0">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variants={listItemVariants}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-300 light:text-text-dark hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{category.icon}</span>
                {category.label}
              </motion.button>
            ))}
          </div>

          {/* Courses Grid/List */}
          <AnimatePresence mode="wait">
            {filteredCourses.length > 0 ? (
              <motion.div
                key="courses"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
                }
              >
                {filteredCourses.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} viewMode={viewMode} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-primary">search_off</span>
                </div>
                <h3 className="text-xl font-bold dark:text-white light:text-text-dark mb-2">No courses found</h3>
                <p className="dark:text-gray-400 light:text-text-light-secondary">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Achievements Modal */}
          <AnimatePresence>
            {showAchievements && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowAchievements(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="glass-panel rounded-2xl p-8 max-w-2xl w-full border dark:border-white/5 light:border-green-300 max-h-[80vh] overflow-y-auto custom-scrollbar"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black dark:text-white light:text-text-dark">Your Achievements</h2>
                    <button
                      onClick={() => setShowAchievements(false)}
                      className="p-2 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: '1', title: 'First Steps', description: 'Complete your first course', icon: 'flag', unlocked: stats.completedCourses > 0 },
                      { id: '2', title: 'Dedicated Learner', description: 'Complete 3 courses', icon: 'school', unlocked: stats.completedCourses >= 3 },
                      { id: '3', title: 'Expert Trader', description: 'Complete 10 courses', icon: 'emoji_events', unlocked: stats.completedCourses >= 10 },
                      { id: '4', title: 'Perfect Score', description: 'Get 100% on a quiz', icon: 'star', unlocked: false },
                    ].map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`glass-panel rounded-xl p-4 border transition-all ${
                          achievement.unlocked
                            ? 'border-primary/30 bg-primary/5'
                            : 'opacity-50 border-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            achievement.unlocked
                              ? 'bg-primary/20 text-primary'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            <span className="material-symbols-outlined text-2xl">{achievement.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold dark:text-white light:text-text-dark mb-1">{achievement.title}</h3>
                            <p className="text-sm dark:text-gray-400 light:text-text-light-secondary">{achievement.description}</p>
                            {achievement.unlocked && (
                              <span className="inline-block mt-2 px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                                Unlocked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Course Card Component
const CourseCard: React.FC<{ course: Course; index: number; viewMode: 'grid' | 'list' }> = ({ course, index, viewMode }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={listItemVariants}
        custom={index}
        className="group"
      >
        <Link to={`/academy/course/${course.id}`}>
          <div className="glass-panel rounded-xl overflow-hidden border dark:border-white/5 light:border-green-300 hover:border-primary/30 transition-all cursor-pointer flex gap-4">
            <div className="w-48 h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-4xl text-primary/30">school</span>
            </div>
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        course.level === 'Beginner' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {course.level}
                      </span>
                      {course.price === 'Free' ? (
                        <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                          PREMIUM
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black dark:text-white light:text-text-dark mb-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm dark:text-gray-400 light:text-text-light-secondary line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs dark:text-gray-500 light:text-text-light-secondary">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                    {course.lessons} lessons
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">people</span>
                    {course.students.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                    {course.rating}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 flex flex-col items-end justify-between">
              {course.progress !== undefined && course.progress > 0 && (
                <div className="w-32">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium dark:text-white light:text-text-dark">Progress</span>
                    <span className="text-xs font-bold text-primary">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsBookmarked(!isBookmarked);
                }}
                className={`p-2 rounded-lg transition-all ${
                  isBookmarked
                    ? 'text-primary bg-primary/20'
                    : 'text-gray-400 hover:text-primary hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{isBookmarked ? 'bookmark' : 'bookmark_border'}</span>
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={listItemVariants}
      custom={index}
      className="group"
    >
      <Link to={`/academy/course/${course.id}`}>
        <div className="glass-panel rounded-xl overflow-hidden border dark:border-white/5 light:border-green-300 hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col">
          {/* Course Image/Header */}
          <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(19,236,55,0.1),transparent_70%)]"></div>
            <span className="material-symbols-outlined text-6xl text-primary/30">school</span>
            
            {/* Progress Bar */}
            {course.progress !== undefined && course.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${course.progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full bg-primary"
                />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {course.price === 'Free' ? (
                <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                  FREE
                </span>
              ) : (
                <span className="px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold border border-primary/30">
                  PREMIUM
                </span>
              )}
              {course.progress === 100 && (
                <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  COMPLETE
                </span>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                course.level === 'Beginner' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {course.level}
              </span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                <span className="text-sm font-bold dark:text-white light:text-text-dark">{course.rating}</span>
              </div>
            </div>

            <h3 className="text-lg font-black dark:text-white light:text-text-dark mb-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <p className="text-sm dark:text-gray-400 light:text-text-light-secondary mb-4 line-clamp-2 flex-1">
              {course.description}
            </p>

            {/* Course Meta */}
            <div className="flex items-center gap-4 text-xs dark:text-gray-500 light:text-text-light-secondary mb-4">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {course.duration}
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">menu_book</span>
                {course.lessons} lessons
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">people</span>
                {course.students.toLocaleString()}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {course.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-lg bg-white/5 dark:bg-white/5 light:bg-green-50 text-xs dark:text-gray-400 light:text-text-light-secondary border dark:border-white/10 light:border-green-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-2 pt-4 border-t dark:border-white/5 light:border-green-300">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium dark:text-white light:text-text-dark truncate">{course.instructor}</p>
                <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">Instructor</p>
              </div>
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">arrow_forward</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
