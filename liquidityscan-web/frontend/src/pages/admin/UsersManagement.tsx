import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const UsersManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => userManagementApi.getAll({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => userManagementApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowDeleteModal(false);
      setSelectedUser(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userManagementApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowEditModal(false);
      setSelectedUser(null);
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
            <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Users Management</h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary">
              {data?.total || 0} total users
            </p>
          </div>
          <button className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">person_add</span>
            Add User
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-panel rounded-2xl overflow-hidden border dark:border-white/5 light:border-green-300">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b dark:border-white/5 light:border-green-300 bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">User</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Email</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Subscription</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Joined</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Courses</th>
                    <th className="text-right p-4 text-sm font-bold dark:text-white light:text-text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((user: any, index: number) => (
                    <motion.tr
                      key={user.id}
                      variants={listItemVariants}
                      custom={index}
                      className="border-b dark:border-white/5 light:border-green-300 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">person</span>
                          </div>
                          <div>
                            <p className="font-medium dark:text-white light:text-text-dark">{user.name || 'No name'}</p>
                            <p className="text-xs dark:text-gray-500 light:text-text-light-secondary">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 dark:text-gray-300 light:text-text-dark">{user.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.subscription ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {user.subscription?.name || 'Free'}
                        </span>
                      </td>
                      <td className="p-4 text-sm dark:text-gray-400 light:text-text-light-secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-sm dark:text-gray-300 light:text-text-dark">
                        {user._count?.courseProgress || 0}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-primary/20 text-primary transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pageCount > 1 && (
            <div className="flex items-center justify-between p-4 border-t dark:border-white/5 light:border-green-300">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-white/5 dark:text-white light:text-text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                Previous
              </button>
              <span className="text-sm dark:text-gray-400 light:text-text-light-secondary">
                Page {page} of {data.pageCount}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.pageCount, p + 1))}
                disabled={page === data.pageCount}
                className="px-4 py-2 rounded-xl bg-white/5 dark:text-white light:text-text-dark disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedUser && (
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
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-4">Delete User</h3>
                <p className="dark:text-gray-300 light:text-text-dark mb-6">
                  Are you sure you want to delete <strong>{selectedUser.email}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedUser.id)}
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

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel rounded-2xl p-8 max-w-2xl w-full border dark:border-white/5 light:border-green-300"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-6">Edit User</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Name</label>
                    <input
                      type="text"
                      defaultValue={selectedUser.name}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-white light:text-text-dark mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={selectedUser.email}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: selectedUser.id, data: {} })}
                    disabled={updateMutation.isPending}
                    className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
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
