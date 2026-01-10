import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentManagementApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const ContentManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [published, setPublished] = useState<'all' | 'true' | 'false'>('all');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState({
    type: 'article',
    title: '',
    content: '',
    published: false,
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'content', page, type, published],
    queryFn: () =>
      contentManagementApi.getAll({
        page,
        limit: 20,
        type: type || undefined,
        published: published === 'all' ? undefined : published === 'true',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (contentId: string) => contentManagementApi.delete(contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      setShowDeleteModal(false);
      setSelectedContent(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contentManagementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      setShowCreateModal(false);
      setNewContent({ type: 'article', title: '', content: '', published: false });
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      contentManagementApi.publish(id, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
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
            <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Content Management</h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary">
              {data?.total || 0} total items
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Create Content
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Types</option>
            <option value="article">Article</option>
            <option value="news">News</option>
            <option value="notification">Notification</option>
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

        {/* Content List */}
        <div className="glass-panel rounded-2xl border dark:border-white/5 light:border-green-300 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="divide-y dark:divide-white/5 light:divide-green-300">
              {data?.data.map((content: any, index: number) => (
                <motion.div
                  key={content.id}
                  variants={listItemVariants}
                  custom={index}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      content.type === 'article' ? 'bg-blue-500/20' :
                      content.type === 'news' ? 'bg-green-500/20' :
                      'bg-purple-500/20'
                    }`}>
                      <span className={`material-symbols-outlined ${
                        content.type === 'article' ? 'text-blue-400' :
                        content.type === 'news' ? 'text-green-400' :
                        'text-purple-400'
                      }`}>
                        {content.type === 'article' ? 'article' : content.type === 'news' ? 'newspaper' : 'notifications'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold dark:text-white light:text-text-dark">{content.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          content.published
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {content.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm dark:text-gray-400 light:text-text-light-secondary line-clamp-2 mb-2">
                        {content.content}
                      </p>
                      <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">
                        Created: {new Date(content.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => publishMutation.mutate({ id: content.id, published: !content.published })}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-medium dark:text-white light:text-text-dark"
                      >
                        {content.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedContent(content);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
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
            <div className="flex items-center justify-between p-4 border-t dark:border-white/5 light:border-green-300">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-white/5 dark:text-white light:text-text-dark disabled:opacity-50 hover:bg-white/10 transition-all"
              >
                Previous
              </button>
              <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">
                Page {page} of {data.pageCount}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.pageCount, p + 1))}
                disabled={page === data.pageCount}
                className="px-4 py-2 rounded-xl bg-white/5 dark:text-white light:text-text-dark disabled:opacity-50 hover:bg-white/10 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Create Content Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel rounded-2xl p-8 max-w-2xl w-full border dark:border-white/5 light:border-green-300"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-6">Create Content</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Type</label>
                    <select
                      value={newContent.type}
                      onChange={(e) => setNewContent({ ...newContent, type: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="article">Article</option>
                      <option value="news">News</option>
                      <option value="notification">Notification</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Title</label>
                    <input
                      type="text"
                      value={newContent.title}
                      onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Content</label>
                    <textarea
                      value={newContent.content}
                      onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newContent.published}
                      onChange={(e) => setNewContent({ ...newContent, published: e.target.checked })}
                      className="w-4 h-4 rounded border-2 dark:border-white/10 light:border-green-300"
                    />
                    <label className="text-sm dark:text-white light:text-text-dark">Publish immediately</label>
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
                    onClick={() => createMutation.mutate(newContent)}
                    disabled={createMutation.isPending || !newContent.title || !newContent.content}
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedContent && (
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
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-4">Delete Content</h3>
                <p className="dark:text-gray-300 light:text-text-dark mb-6">
                  Are you sure you want to delete <strong>{selectedContent.title}</strong>?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedContent.id)}
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
      </div>
    </motion.div>
  );
};
