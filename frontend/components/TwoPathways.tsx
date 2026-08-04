'use client';

import { useEffect, useRef, useState } from 'react';

export default function TwoPathways() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-slate-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) 1s infinite' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header - matching Platform showcase style */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-white rounded-full mb-6 shadow-sm border border-slate-200">
            <span className="text-sm font-sans text-slate-700 uppercase tracking-wider">Two Pathways</span>
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-slate-900 mb-6">
            Two pathways, one platform
          </h2>
          <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Whether you're hiring talent or preparing for your next role, 
            Sensei adapts to your needs.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Recruiters Card */}
          <div
            className={`group relative p-10 bg-white rounded-3xl border border-slate-200 transition-all duration-700 hover:shadow-2xl hover:scale-105 overflow-hidden ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            onMouseEnter={() => setHoveredCard('recruiters')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Animated corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

            <div className="relative">
              {/* Icon with animated ring */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="absolute inset-0 border-2 border-blue-300 rounded-2xl animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <h3 className="font-serif text-4xl text-slate-900 mb-4">
                For Recruiters
              </h3>
              <p className="font-sans text-lg text-slate-600 mb-8 leading-relaxed">
                Automate candidate screening, conduct intelligent interviews, 
                and make data-driven hiring decisions with AI-powered insights.
              </p>

              {/* Features list with animated checkmarks */}
              <ul className="space-y-4 mb-8">
                {[
                  'Post jobs with custom screening',
                  'AI-powered resume analysis',
                  'Voice interview automation',
                  'Structured evaluation reports',
                  'Candidate ranking & insights',
                ].map((feature, index) => (
                  <li 
                    key={index}
                    className={`flex items-start gap-3 font-sans text-slate-700 transition-all duration-300 ${
                      hoveredCard === 'recruiters' ? 'translate-x-2' : ''
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="relative">
                      <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    </div>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full py-4 bg-slate-900 text-white rounded-full font-sans font-medium text-lg hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105">
                Start Hiring →
              </button>
            </div>
          </div>

          {/* Candidates Card */}
          <div
            className={`group relative p-10 bg-slate-900 rounded-3xl border border-slate-800 transition-all duration-700 hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-105 overflow-hidden ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '200ms' }}
            onMouseEnter={() => setHoveredCard('candidates')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Animated corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500"></div>

            <div className="relative">
              {/* Icon with animated ring */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-emerald-900/50 rounded-2xl animate-pulse opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-2xl animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-slate-900 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xl">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              <h3 className="font-serif text-4xl text-white mb-4">
                For Candidates
              </h3>
              <p className="font-sans text-lg text-slate-300 mb-8 leading-relaxed">
                Practice with real interview scenarios, get personalized feedback, 
                and prepare for your dream role with AI-powered coaching.
              </p>

              {/* Features list with animated checkmarks */}
              <ul className="space-y-4 mb-8">
                {[
                  'Apply for real opportunities',
                  'Practice with curated scenarios',
                  'Voice interview experience',
                  'Private performance reports',
                  'Resume improvement tips',
                ].map((feature, index) => (
                  <li 
                    key={index}
                    className={`flex items-start gap-3 font-sans text-slate-200 transition-all duration-300 ${
                      hoveredCard === 'candidates' ? 'translate-x-2' : ''
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="relative">
                      <svg className="w-6 h-6 text-emerald-400 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute inset-0 bg-emerald-400 rounded-full blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    </div>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full py-4 bg-white text-slate-900 rounded-full font-sans font-medium text-lg hover:bg-slate-100 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105">
                Start Practicing →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom stats - premium addition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          {[
            { number: '50K+', label: 'Interviews Conducted', delay: '400ms' },
            { number: '95%', label: 'Success Rate', delay: '500ms' },
            { number: '24/7', label: 'Platform Availability', delay: '600ms' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: stat.delay }}
            >
              <div className="text-4xl font-serif text-slate-900 mb-2">{stat.number}</div>
              <div className="text-sm text-slate-600 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
