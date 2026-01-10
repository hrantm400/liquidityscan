import React from 'react';
import { Card } from './ui/Card';
import { BarChart, Scale, TrendingDown } from 'lucide-react';

const strategies = [
  {
    icon: <BarChart className="w-8 h-8" />,
    title: "Super Engulfing",
    desc: "Detects massive candle engulfing patterns backed by 3x volume spikes. Perfect for trend reversals.",
    color: "text-primary"
  },
  {
    icon: <Scale className="w-8 h-8" />,
    title: "ICT Bias",
    desc: "Institutional order block detection coupled with Fair Value Gaps (FVG) to identify smart money entry points.",
    color: "text-teal-400"
  },
  {
    icon: <TrendingDown className="w-8 h-8" />,
    title: "RSI Divergence",
    desc: "Classic momentum divergence strategy automated. Spots when price makes a higher high but momentum drops.",
    color: "text-blue-400"
  }
];

export const Strategies: React.FC = () => {
  return (
    <section id="strategies" className="py-20 relative bg-[#08090C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
           <h2 className="font-display text-3xl md:text-4xl font-bold">Three Pillars of <span className="text-white">Profitability</span></h2>
           <div className="h-1 w-20 bg-primary mt-4 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {strategies.map((strategy, idx) => (
            <Card key={idx} delay={idx * 0.1} className="hover:-translate-y-2 transition-transform duration-300">
               <div className={`mb-6 ${strategy.color}`}>
                 {strategy.icon}
               </div>
               <h3 className="text-xl font-bold mb-3 font-display">{strategy.title}</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 {strategy.desc}
               </p>
               <div className="mt-6 flex items-center gap-2 text-sm font-mono opacity-50">
                 <div className="w-2 h-2 rounded-full bg-current"></div>
                 Algorithm Active
               </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};