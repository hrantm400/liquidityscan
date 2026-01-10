import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signalsApi } from '../services/api';
import { Timeframe } from '../types';
import { staggerContainer, listItemVariants, scaleInVariants } from '../utils/animations';

interface StrategySummary {
  total: number;
  timeframes: Record<Timeframe, number>;
}

// Strategy-specific timeframes (as per Java bot and PineScript indicators)
const STRATEGY_TIMEFRAMES = {
  SUPER_ENGULFING: ['4h', '1d', '1w'] as Timeframe[],
  RSI_DIVERGENCE: ['1h', '4h', '1d'] as Timeframe[],
  ICT_BIAS: ['4h', '1d', '1w'] as Timeframe[]
};

export const Dashboard: React.FC = () => {
  const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(new Set());
  // Initialize with only relevant timeframes for each strategy
  const [superEngulfingSummary, setSuperEngulfingSummary] = useState<StrategySummary>({ 
    total: 0, 
    timeframes: { '4h': 0, '1d': 0, '1w': 0 } as Record<Timeframe, number> 
  });
  const [biasSummary, setBiasSummary] = useState<StrategySummary>({ 
    total: 0, 
    timeframes: { '4h': 0, '1d': 0, '1w': 0 } as Record<Timeframe, number> 
  });
  const [rsiSummary, setRsiSummary] = useState<StrategySummary>({ 
    total: 0, 
    timeframes: { '1h': 0, '4h': 0, '1d': 0 } as Record<Timeframe, number> 
  });

  // Fetch SuperEngulfing signals
  const { data: seData } = useQuery({
    queryKey: ['signals', 'SUPER_ENGULFING'],
    queryFn: () => signalsApi.getSignals({ strategyType: 'SUPER_ENGULFING', limit: 1000 }),
  });

  // Fetch Bias signals
  const { data: biasData } = useQuery({
    queryKey: ['signals', 'ICT_BIAS'],
    queryFn: () => signalsApi.getSignals({ strategyType: 'ICT_BIAS', limit: 1000 }),
  });

  // Fetch RSI signals
  const { data: rsiData } = useQuery({
    queryKey: ['signals', 'RSI_DIVERGENCE'],
    queryFn: () => signalsApi.getSignals({ strategyType: 'RSI_DIVERGENCE', limit: 1000 }),
  });

  useEffect(() => {
    if (seData) {
      const signals = seData as any[];
      const summary: StrategySummary = {
        total: signals.length,
        timeframes: { '4h': 0, '1d': 0, '1w': 0 } as Record<Timeframe, number>,
      };
      signals.forEach((signal) => {
        const tf = signal.timeframe as Timeframe;
        // Only count signals from relevant timeframes (4h, 1d, 1w)
        if (STRATEGY_TIMEFRAMES.SUPER_ENGULFING.includes(tf) && summary.timeframes[tf] !== undefined) {
          summary.timeframes[tf]++;
        }
      });
      setSuperEngulfingSummary(summary);
    }
  }, [seData]);

  useEffect(() => {
    if (biasData) {
      const signals = biasData as any[];
      const summary: StrategySummary = {
        total: signals.length,
        timeframes: { '4h': 0, '1d': 0, '1w': 0 } as Record<Timeframe, number>,
      };
      signals.forEach((signal) => {
        const tf = signal.timeframe as Timeframe;
        // Only count signals from relevant timeframes (4h, 1d, 1w)
        if (STRATEGY_TIMEFRAMES.ICT_BIAS.includes(tf) && summary.timeframes[tf] !== undefined) {
          summary.timeframes[tf]++;
        }
      });
      setBiasSummary(summary);
    }
  }, [biasData]);

  useEffect(() => {
    if (rsiData) {
      const signals = rsiData as any[];
      const summary: StrategySummary = {
        total: signals.length,
        timeframes: { '1h': 0, '4h': 0, '1d': 0 } as Record<Timeframe, number>,
      };
      signals.forEach((signal) => {
        const tf = signal.timeframe as Timeframe;
        // Only count signals from relevant timeframes (1h, 4h, 1d)
        if (STRATEGY_TIMEFRAMES.RSI_DIVERGENCE.includes(tf) && summary.timeframes[tf] !== undefined) {
          summary.timeframes[tf]++;
        }
      });
      setRsiSummary(summary);
    }
  }, [rsiData]);

  const toggleAccordion = (targetId: string) => {
    setExpandedAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(targetId)) {
        newSet.delete(targetId);
      } else {
        // Close all others
        newSet.clear();
        newSet.add(targetId);
      }
      return newSet;
    });
  };

  const isExpanded = (targetId: string) => expandedAccordions.has(targetId);

  return (
    <motion.div
      className="flex flex-col h-full"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.header 
        variants={listItemVariants}
        className="flex items-center justify-between px-8 py-6 shrink-0 z-20"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-primary/80 uppercase tracking-widest">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#13ec37]"></span>
            System Online
          </div>
          <h1 className="text-3xl font-black tracking-tighter dark:text-white light:text-text-dark flex items-center gap-3 drop-shadow-lg">
            Monitor Overview
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center dark:bg-white/5 light:bg-green-50 dark:border-white/10 light:border-green-300 rounded-full px-4 py-2 dark:hover:bg-white/10 light:hover:bg-green-100 transition-colors cursor-pointer group border border-transparent">
            <span className="material-symbols-outlined dark:text-gray-400 light:text-text-light-secondary mr-2 group-hover:text-primary">search</span>
            <input className="bg-transparent border-none text-sm dark:text-white light:text-text-dark focus:ring-0 dark:placeholder:text-gray-500 light:placeholder:text-text-light-secondary w-48 p-0" placeholder="Quick Search..." type="text" />
            <span className="text-[10px] font-mono dark:text-gray-600 light:text-text-light-secondary dark:border-gray-700 light:border-green-300 rounded px-1.5 py-0.5 ml-2">/</span>
          </div>
          <button className="w-10 h-10 rounded-full dark:bg-white/5 light:bg-green-50 dark:border-white/10 light:border-green-300 flex items-center justify-center dark:text-gray-400 light:text-text-light-secondary hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all border border-transparent">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2">
        <div className="max-w-7xl mx-auto h-full flex flex-col pb-20">
          {/* Strategy Accordions */}
          <motion.div 
            variants={staggerContainer}
            className="flex flex-col gap-4 relative isolate mb-16"
          >
            {/* SuperEngulfing */}
            <motion.div 
              variants={listItemVariants}
              whileHover={{ scale: 1.01 }}
              className="glass-panel rounded-2xl relative z-30"
            >
              <div
                className={`p-6 flex items-center justify-between cursor-pointer transition-all ${
                  isExpanded('superEngulfing-content') ? 'accordion-header-expanded dark:border-b-white/5 light:border-b-green-200/30' : ''
                }`}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('a')) {
                    toggleAccordion('superEngulfing-content');
                  }
                }}
              >
                <Link to="/monitor/superengulfing" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(19,236,55,0.15)] group-hover:shadow-[0_0_30px_rgba(19,236,55,0.3)] transition-all">
                    <span className="material-symbols-outlined text-3xl">bolt</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold dark:text-white light:text-text-dark group-hover:text-primary transition-colors">SuperEngulfing</h3>
                    <span className="text-xs dark:text-gray-400 light:text-text-light-secondary tracking-wide font-mono">Strategy A-01</span>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="summary-count px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 animate-pulse">
                    {superEngulfingSummary.total} FOUND
                  </span>
                  <button
                    className="toggle-button p-1.5 rounded dark:text-gray-500 light:text-text-light-secondary dark:hover:text-white light:hover:text-text-dark transition-colors dark:hover:bg-white/5 light:hover:bg-green-100"
                    title="Toggle View"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAccordion('superEngulfing-content');
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isExpanded('superEngulfing-content') ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>
              <div
                className={`accordion-content ${isExpanded('superEngulfing-content') ? 'expanded' : ''}`}
                id="superEngulfing-content"
                style={{
                  maxHeight: isExpanded('superEngulfing-content') ? '500px' : '0',
                  paddingTop: isExpanded('superEngulfing-content') ? '1.5rem' : '0',
                  paddingBottom: isExpanded('superEngulfing-content') ? '1.5rem' : '0',
                }}
              >
                <div className="p-6 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                  <Link
                    to="/monitor/superengulfing?timeframe=4h"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        4H
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Mid-Term Trend</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{superEngulfingSummary.timeframes['4h']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                  <Link
                    to="/monitor/superengulfing?timeframe=1d"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        1D
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Daily Structure</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{superEngulfingSummary.timeframes['1d']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                  <Link
                    to="/monitor/superengulfing?timeframe=1w"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        1W
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Macro View</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{superEngulfingSummary.timeframes['1w']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Daily Bias */}
            <motion.div 
              variants={listItemVariants}
              whileHover={{ scale: 1.01 }}
              className="glass-panel rounded-2xl relative z-20"
            >
              <div
                className={`p-6 flex items-center justify-between cursor-pointer transition-all ${
                  isExpanded('dailyBias-content') ? 'accordion-header-expanded dark:border-b-white/5 light:border-b-green-200/30' : ''
                }`}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('a')) {
                    toggleAccordion('dailyBias-content');
                  }
                }}
              >
                <Link to="/monitor/bias" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(19,236,55,0.15)] group-hover:shadow-[0_0_30px_rgba(19,236,55,0.3)] transition-all">
                    <span className="material-symbols-outlined text-3xl">explore</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold dark:text-white light:text-text-dark group-hover:text-primary transition-colors">Daily Bias</h3>
                    <span className="text-xs dark:text-gray-400 light:text-text-light-secondary tracking-wide font-mono">Strategy B-04</span>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="summary-count px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 animate-pulse">
                    {biasSummary.total} FOUND
                  </span>
                  <button
                    className="toggle-button p-1.5 rounded dark:text-gray-500 light:text-text-light-secondary dark:hover:text-white light:hover:text-text-dark transition-colors dark:hover:bg-white/5 light:hover:bg-green-100"
                    title="Toggle View"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAccordion('dailyBias-content');
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isExpanded('dailyBias-content') ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>
              <div
                className={`accordion-content ${isExpanded('dailyBias-content') ? 'expanded' : ''}`}
                id="dailyBias-content"
                style={{
                  maxHeight: isExpanded('dailyBias-content') ? '500px' : '0',
                  paddingTop: isExpanded('dailyBias-content') ? '1.5rem' : '0',
                  paddingBottom: isExpanded('dailyBias-content') ? '1.5rem' : '0',
                }}
              >
                <div className="p-6 flex-1 flex flex-col gap-3 custom-scrollbar">
                  <Link
                    to="/monitor/bias?timeframe=4h"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        4H
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Mid-Term Bias</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{biasSummary.timeframes['4h']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                  <Link
                    to="/monitor/bias?timeframe=1d"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        1D
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Daily Bias</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{biasSummary.timeframes['1d']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                  <Link
                    to="/monitor/bias?timeframe=1w"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        1W
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Weekly Bias</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{biasSummary.timeframes['1w']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* RSI Divergence */}
            <motion.div 
              variants={listItemVariants}
              whileHover={{ scale: 1.01 }}
              className="glass-panel rounded-2xl relative z-10"
            >
              <div
                className={`p-6 flex items-center justify-between cursor-pointer transition-all ${
                  isExpanded('rsiDivergence-content') ? 'accordion-header-expanded dark:border-b-white/5 light:border-b-green-200/30' : ''
                }`}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('a')) {
                    toggleAccordion('rsiDivergence-content');
                  }
                }}
              >
                <Link to="/monitor/rsi" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(19,236,55,0.15)] group-hover:shadow-[0_0_30px_rgba(19,236,55,0.3)] transition-all">
                    <span className="material-symbols-outlined text-3xl">show_chart</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-bold dark:text-white light:text-text-dark group-hover:text-primary transition-colors">RSI Divergence</h3>
                    <span className="text-xs dark:text-gray-400 light:text-text-light-secondary tracking-wide font-mono">Strategy C-12</span>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <span className="summary-count px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 animate-pulse">
                    {rsiSummary.total} FOUND
                  </span>
                  <button
                    className="toggle-button p-1.5 rounded dark:text-gray-500 light:text-text-light-secondary dark:hover:text-white light:hover:text-text-dark transition-colors dark:hover:bg-white/5 light:hover:bg-green-100"
                    title="Toggle View"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAccordion('rsiDivergence-content');
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isExpanded('rsiDivergence-content') ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>
              <div
                className={`accordion-content ${isExpanded('rsiDivergence-content') ? 'expanded' : ''}`}
                id="rsiDivergence-content"
                style={{
                  maxHeight: isExpanded('rsiDivergence-content') ? '500px' : '0',
                  paddingTop: isExpanded('rsiDivergence-content') ? '1.5rem' : '0',
                  paddingBottom: isExpanded('rsiDivergence-content') ? '1.5rem' : '0',
                }}
              >
                <div className="p-6 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                  <Link
                    to="/monitor/rsi?timeframe=1h"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        1H
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Hourly Scalping</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{rsiSummary.timeframes['1h']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                  <Link
                    to="/monitor/rsi?timeframe=4h"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        4H
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Swing Setups</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{rsiSummary.timeframes['4h']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                  <Link
                    to="/monitor/rsi?timeframe=1d"
                    className="w-full flex justify-between items-center p-4 rounded-xl dark:border-white/5 light:border-green-300 dark:bg-white/[0.02] light:bg-green-50 border hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono group-hover:bg-primary group-hover:text-black transition-colors">
                        1D
                      </span>
                      <span className="text-sm dark:text-gray-400 light:text-text-light-secondary dark:group-hover:text-white light:group-hover:text-text-dark transition-colors">Daily Structure</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="dark:text-white light:text-text-dark font-mono font-bold">{rsiSummary.timeframes['1d']} Found</span>
                      <span className="material-symbols-outlined text-sm dark:text-gray-600 light:text-text-light-secondary group-hover:text-primary">chevron_right</span>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={listItemVariants}
            className="mt-8 flex justify-center opacity-30"
          >
            <span className="text-xs font-mono text-primary uppercase tracking-[0.5em]">System Operational • V2.4.0</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
