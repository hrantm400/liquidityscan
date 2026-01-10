import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Strategies } from './components/Strategies';
import { Stats } from './components/Stats';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { Footer } from './components/Footer';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      <Navbar />
      
      <main>
        <Hero />
        <Stats />
        <Features />
        <Strategies />
        <HowItWorks />
        <Pricing />
        
        {/* Final CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-50 pointer-events-none" />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="font-display text-5xl md:text-7xl font-bold mb-8 tracking-tight">
              Stop Guessing. <br />
              <span className="text-primary text-glow">Start Printing.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join 10,000+ traders who have upgraded their edge. No credit card required for the 7-day trial.
            </p>
            <div className="flex justify-center">
               <Button className="px-12 py-5 text-xl font-display font-bold">Get Started Now</Button>
            </div>
            <p className="mt-6 text-sm text-gray-500 font-mono">
              Limited spots available for current beta cohort.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default App;