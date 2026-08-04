'use client';

import { useEffect, useRef, useState } from 'react';

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section header - matching Platform showcase style */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-slate-100 rounded-full mb-6 shadow-sm">
            <span className="text-sm font-sans text-slate-700 uppercase tracking-wider">Features</span>
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-slate-900 mb-6">
            Everything you need
          </h2>
          <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From intelligent screening to adaptive interviews, 
            Sensei handles the entire hiring workflow.
          </p>
        </div>

        {/* Premium Bento Grid - asymmetric layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          
          {/* Card 1: AI Screening - Large card, spans 2 columns */}
          <div className={`group bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-10 lg:col-span-2 border border-violet-100 hover:shadow-2xl transition-all duration-700 overflow-hidden ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Floating particles background - constant animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {mounted && [...Array(6)].map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = i * 0.8;
                const duration = 5 + Math.random() * 3;
                
                return (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-violet-400/20 rounded-full"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      animation: `${delay}s ease-in-out ${duration}s infinite float`,
                    }}
                  ></div>
                );
              })}
            </div>

            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-100/0 via-purple-100/50 to-violet-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex flex-col h-full relative">
              {/* Icon with animated background */}
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-violet-200 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              
              <h3 className="font-serif text-4xl text-black mb-4">
                AI Screening
              </h3>
              
              <p className="font-sans text-lg text-slate-700 leading-relaxed mb-8">
                Automatically analyze resumes, GitHub profiles, and portfolios to identify the best candidates.
              </p>

              {/* Visual element - animated scanning bars with hover effect */}
              <div className="mt-auto space-y-2">
                {[60, 85, 70].map((width, i) => (
                  <div key={i} className="flex items-center gap-3 group/bar">
                    <div className="flex-1 h-2 bg-violet-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000 group-hover/bar:from-violet-600 group-hover/bar:to-purple-600"
                        style={{ 
                          width: isVisible ? `${width}%` : '0%',
                          transitionDelay: `${i * 150}ms`
                        }}
                      >
                        {/* Shimmer effect */}
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-violet-700 w-12 group-hover/bar:scale-110 transition-transform">{width}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Voice Interviews - Tall card */}
          <div className={`group bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-10 border border-cyan-100 hover:shadow-2xl transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '100ms' }}>
            {/* Floating particles background - constant animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {mounted && [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-cyan-400/20 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${6 + Math.random() * 2}s ease-in-out ${i * 0.7}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/0 via-blue-100/50 to-cyan-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex flex-col h-full relative">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-cyan-200 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>

              <h3 className="font-serif text-4xl text-black mb-4">
                Voice Interviews
              </h3>

              <p className="font-sans text-lg text-slate-700 leading-relaxed mb-8">
                Conduct natural, conversational interviews with AI that adapts to each candidate in real-time.
              </p>

              {/* Audio wave visualization with enhanced animation */}
              <div className="mt-auto flex items-end justify-between h-20 gap-1">
                {[40, 70, 55, 85, 60, 75, 50, 90, 65].map((height, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full transition-all duration-500 group-hover:from-cyan-600 group-hover:to-blue-600 hover:scale-110"
                    style={{ 
                      height: isVisible ? `${height}%` : '0%',
                      transitionDelay: `${i * 50 + 100}ms`,
                      animation: isVisible ? `wave 1.5s ease-in-out ${i * 0.1}s infinite` : 'none',
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes wave {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>

          {/* Card 3: Adaptive Questions - Small card */}
          <div className={`group bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-10 border border-emerald-100 hover:shadow-2xl transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            {/* Pulsing glow - constant animation */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-emerald-400/10 rounded-full animate-pulse"></div>
            
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/0 via-green-100/50 to-emerald-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-emerald-200 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <h3 className="font-serif text-3xl text-black mb-4">
              Adaptive Questions
            </h3>

            <p className="font-sans text-[15px] text-slate-700 leading-relaxed">
              Dynamic follow-up questions that probe deeper based on candidate responses and context.
            </p>
          </div>

          {/* Card 4: Smart Scorecards - Medium card, spans 2 columns */}
          <div className={`group bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-10 lg:col-span-2 border border-amber-100 hover:shadow-2xl transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '300ms' }}>
            {/* Floating particles background - constant animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {mounted && [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-amber-400/15 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${7 + Math.random() * 2}s ease-in-out ${i * 1}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/0 via-orange-100/50 to-amber-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex flex-col md:flex-row gap-8 items-start relative">
              <div className="flex-1">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 bg-amber-200 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>

                <h3 className="font-serif text-4xl text-black mb-4">
                  Smart Scorecards
                </h3>

                <p className="font-sans text-lg text-slate-700 leading-relaxed">
                  Structured evaluation reports with insights on technical skills, communication, and problem-solving.
                </p>
              </div>

              {/* Score visualization */}
              <div className="flex flex-col gap-4 min-w-[200px]">
                {[
                  { label: 'Technical', score: 92, color: 'from-amber-500 to-orange-500' },
                  { label: 'Communication', score: 87, color: 'from-amber-500 to-orange-500' },
                  { label: 'Problem Solving', score: 95, color: 'from-amber-500 to-orange-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-sans text-slate-700">{item.label}</span>
                      <span className="text-lg font-serif text-black font-semibold">{item.score}</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                        style={{ 
                          width: isVisible ? `${item.score}%` : '0%',
                          transitionDelay: `${i * 150 + 300}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Resume Insights - Small card */}
          <div className={`group bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-10 border border-pink-100 hover:shadow-2xl transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '400ms' }}>
            {/* Pulsing rings - constant animation */}
            <div className="absolute -top-10 -right-10 w-32 h-32 border border-pink-200/30 rounded-full" style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 border border-pink-200/20 rounded-full" style={{ animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) 1s infinite' }}></div>
            
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100/0 via-rose-100/50 to-pink-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-pink-200 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <h3 className="font-serif text-3xl text-black mb-4">
              Resume Insights
            </h3>

            <p className="font-sans text-[15px] text-slate-700 leading-relaxed">
              Private, personalized feedback to help candidates improve their resumes and interview skills.
            </p>
          </div>

          {/* Card 6: Practice Library - Medium card */}
          <div className={`group bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-10 lg:col-span-2 border border-indigo-100 hover:shadow-2xl transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '500ms' }}>
            {/* Floating particles background - constant animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {mounted && [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-indigo-400/20 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${6 + Math.random() * 3}s ease-in-out ${i * 0.9}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/0 via-blue-100/50 to-indigo-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-indigo-200 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="relative w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            <h3 className="font-serif text-4xl text-black mb-4">
              Practice Library
            </h3>

            <p className="font-sans text-lg text-slate-700 leading-relaxed mb-8">
              Curated interview scenarios for candidates to practice and prepare for real opportunities.
            </p>

            {/* Library items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['JavaScript', 'React', 'Python', 'System Design'].map((topic, i) => (
                <div 
                  key={i}
                  className={`px-4 py-3 bg-white rounded-xl text-center text-sm font-sans text-slate-700 border border-indigo-200 hover:border-indigo-400 transition-all duration-300 ${
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`}
                  style={{ transitionDelay: `${i * 100 + 500}ms` }}
                >
                  {topic}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
