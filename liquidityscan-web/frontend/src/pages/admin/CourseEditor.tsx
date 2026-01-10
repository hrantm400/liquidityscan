import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseManagementApi, lessonManagementApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'lessons'>('details');
  const [showCreateLesson, setShowCreateLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    type: 'video',
    duration: '',
    content: {},
    locked: false,
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin', 'course', courseId],
    queryFn: () => courseManagementApi.getById(courseId!),
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ['admin', 'lessons', courseId],
    queryFn: () => lessonManagementApi.getByCourse(courseId!),
    enabled: !!courseId,
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => lessonManagementApi.create(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', courseId] });
      setShowCreateLesson(false);
      setNewLesson({
        title: '',
        description: '',
        type: 'video',
        duration: '',
        content: {},
        locked: false,
      });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId: string) => lessonManagementApi.delete(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'lessons', courseId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white light:text-text-dark mb-4">Course not found</h2>
          <button
            onClick={() => navigate('/admin/courses')}
            className="text-primary hover:underline"
          >
            Back to Courses
          </button>
        </div>
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center gap-2 text-sm dark:text-gray-400 light:text-text-light-secondary hover:text-primary transition-colors mb-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Courses
            </button>
            <h1 className="text-3xl font-black dark:text-white light:text-text-dark">{course.title}</h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary mt-1">{course.description}</p>
          </div>
          <button className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all">
            Save Changes
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'details'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-300 light:text-text-dark hover:bg-white/10'
            }`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'lessons'
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-gray-300 light:text-text-dark hover:bg-white/10'
            }`}
          >
            Lessons ({lessons?.length || 0})
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'details' ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass-panel rounded-2xl p-6 border dark:border-white/5 light:border-green-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Title</label>
                  <input
                    type="text"
                    defaultValue={course.title}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Category</label>
                  <select
                    defaultValue={course.category}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Description</label>
                  <textarea
                    defaultValue={course.description}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Instructor</label>
                  <input
                    type="text"
                    defaultValue={course.instructor}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Duration</label>
                  <input
                    type="text"
                    defaultValue={course.duration}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="lessons"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black dark:text-white light:text-text-dark">Course Lessons</h2>
                <button
                  onClick={() => setShowCreateLesson(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Lesson
                </button>
              </div>
              <div className="space-y-3">
                {lessons?.map((lesson: any, index: number) => (
                  <motion.div
                    key={lesson.id}
                    variants={listItemVariants}
                    custom={index}
                    className="glass-panel rounded-xl p-4 border dark:border-white/5 light:border-green-300 flex items-center gap-4"
                  >
                    <div className="flex items-center gap-3 text-gray-400">
                      <span className="material-symbols-outlined">drag_indicator</span>
                      <span className="font-bold">#{lesson.order + 1}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      lesson.type === 'video' ? 'bg-blue-500/20 text-blue-400' :
                      lesson.type === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      <span className="material-symbols-outlined">
                        {lesson.type === 'video' ? 'play_circle' : lesson.type === 'quiz' ? 'quiz' : 'article'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold dark:text-white light:text-text-dark">{lesson.title}</h3>
                      <div className="flex items-center gap-3 text-xs dark:text-gray-400 light:text-text-light-secondary mt-1">
                        <span>{lesson.type}</span>
                        <span>•</span>
                        <span>{lesson.duration}</span>
                        {lesson.locked && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">lock</span>
                              Locked
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-all">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => deleteLessonMutation.mutate(lesson.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Lesson Modal */}
        <AnimatePresence>
          {showCreateLesson && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateLesson(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel rounded-2xl p-8 max-w-2xl w-full border dark:border-white/5 light:border-green-300"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-6">Create Lesson</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Title *</label>
                    <input
                      type="text"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Type *</label>
                      <select
                        value={newLesson.type}
                        onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="video">Video</option>
                        <option value="reading">Reading</option>
                        <option value="quiz">Quiz</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Duration *</label>
                      <input
                        type="text"
                        placeholder="e.g., 15 min"
                        value={newLesson.duration}
                        onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Description</label>
                    <textarea
                      value={newLesson.description}
                      onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newLesson.locked}
                      onChange={(e) => setNewLesson({ ...newLesson, locked: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <label className="text-sm dark:text-white light:text-text-dark">Lock this lesson</label>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCreateLesson(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createLessonMutation.mutate(newLesson)}
                    disabled={createLessonMutation.isPending || !newLesson.title || !newLesson.duration}
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {createLessonMutation.isPending ? 'Creating...' : 'Create Lesson'}
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
