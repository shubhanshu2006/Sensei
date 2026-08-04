'use client';

import { useEffect, useRef, useState } from 'react';

export default function BentoGrid() {
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
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-white rounded-full mb-6 shadow-sm">
            <span className="text-sm font-sans text-slate-700 uppercase tracking-wider">Platform Showcase</span>
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-slate-900 mb-6">
            See Sensei in action
          </h2>
          <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Every feature designed to make hiring and interview preparation seamless and intelligent.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
          {/* Card 1: AI Screening Visualization */}
          <div className={`bg-gradient-to-br from-violet-100 to-purple-50 rounded-3xl p-8 lg:col-span-1 hover-lift transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Floating particles background */}
            <div className="absolute inset-0 overflow-hidden">
              {mounted && [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-violet-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${4 + Math.random() * 4}s ease-in-out ${i * 0.5}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            <div className="mb-8 relative">
              {/* Animated candidate silhouette made of dots */}
              <div className="relative w-32 h-40 mx-auto">
                {/* Scanning line effect */}
                <div 
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-pulse z-10"
                  style={{
                    top: '0%',
                    animation: 'scan 3s ease-in-out infinite',
                  }}
                ></div>
                
                {/* Head */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16">
                  {[...Array(8)].map((_, row) => (
                    <div key={row} className="flex justify-center gap-1 mb-1">
                      {[...Array(8)].map((_, col) => {
                        const distance = Math.sqrt(Math.pow(row - 4, 2) + Math.pow(col - 4, 2));
                        if (distance < 4) {
                          return (
                            <div
                              key={col}
                              className="w-1.5 h-1.5 bg-violet-500 rounded-sm hover-scale"
                              style={{
                                animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) ${(row + col) * 0.1}s infinite`,
                              }}
                            />
                          );
                        }
                        return <div key={col} className="w-1.5 h-1.5" />;
                      })}
                    </div>
                  ))}
                </div>
                {/* Body */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-20 h-24">
                  {[...Array(12)].map((_, row) => (
                    <div key={row} className="flex justify-center gap-1 mb-1">
                      {[...Array(10)].map((_, col) => {
                        const shouldShow = (row < 8 && col > 2 && col < 7) || (row >= 8 && (col < 4 || col > 5));
                        if (shouldShow) {
                          return (
                            <div
                              key={col}
                              className="w-1.5 h-1.5 bg-violet-500 rounded-sm hover-scale"
                              style={{
                                animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) ${(row + col) * 0.1}s infinite`,
                              }}
                            />
                          );
                        }
                        return <div key={col} className="w-1.5 h-1.5" />;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <h3 className="font-serif text-3xl text-violet-900 mb-3 relative">
              AI Screening
            </h3>
            <p className="font-sans text-slate-700 leading-relaxed relative">
              Intelligent candidate analysis with resume, GitHub, and portfolio insights in seconds.
            </p>
          </div>

          <style jsx>{`
            @keyframes scan {
              0%, 100% { top: 0%; }
              50% { top: 100%; }
            }
          `}</style>

          {/* Card 2: Timer/Interview Session */}
          <div className={`bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-8 lg:col-span-2 hover-lift transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '100ms' }}>
            {/* Animated wave background */}
            <div className="absolute inset-0 opacity-20">
              <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M0,50 C300,100 900,0 1200,50 L1200,120 L0,120 Z" fill="url(#waveGradient)" className="animate-float">
                  <animate attributeName="d" dur="5s" repeatCount="indefinite"
                    values="M0,50 C300,100 900,0 1200,50 L1200,120 L0,120 Z;
                            M0,80 C300,20 900,100 1200,80 L1200,120 L0,120 Z;
                            M0,50 C300,100 900,0 1200,50 L1200,120 L0,120 Z" />
                </path>
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="relative">
              <h3 className="font-serif text-3xl text-cyan-900 mb-2">
                Live Interview Sessions
              </h3>
              <p className="font-sans text-slate-700 mb-8">
                Adaptive AI interviews that feel natural and conversational.
              </p>
              
              {/* Animated Timer Display */}
              <div className="flex gap-4 justify-center items-center mb-6">
                {/* Minutes */}
                <div className="bg-white rounded-2xl p-6 shadow-lg min-w-[100px] hover-scale group relative overflow-hidden">
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  <div className="text-xs text-slate-500 mb-2 text-center uppercase tracking-wider relative">Minutes</div>
                  <div className="text-5xl font-serif text-slate-900 text-center relative">15</div>
                </div>
                
                <div className="text-3xl text-slate-400 font-bold animate-pulse">:</div>
                
                {/* Seconds */}
                <div className="bg-white rounded-2xl p-6 shadow-lg min-w-[100px] hover-scale group relative overflow-hidden">
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  <div className="text-xs text-slate-500 mb-2 text-center uppercase tracking-wider relative">Seconds</div>
                  <div className="text-5xl font-serif text-slate-900 text-center relative">
                    <span className="inline-block animate-pulse">32</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button className="px-6 py-2.5 bg-cyan-600 text-white rounded-full font-sans font-medium hover:bg-cyan-700 transition-all hover-lift shadow-lg">
                  Active
                </button>
                <div className="px-6 py-2.5 bg-white text-slate-700 rounded-full font-sans text-sm flex items-center gap-2 shadow-sm">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="absolute w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  Recording
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Performance Metrics */}
          <div className={`bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 lg:col-span-2 hover-lift transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '200ms' }}>
            <h3 className="font-serif text-3xl text-amber-900 mb-2">
              Performance Insights
            </h3>
            <p className="font-sans text-slate-700 mb-8">
              Real-time analytics on interview performance and candidate quality metrics.
            </p>

            {/* Animated Bar Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Animated vertical bars */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="text-sm font-sans text-slate-600 mb-4">This Week</div>
                <div className="flex items-end justify-between gap-3 h-40">
                  {[
                    { height: 65, label: 'Mon', delay: 0 },
                    { height: 80, label: 'Tue', delay: 100 },
                    { height: 55, label: 'Wed', delay: 200 },
                    { height: 90, label: 'Thu', delay: 300 },
                    { height: 75, label: 'Fri', delay: 400 },
                  ].map((bar, i) => (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className="w-full bg-amber-100 rounded-lg overflow-hidden mb-2 relative">
                        <div
                          className="bg-gradient-to-t from-amber-600 to-amber-400 rounded-lg transition-all duration-1000 ease-out"
                          style={{
                            height: isVisible ? `${bar.height * 1.6}px` : '0px',
                            transitionDelay: `${bar.delay + 200}ms`,
                          }}
                        >
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats cards */}
              <div className="space-y-4">
                {[
                  { label: 'Avg. Score', value: '87', trend: '+12%', color: 'emerald', icon: '📈' },
                  { label: 'Completion', value: '94%', trend: '+5%', color: 'blue', icon: '✓' },
                  { label: 'Pass Rate', value: '76%', trend: '+8%', color: 'violet', icon: '🎯' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl p-4 shadow-lg hover-scale transition-all duration-700 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                    }`}
                    style={{ transitionDelay: `${i * 100 + 400}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-${stat.color}-100 rounded-xl flex items-center justify-center text-lg`}>
                          {stat.icon}
                        </div>
                        <div>
                          <div className="text-xs text-slate-600 font-sans">{stat.label}</div>
                          <div className="text-2xl font-serif text-slate-900">{stat.value}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold text-${stat.color}-600`}>
                        {stat.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Activity Feed */}
          <div className={`bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 lg:col-span-1 hover-lift transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '300ms' }}>
            <h3 className="font-serif text-3xl text-emerald-900 mb-2">
              Live Activity
            </h3>
            <p className="font-sans text-slate-700 mb-6">
              Real-time updates on interviews and screening results.
            </p>

            <div className="space-y-4">
              {[
                { icon: '✓', color: 'bg-emerald-500', text: 'Interview completed', time: '2m ago', bg: 'bg-emerald-100' },
                { icon: '⚡', color: 'bg-amber-500', text: 'AI screening done', time: '15m ago', bg: 'bg-amber-100' },
                { icon: '🎯', color: 'bg-violet-500', text: 'New candidate', time: '1h ago', bg: 'bg-violet-100' },
                { icon: '📊', color: 'bg-blue-500', text: 'Report ready', time: '2h ago', bg: 'bg-blue-100' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 ${item.bg} rounded-xl hover-scale transition-all`}
                >
                  <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-sm text-slate-900 font-medium truncate">{item.text}</div>
                    <div className="font-sans text-xs text-slate-600">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Global Community/Network */}
          <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 lg:col-span-2 hover-lift transition-all duration-700 overflow-hidden relative ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '400ms' }}>
            {/* Orbiting particles */}
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-40"
                  style={{
                    left: '50%',
                    top: '50%',
                    animation: `orbit ${8 + i * 2}s linear ${i * 0.5}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            <div className="relative">
              <h3 className="font-serif text-3xl text-blue-900 mb-2">
                Global Platform
              </h3>
              <p className="font-sans text-slate-700 mb-8">
                Connect with recruiters and candidates worldwide in real-time.
              </p>

              {/* Animated Globe Visualization */}
              <div className="relative w-64 h-64 mx-auto">
                {/* Rotating Globe wireframes */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-rotate" style={{ animationDuration: '20s' }}></div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-rotate" style={{ transform: 'rotateY(60deg)', animationDuration: '25s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-rotate" style={{ transform: 'rotateY(-60deg)', animationDuration: '30s' }}></div>
                
                {/* Center pulsing sphere */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 animate-pulse-slow"></div>
                  <div className="absolute w-40 h-40 rounded-full border-2 border-blue-300 animate-ping" style={{ animationDuration: '3s' }}></div>
                </div>

                {/* Animated dots representing users with enhanced effects */}
                {[
                  { top: '20%', left: '30%', delay: '0s', size: 'w-3 h-3' },
                  { top: '40%', left: '70%', delay: '0.5s', size: 'w-4 h-4' },
                  { top: '60%', left: '20%', delay: '1s', size: 'w-3 h-3' },
                  { top: '70%', left: '60%', delay: '1.5s', size: 'w-3.5 h-3.5' },
                  { top: '30%', left: '80%', delay: '2s', size: 'w-3 h-3' },
                  { top: '50%', left: '40%', delay: '2.5s', size: 'w-4 h-4' },
                ].map((dot, i) => (
                  <div
                    key={i}
                    className={`absolute ${dot.size} bg-blue-500 rounded-full hover-scale cursor-pointer z-10`}
                    style={{
                      top: dot.top,
                      left: dot.left,
                      animation: `pulse 1s cubic-bezier(0.4, 0, 0.6, 1) ${dot.delay} infinite`,
                    }}
                  >
                    {/* Multiple ripple effects */}
                    <div className="absolute inset-0 bg-blue-400 rounded-full" style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                    <div className="absolute inset-0 bg-blue-300 rounded-full" style={{ animation: 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) 0.3s infinite' }}></div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm animate-pulse"></div>
                  </div>
                ))}

                {/* Enhanced connection lines with animation */}
                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.2" />
                      <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.8">
                        <animate attributeName="stopOpacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                      </stop>
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                  <line x1="30%" y1="20%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                  <line x1="70%" y1="40%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 0.5s infinite' }} />
                  <line x1="20%" y1="60%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 1s infinite' }} />
                  <line x1="80%" y1="30%" x2="50%" y2="50%" stroke="url(#lineGradient)" strokeWidth="2" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 1.5s infinite' }} />
                </svg>
              </div>

              {/* Stats with animation */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  { value: '50K+', label: 'Interviews', delay: '500ms' },
                  { value: '120+', label: 'Countries', delay: '600ms' },
                  { value: '98%', label: 'Satisfaction', delay: '700ms' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`text-center transition-all duration-700 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                    }`}
                    style={{ transitionDelay: stat.delay }}
                  >
                    <div className="text-2xl font-serif text-blue-900 mb-1">{stat.value}</div>
                    <div className="text-xs text-slate-600 uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes orbit {
              0% {
                transform: translate(-50%, -50%) rotate(0deg) translateX(120px) rotate(0deg);
              }
              100% {
                transform: translate(-50%, -50%) rotate(360deg) translateX(120px) rotate(-360deg);
              }
            }
          `}</style>

          {/* Card 6: Smart Scorecard */}
          <div className={`bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-8 lg:col-span-1 hover-lift transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '500ms' }}>
            <h3 className="font-serif text-3xl text-pink-900 mb-2">
              Smart Scoring
            </h3>
            <p className="font-sans text-slate-700 mb-6">
              AI-powered evaluation with detailed performance insights.
            </p>

            {/* Circular progress */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#fecdd3"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - 0.87)}`}
                  className="transition-all duration-1000"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-4xl font-serif text-pink-900">87</div>
                <div className="text-sm text-slate-600">Overall</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Technical', value: 92 },
                { label: 'Communication', value: 85 },
                { label: 'Problem Solving', value: 88 },
              ].map((skill, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700 font-sans">{skill.label}</span>
                    <span className="text-slate-900 font-semibold">{skill.value}%</span>
                  </div>
                  <div className="w-full bg-pink-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: isVisible ? `${skill.value}%` : '0%',
                        transitionDelay: `${i * 200 + 500}ms`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
