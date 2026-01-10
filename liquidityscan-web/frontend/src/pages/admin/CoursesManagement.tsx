import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { courseManagementApi, lessonManagementApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const CoursesManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [published, setPublished] = useState<'all' | 'true' | 'false'>('all');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    fullDescription: '',
    category: 'beginner',
    level: 'Beginner',
    duration: '',
    price: 'Free',
    instructor: '',
    instructorBio: '',
    tags: [] as string[],
    whatYouWillLearn: [] as string[],
    requirements: [] as string[],
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'courses', page, search, category, published],
    queryFn: () =>
      courseManagementApi.getAll({
        page,
        limit: 12,
        search,
        category: category || undefined,
        published: published === 'all' ? undefined : published === 'true',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => courseManagementApi.delete(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setShowDeleteModal(false);
      setSelectedCourse(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => courseManagementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setShowCreateModal(false);
      setNewCourse({
        title: '',
        description: '',
        fullDescription: '',
        category: 'beginner',
        level: 'Beginner',
        duration: '',
        price: 'Free',
        instructor: '',
        instructorBio: '',
        tags: [],
        whatYouWillLearn: [],
        requirements: [],
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      courseManagementApi.publish(id, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
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
            <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Courses Management</h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary">
              {data?.total || 0} total courses
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Create Course
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Categories</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={published}
            onChange={(e) => {
              setPublished(e.target.value as any);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </select>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {data?.data.map((course: any, index: number) => (
              <motion.div
                key={course.id}
                variants={listItemVariants}
                custom={index}
                className="glass-panel rounded-2xl overflow-hidden border dark:border-white/5 light:border-green-300"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-5xl text-primary/30">school</span>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      course.published
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black dark:text-white light:text-text-dark mb-2">{course.title}</h3>
                  <p className="text-sm dark:text-gray-400 light:text-text-light-secondary mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs dark:text-gray-500 light:text-text-light-secondary mb-4">
                    <span>{course._count?.lessons || 0} lessons</span>
                    <span>{course._count?.progress || 0} enrolled</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/courses/${course.id}`}
                      className="flex-1 px-4 py-2 rounded-xl bg-primary/20 text-primary text-center text-sm font-medium hover:bg-primary/30 transition-all"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => publishMutation.mutate({ id: course.id, published: !course.published })}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 text-sm font-medium hover:bg-white/10 transition-all"
                    >
                      {course.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowDeleteModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pageCount > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-3 rounded-xl bg-white/5 dark:text-white light:text-text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Previous
            </button>
            <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">
              Page {page} of {data.pageCount}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.pageCount, p + 1))}
              disabled={page === data.pageCount}
              className="px-6 py-3 rounded-xl bg-white/5 dark:text-white light:text-text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel rounded-2xl p-8 max-w-md w-full border dark:border-white/5 light:border-green-300"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-4">Delete Course</h3>
                <p className="dark:text-gray-300 light:text-text-dark mb-6">
                  Are you sure you want to delete <strong>{selectedCourse.title}</strong>? This will delete all lessons and cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedCourse.id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Course Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel rounded-2xl p-8 max-w-4xl w-full border dark:border-white/5 light:border-green-300 my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-6">Create New Course</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Title *</label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Category *</label>
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Description *</label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Duration *</label>
                    <input
                      type="text"
                      placeholder="e.g., 4 hours"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Price *</label>
                    <select
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Free">Free</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Instructor *</label>
                    <input
                      type="text"
                      value={newCourse.instructor}
                      onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Level *</label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createMutation.mutate(newCourse)}
                    disabled={createMutation.isPending || !newCourse.title || !newCourse.description}
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
