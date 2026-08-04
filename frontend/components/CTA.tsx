'use client';

import { useEffect, useRef, useState } from 'react';

export default function CTA() {
  const [isVisible, setIsVisible] = useState(false);
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
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <div 
          className={`relative p-12 sm:p-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 overflow-hidden transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>

          <div className="relative z-10 text-center">
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              Ready to transform
              <br />
              your hiring process?
            </h2>
            <p className="font-sans text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join forward-thinking companies using AI to hire smarter, 
              faster, and with greater accuracy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-sans font-medium text-lg overflow-hidden hover-lift">
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-slate-100 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              </button>
              <button className="px-8 py-4 bg-transparent text-white rounded-full font-sans font-medium text-lg border-2 border-slate-700 hover:border-white transition-all duration-300 hover-lift">
                Schedule Demo
              </button>
            </div>

            <p className="font-sans text-sm text-slate-400 mt-8">
              No credit card required · Free trial available
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
