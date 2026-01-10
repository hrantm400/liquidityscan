import React from 'react';
import { motion } from 'framer-motion';
import { Cable, Sliders, LineChart, Wallet } from 'lucide-react';

const steps = [
  {
    icon: <Cable className="w-6 h-6" />,
    title: "Connect Exchange",
    desc: "Link your Binance or Bybit account via read-only API keys. Your funds remain 100% safe."
  },
  {
    icon: <Sliders className="w-6 h-6" />,
    title: "Select Strategy",
    desc: "Choose from our pre-built institutional algorithms or customize parameters to fit your style."
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "Receive Signals",
    desc: "Get instant alerts via Telegram, Discord, or Webhook when high-probability setups are detected."
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Execute & Profit",
    desc: "Enter trades with confidence using our defined invalidation levels and take-profit targets."
  }
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            From setup to first trade in under 5 minutes.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-white/5 z-0">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-1/2 mx-auto animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-2xl glass-panel flex items-center justify-center mb-6 border border-white/10 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(19,236,55,0.2)] transition-all duration-300 bg-[#0A0A0A]">
                    <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Step Number Badge */}
                  <div className="absolute top-20 right-1/2 translate-x-10 -translate-y-2 bg-[#0F1115] border border-white/10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono text-gray-400 group-hover:text-primary group-hover:border-primary transition-colors z-20">
                    0{idx + 1}
                  </div>

                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
