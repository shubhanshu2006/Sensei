'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {/* Fallback gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
        
        
        { <Image
          src="/hero-bg.jpeg"
          alt="Hero background"
          fill
          className="object-cover"
          priority
          quality={100}
        /> }
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="text-center">
          {/* Badge */}
          <div 
            className={`inline-flex items-center px-4 py-2 mt-6 mb-6 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="relative flex h-2 w-2 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-md font-sans text-black/90">Powered by Advanced AI</span>
          </div>

          {/* Main heading */}
          <h1 
            className={`font-serif text-6xl sm:text-7xl lg:text-8xl font-bold text-black mb-4 leading-[1.1] transition-all duration-1000 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            The future of
            <br />
            <span className="bg-linear-to-r from-green-700 via-green-500 to-green-700 bg-clip-text text-transparent">
              intelligent hiring
            </span>
          </h1>

          {/* Subheading */}
          <p 
            className={`font-sans text-xl sm:text-2xl text-black font-medium mb-8 leading-relaxed max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            AI-powered screening, adaptive voice interviews, and data-driven insights. 
            Transform how you hire and prepare for interviews.
          </p>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <button className="group relative px-8 py-4 bg-slate-900 text-white rounded-full font-sans font-semibold text-lg overflow-hidden hover-lift shadow-2xl">
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button className="group px-8 py-4 bg-white backdrop-blur-sm text-slate-900 rounded-full font-sans font-semibold text-lg border-2 border-slate-300 hover:bg-slate-50 transition-all duration-300 hover-lift shadow-lg">
              <span className="flex items-center gap-2">
                Watch Demo
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </span>
            </button>
          </div>

          {/* Stats */}
          <div 
            className={`grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto transition-all duration-1000 delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl font-serif font-bold text-black mb-2">98%</div>
              <div className="text-sm font-sans font-medium text-black uppercase tracking-wider">Screening Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-serif font-bold text-black mb-2">10x</div>
              <div className="text-sm font-sans font-medium text-black uppercase tracking-wider">Faster Hiring</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-serif font-bold text-black mb-2">24/7</div>
              <div className="text-sm font-sans font-medium text-black uppercase tracking-wider">Interview Availability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
