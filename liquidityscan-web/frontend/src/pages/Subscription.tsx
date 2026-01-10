import React from 'react';
import { motion } from 'framer-motion';
import { scaleInVariants, staggerContainer, listItemVariants } from '../utils/animations';

export function Subscription() {
  return (
    <motion.div
      className="flex flex-col h-full"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.header 
        variants={listItemVariants}
        className="h-20 px-8 flex-shrink-0 flex items-center justify-between z-20"
      >
        <div className="flex items-center">
          <nav className="flex items-center text-xs font-mono dark:text-gray-500 light:text-text-light-secondary uppercase tracking-wide">
            <span className="hover:text-gray-300 light:hover:text-text-dark cursor-pointer transition-colors">MONITOR</span>
            <span className="mx-2 text-gray-600 light:text-gray-400">›</span>
            <span className="text-primary font-bold drop-shadow-[0_0_8px_rgba(19,236,55,0.4)]">SUBSCRIPTION PLANS</span>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/30 px-2 py-1 rounded bg-primary/10 shadow-[0_0_10px_rgba(19,236,55,0.2)]">
              Live Feed
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs dark:text-gray-500 light:text-text-light-secondary font-mono pl-6">
            <span>
              Last updated: <span className="dark:text-white light:text-text-dark font-bold">Just now</span>
            </span>
            <button className="w-7 h-7 flex items-center justify-center rounded-full border dark:border-gray-700 light:border-green-300 dark:hover:border-primary light:hover:border-primary dark:text-gray-400 light:text-text-light-secondary hover:text-primary hover:bg-primary/10 transition-all">
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-10 relative custom-scrollbar">
        <div className="max-w-[1400px] mx-auto pt-6">
          <motion.div variants={scaleInVariants} className="mb-12">
            <h2 className="text-4xl font-bold dark:text-white light:text-text-dark mb-3 tracking-tight">
              Subscription <span className="text-primary text-glow">Plans</span>
            </h2>
            <p className="dark:text-gray-400 light:text-text-light-secondary text-sm max-w-2xl font-light leading-relaxed">
              Unlock premium features, faster scanning intervals, and unlimited access to elevate your trading precision.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {/* Starter Plan */}
            <motion.div 
              variants={listItemVariants} 
              whileHover={{ scale: 1.02 }}
              className="glass-panel rounded-2xl p-6 flex flex-col group hover:border-gray-600 transition-all duration-300 relative border dark:border-white/5 light:border-green-300 dark:bg-surface-dark/60 light:bg-white"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="dark:text-white light:text-text-dark font-bold text-xl tracking-tight">Starter</h3>
                  <p className="text-xs dark:text-gray-500 light:text-text-light-secondary mt-1 font-medium">For beginners</p>
                </div>
                <div className="w-10 h-10 rounded-xl dark:bg-[#2a2a2a] light:bg-green-100 flex items-center justify-center dark:text-gray-400 light:text-text-dark border dark:border-white/5 light:border-green-200">
                  <span className="material-symbols-outlined">rocket_launch</span>
                </div>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono dark:text-white light:text-text-dark font-bold tracking-tight">$0</span>
                  <span className="dark:text-gray-500 light:text-text-light-secondary text-xs font-mono">/month</span>
                </div>
              </div>
              <div className="h-px dark:bg-white/5 light:bg-green-200/50 w-full mb-6"></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>5m Timeframe Delay</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Basic Patterns</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>3 Active Alerts</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-600 light:text-gray-400 line-through decoration-gray-700">
                  <span className="material-symbols-outlined text-gray-700 text-sm">close</span>
                  <span>SuperEngulfing Scans</span>
                </li>
              </ul>
              <button className="w-full py-3 rounded-lg border dark:border-white/10 light:border-green-300 text-sm font-medium dark:text-white light:text-text-dark hover:bg-white/5 light:hover:bg-green-50 transition-all">
                Current Plan
              </button>
            </motion.div>

            {/* Pro Trader Plan - Featured */}
            <motion.div 
              variants={listItemVariants}
              whileHover={{ scale: 1.02 }}
              className="dark:bg-[#0a140d]/80 light:bg-green-50 backdrop-blur-md rounded-2xl p-6 flex flex-col border border-primary/30 shadow-[0_0_40px_-10px_rgba(19,236,55,0.15)] relative transform md:-translate-y-2"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="dark:text-white light:text-text-dark font-bold text-xl tracking-tight">Pro Trader</h3>
                  <p className="text-xs text-primary mt-1 font-bold tracking-wide uppercase">Most value</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-glow">
                  <span className="material-symbols-outlined font-bold">bolt</span>
                </div>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-mono text-primary font-bold price-glow tracking-tighter">$49</span>
                  <span className="text-gray-400 text-xs font-mono">/month</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-mono">Billed annually ($588/yr)</p>
              </div>
              <div className="h-px bg-primary/20 w-full mb-6"></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm dark:text-white light:text-text-dark font-medium">
                  <span className="material-symbols-outlined text-primary text-sm bg-primary/20 rounded-full p-0.5" style={{ fontSize: '14px' }}>
                    check
                  </span>
                  <span>Real-time Data Feed</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-white light:text-text-dark font-medium">
                  <span className="material-symbols-outlined text-primary text-sm bg-primary/20 rounded-full p-0.5" style={{ fontSize: '14px' }}>
                    check
                  </span>
                  <span>SuperEngulfing Scans</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-white light:text-text-dark font-medium">
                  <span className="material-symbols-outlined text-primary text-sm bg-primary/20 rounded-full p-0.5" style={{ fontSize: '14px' }}>
                    check
                  </span>
                  <span>Unlimited Alerts</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-white light:text-text-dark font-medium">
                  <span className="material-symbols-outlined text-primary text-sm bg-primary/20 rounded-full p-0.5" style={{ fontSize: '14px' }}>
                    check
                  </span>
                  <span>All Timeframes (1m-1W)</span>
                </li>
              </ul>
              <button className="w-full py-3.5 rounded-lg bg-primary text-black font-bold text-sm hover:bg-primary hover:shadow-[0_0_25px_rgba(19,236,55,0.5)] transition-all">
                Upgrade to Pro
              </button>
            </motion.div>

            {/* Expert Plan */}
            <motion.div 
              variants={listItemVariants}
              whileHover={{ scale: 1.02 }}
              className="glass-panel rounded-2xl p-6 flex flex-col group hover:border-gray-600 transition-all duration-300 relative border dark:border-white/5 light:border-green-300 dark:bg-surface-dark/60 light:bg-white"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="dark:text-white light:text-text-dark font-bold text-xl tracking-tight">Expert</h3>
                  <p className="text-xs dark:text-gray-500 light:text-text-light-secondary mt-1 font-medium">For prop firms</p>
                </div>
                <div className="w-10 h-10 rounded-xl dark:bg-[#2a2a2a] light:bg-green-100 flex items-center justify-center dark:text-gray-400 light:text-text-dark border dark:border-white/5 light:border-green-200 group-hover:border-white/20 transition-colors">
                  <span className="material-symbols-outlined">workspace_premium</span>
                </div>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono dark:text-white light:text-text-dark font-bold tracking-tight">$149</span>
                  <span className="dark:text-gray-500 light:text-text-light-secondary text-xs font-mono">/month</span>
                </div>
              </div>
              <div className="h-px dark:bg-white/5 light:bg-green-200/50 w-full mb-6"></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>API Access</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Multi-User License (3)</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Priority Support</span>
                </li>
              </ul>
              <button className="w-full py-3 rounded-lg border border-primary/30 text-primary font-medium text-sm hover:bg-primary/10 hover:shadow-glow transition-all">
                Select Expert
              </button>
            </motion.div>

            {/* Lifetime Plan */}
            <motion.div 
              variants={listItemVariants}
              whileHover={{ scale: 1.02 }}
              className="glass-panel rounded-2xl p-6 flex flex-col group hover:border-gray-600 transition-all duration-300 relative border dark:border-white/5 light:border-green-300 dark:bg-surface-dark/60 light:bg-white"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="dark:text-white light:text-text-dark font-bold text-xl tracking-tight">Lifetime</h3>
                  <p className="text-xs dark:text-gray-500 light:text-text-light-secondary mt-1 font-medium">Pay once, own forever</p>
                </div>
                <div className="w-10 h-10 rounded-xl dark:bg-[#2a2a2a] light:bg-green-100 flex items-center justify-center dark:text-gray-400 light:text-text-dark border dark:border-white/5 light:border-green-200 group-hover:border-white/20 transition-colors">
                  <span className="material-symbols-outlined">all_inclusive</span>
                </div>
              </div>
              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono dark:text-white light:text-text-dark font-bold tracking-tight">$999</span>
                  <span className="dark:text-gray-500 light:text-text-light-secondary text-xs font-mono">/one-time</span>
                </div>
              </div>
              <div className="h-px dark:bg-white/5 light:bg-green-200/50 w-full mb-6"></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Expert Plan Features</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Lifetime Updates</span>
                </li>
                <li className="flex items-center gap-3 text-sm dark:text-gray-300 light:text-text-secondary">
                  <span className="material-symbols-outlined text-primary text-sm">check</span>
                  <span>Founder's Badge</span>
                </li>
              </ul>
              <button className="w-full py-3 rounded-lg border border-primary/30 text-primary font-medium text-sm hover:bg-primary/10 hover:shadow-glow transition-all">
                Buy Lifetime
              </button>
            </motion.div>
          </motion.div>

          {/* Footer Section */}
          <motion.div variants={scaleInVariants} className="mt-16 pt-8 border-t dark:border-white/5 light:border-green-300 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="dark:text-gray-500 light:text-text-light-secondary text-sm font-light">
              Need help choosing?{' '}
              <a className="text-primary hover:text-primary hover:underline transition-colors" href="#">
                Contact Support
              </a>
            </p>
            <div className="flex gap-4">
              <div className="border dark:border-white/10 light:border-green-300 dark:bg-[#0a120c] light:bg-white px-4 py-2.5 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 text-sm">lock</span>
                <span className="text-xs dark:text-gray-300 light:text-text-dark font-medium">Secure Payment via Stripe</span>
              </div>
              <div className="border dark:border-white/10 light:border-green-300 dark:bg-[#0a120c] light:bg-white px-4 py-2.5 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 text-sm">history</span>
                <span className="text-xs dark:text-gray-300 light:text-text-dark font-medium">14-Day Money Back Guarantee</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
