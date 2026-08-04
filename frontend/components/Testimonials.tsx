'use client';

import { useEffect, useRef, useState } from 'react';

const testimonials = [
  {
    quote: "Sensei cut our screening time by 80%. The AI picks up on details we used to miss manually.",
    author: "Sarah Chen",
    role: "Head of Engineering",
    company: "TechCorp",
    avatar: "SC",
    color: "from-blue-500 to-cyan-500",
  },
  {
    quote: "The practice library helped me identify gaps in my resume I didn't even know existed. Landed my dream job.",
    author: "Michael Torres",
    role: "Software Engineer",
    company: "Startup Inc",
    avatar: "MT",
    color: "from-violet-500 to-purple-500",
  },
  {
    quote: "Finally, interviews that adapt to the candidate. No more one-size-fits-all questionnaires.",
    author: "Priya Sharma",
    role: "Talent Acquisition Lead",
    company: "Global Solutions",
    avatar: "PS",
    color: "from-emerald-500 to-green-500",
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header - matching Platform showcase style */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-slate-100 rounded-full mb-6 shadow-sm">
            <span className="text-sm font-sans text-slate-700 uppercase tracking-wider">Testimonials</span>
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-slate-900 mb-6">
            Trusted by teams
          </h2>
          <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join thousands of companies and candidates who've transformed their hiring and interview experience.
          </p>
        </div>

        {/* Testimonial carousel with premium card */}
        <div className="relative min-h-[400px] mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ${
                index === currentIndex
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8 pointer-events-none'
              }`}
            >
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-12 md:p-16 border border-slate-200 shadow-xl">
                {/* Quote icon */}
                <div className="flex justify-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonial.color} flex items-center justify-center shadow-lg`}>
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="font-serif text-2xl md:text-3xl text-slate-900 text-center mb-8 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author info with avatar */}
                <div className="flex items-center justify-center gap-4">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {testimonial.avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-sans text-lg font-semibold text-slate-900">
                      {testimonial.author}
                    </div>
                    <div className="font-sans text-sm text-slate-600">
                      {testimonial.role} · {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation dots - enhanced */}
        <div className="flex justify-center gap-3">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index 
                  ? 'bg-slate-900 w-12' 
                  : 'bg-slate-300 w-2 hover:bg-slate-400'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
