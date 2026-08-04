'use client';

import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#" className="font-serif text-3xl font-bold  text-black transition-colors">
              Sensei
            </a>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#platform" className="relative group font-sans text-black transition-colors px-3 py-2">
              {/* Premium curved background - solid green, no glow */}
              <div className="absolute -inset-2 bg-emerald-500 rounded-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
              <span className="relative group-hover:text-white transition-colors duration-400 ease-out">Platform</span>
            </a>
            
            <a href="#features" className="relative group font-sans text-black transition-colors px-3 py-2">
              {/* Premium curved background - solid green, no glow */}
              <div className="absolute -inset-2 bg-emerald-500 rounded-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
              <span className="relative group-hover:text-white transition-colors duration-400 ease-out">Features</span>
            </a>
            
            <a href="#pricing" className="relative group font-sans text-black transition-colors px-3 py-2">
              {/* Premium curved background - solid green, no glow */}
              <div className="absolute -inset-2 bg-emerald-500 rounded-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
              <span className="relative group-hover:text-white transition-colors duration-400 ease-out">Pricing</span>
            </a>
            
            <div className="h-6 w-px bg-slate-300"></div>
            
            <a href="#login" className="font-sans text-black hover:text-slate-600 transition-colors">
              Sign In
            </a>
            
            <button className="px-7 py-3 bg-slate-900 text-white rounded-full font-sans font-medium hover:bg-slate-800 transition-all duration-300">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 border-t border-slate-200 bg-white">
            <div className="flex flex-col gap-4">
              <a href="#platform" className="font-sans text-black hover:text-slate-900 transition-colors px-4 py-2">
                Platform
              </a>
              <a href="#features" className="font-sans text-black hover:text-slate-900 transition-colors px-4 py-2">
                Features
              </a>
              <a href="#pricing" className="font-sans text-black hover:text-slate-900 transition-colors px-4 py-2">
                Pricing
              </a>
              <div className="h-px bg-slate-200 my-2"></div>
              <a href="#login" className="font-sans text-black hover:text-slate-900 transition-colors px-4 py-2">
                Sign In
              </a>
              <button className="mx-4 py-3 bg-slate-900 text-white rounded-full font-sans font-medium hover:bg-slate-800 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
