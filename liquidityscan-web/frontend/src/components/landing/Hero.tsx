import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Play, TrendingUp, Zap, BarChart2, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { useAuthStore } from '../../store/authStore';

const data = [
  { value: 4000 }, { value: 3000 }, { value: 5000 }, { value: 2780 },
  { value: 1890 }, { value: 6390 }, { value: 3490 }, { value: 5490 },
  { value: 4000 }, { value: 7000 }, { value: 6500 }, { value: 8500 },
];

export const Hero: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden flex items-center">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none opacity-40" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-mono text-primary uppercase tracking-wider">System Live v2.4</span>
          </motion.div>
          
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] mb-8 tracking-tight">
            Detect the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-300 to-teal-500 animate-gradient">
              Unseen Moves
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
            Institutional-grade liquidity scanner. Identify smart money flow, hidden divergences, and high-probability reversal zones in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              <Button className="w-full sm:w-auto text-lg px-10 py-4 shadow-[0_0_40px_-10px_rgba(19,236,55,0.5)]">
                {isAuthenticated ? "Launch Terminal" : "Start Free Trial"}
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="secondary" className="w-full sm:w-auto text-lg px-10 py-4">
                <Play className="w-4 h-4 fill-white" /> Watch Demo
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
            <div className="flex flex-col gap-2">
              <Zap className="text-primary w-6 h-6 mb-1" />
              <h3 className="font-bold text-white">Real-time</h3>
              <p className="text-xs text-gray-500 font-mono">Latency &lt; 50ms</p>
            </div>
            <div className="flex flex-col gap-2">
              <ShieldCheck className="text-primary w-6 h-6 mb-1" />
              <h3 className="font-bold text-white">No Repaint</h3>
              <p className="text-xs text-gray-500 font-mono">Fixed signals</p>
            </div>
            <div className="flex flex-col gap-2">
              <TrendingUp className="text-primary w-6 h-6 mb-1" />
              <h3 className="font-bold text-white">78% Win Rate</h3>
              <p className="text-xs text-gray-500 font-mono">Backtested</p>
            </div>
          </div>
        </motion.div>

        {/* Visual Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative perspective-1000"
        >
          {/* Main Card */}
          <div className="glass-panel rounded-3xl p-6 border-primary/20 relative z-10 box-glow bg-[#0A0A0A]/80 transform hover:rotate-y-0 transition-transform duration-700 ease-out">
             {/* Header */}
             <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#F7931A]/10 flex items-center justify-center border border-[#F7931A]/20">
                    <span className="text-[#F7931A] font-bold text-xs">BTC</span>
                 </div>
                 <div>
                   <div className="font-bold font-mono text-white">BTC/USDT</div>
                   <div className="text-xs text-green-400 font-mono flex items-center gap-1">
                     <span className="inline-block w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-green-400"></span>
                     +4.23%
                   </div>
                 </div>
               </div>
               <div className="text-right">
                 <div className="font-mono text-xl font-bold text-white">$64,231.50</div>
                 <div className="text-xs text-gray-500 font-mono">Vol: 1.2B</div>
               </div>
             </div>

             {/* Chart */}
             <div className="h-[280px] w-full relative group">
                {/* Scanning line effect */}
                <div className="absolute top-0 bottom-0 w-[2px] bg-primary/50 z-20 shadow-[0_0_10px_rgba(19,236,55,0.5)] animate-[scan_3s_ease-in-out_infinite]" />
                
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#13ec37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#13ec37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#13ec37" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)"
                      animationDuration={2000} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Floating Signal Badge */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
                  transition={{ 
                    opacity: { delay: 1.5, duration: 0.5 },
                    scale: { delay: 1.5, duration: 0.3, type: "spring" },
                    y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                  }}
                  className="absolute top-[40%] left-[60%] bg-[#0A0A0A] border border-primary text-primary px-4 py-2 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(19,236,55,0.2)] flex items-center gap-2 z-30"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  LONG SIGNAL
                </motion.div>
             </div>

             {/* Stats Footer */}
             <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="text-xs text-gray-500 mb-1">Vol (24h)</div>
                  <div className="font-mono text-sm text-white">241.5M</div>
                </div>
                <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
                  <div className="text-xs text-primary/80 mb-1">Liq. Grab</div>
                  <div className="font-mono text-sm text-primary font-bold">High Prob.</div>
                </div>
             </div>
          </div>

          {/* Decorative back elements */}
          <div className="absolute -top-6 -right-6 w-full h-full glass-panel rounded-3xl bg-[#0F1115]/30 opacity-40 -z-10 scale-95 border-white/5" />
          <div className="absolute -top-12 -right-12 w-full h-full glass-panel rounded-3xl bg-[#0F1115]/10 opacity-20 -z-20 scale-90 border-white/5" />
        </motion.div>
      </div>
    </section>
  );
};
