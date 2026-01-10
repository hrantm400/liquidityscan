import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signalManagementApi } from '../../services/adminApi';
import { staggerContainer, listItemVariants } from '../../utils/animations';

export const SignalsManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [strategyType, setStrategyType] = useState('');
  const [status, setStatus] = useState('');
  const [symbol, setSymbol] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'signals', page, strategyType, status, symbol],
    queryFn: () =>
      signalManagementApi.getAll({
        page,
        limit: 50,
        strategyType: strategyType || undefined,
        status: status || undefined,
        symbol: symbol || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (signalId: string) => signalManagementApi.delete(signalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'signals'] });
      setShowDeleteModal(false);
      setSelectedSignal(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      signalManagementApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'signals'] });
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
            <h1 className="text-3xl font-black dark:text-white light:text-text-dark mb-2">Signals Management</h1>
            <p className="dark:text-gray-400 light:text-text-light-secondary">
              {data?.total || 0} total signals
            </p>
          </div>
          <button className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">delete_sweep</span>
            Clear Old Signals
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by symbol..."
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={strategyType}
            onChange={(e) => {
              setStrategyType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Strategies</option>
            <option value="SUPER_ENGULFING">Super Engulfing</option>
            <option value="RSI_DIVERGENCE">RSI Divergence</option>
            <option value="ICT_BIAS">ICT Bias</option>
            <option value="HAMMER">Hammer</option>
            <option value="RSI_ALERT">RSI Alert</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="FILLED">Filled</option>
          </select>
        </div>

        {/* Signals Table */}
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
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Symbol</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Strategy</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Type</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Timeframe</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Price</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Status</th>
                    <th className="text-left p-4 text-sm font-bold dark:text-white light:text-text-dark">Detected</th>
                    <th className="text-right p-4 text-sm font-bold dark:text-white light:text-text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((signal: any, index: number) => (
                    <motion.tr
                      key={signal.id}
                      variants={listItemVariants}
                      custom={index}
                      className="border-b dark:border-white/5 light:border-green-300 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4 font-medium dark:text-white light:text-text-dark">{signal.symbol}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                          {signal.strategyType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          signal.signalType === 'BUY'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {signal.signalType}
                        </span>
                      </td>
                      <td className="p-4 dark:text-gray-300 light:text-text-dark">{signal.timeframe}</td>
                      <td className="p-4 dark:text-gray-300 light:text-text-dark">${Number(signal.price).toFixed(2)}</td>
                      <td className="p-4">
                        <select
                          value={signal.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: signal.id, status: e.target.value })}
                          className="px-3 py-1 rounded-lg bg-white/5 border dark:border-white/10 light:border-green-300 text-xs dark:text-white light:text-text-dark"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="EXPIRED">Expired</option>
                          <option value="FILLED">Filled</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm dark:text-gray-400 light:text-text-light-secondary">
                        {new Date(signal.detectedAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSignal(signal);
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
          {showDeleteModal && selectedSignal && (
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
                <h3 className="text-2xl font-black dark:text-white light:text-text-dark mb-4">Delete Signal</h3>
                <p className="dark:text-gray-300 light:text-text-dark mb-6">
                  Are you sure you want to delete this {selectedSignal.strategyType} signal for {selectedSignal.symbol}?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 dark:bg-white/5 light:bg-green-50 border dark:border-white/10 light:border-green-300 dark:text-white light:text-text-dark hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(selectedSignal.id)}
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
