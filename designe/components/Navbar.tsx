import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Radar, Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled ? 'bg-background/80 backdrop-blur-xl border-white/5 py-4' : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center">
            <Radar className="text-black w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            Liquidity<span className="text-primary">Scanner</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#strategies" className="hover:text-primary transition-colors">Strategies</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          <div className="flex items-center gap-4 ml-4">
            <a href="#" className="hover:text-white transition-colors">Log In</a>
            <Button className="!px-6 !py-2 !text-sm">Get Started</Button>
          </div>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden bg-surface border-b border-white/10"
        >
          <div className="flex flex-col p-6 gap-4">
            <a href="#features" className="text-gray-300 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#strategies" className="text-gray-300 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Strategies</a>
            <a href="#pricing" className="text-gray-300 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
            <hr className="border-white/10 my-2"/>
            <a href="#" className="text-gray-300 hover:text-white">Log In</a>
            <Button className="w-full justify-center">Get Started</Button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};