'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Create or Apply',
    description: 'Recruiters post jobs, candidates apply or practice from the curated library.',
  },
  {
    number: '02',
    title: 'AI Screening',
    description: 'Resume, GitHub, and portfolio are analyzed to match candidates with role requirements.',
  },
  {
    number: '03',
    title: 'Voice Interview',
    description: 'AI conducts adaptive voice interviews with contextual follow-up questions.',
  },
  {
    number: '04',
    title: 'Smart Evaluation',
    description: 'Receive structured scorecards with technical, behavioral, and communication insights.',
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
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
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="font-serif text-5xl sm:text-6xl text-white mb-6">
            How it works
          </h2>
          <p className="font-sans text-xl text-slate-400 max-w-2xl mx-auto">
            A streamlined hiring process from application to evaluation, 
            powered by intelligent automation.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setActiveStep(index)}
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-slate-800">
                  <div 
                    className="h-full bg-slate-600 transition-all duration-1000"
                    style={{ 
                      width: activeStep > index ? '100%' : '0%',
                    }}
                  ></div>
                </div>
              )}

              {/* Step card */}
              <div className={`relative p-8 rounded-2xl border-2 transition-all duration-500 ${
                activeStep === index 
                  ? 'bg-slate-800 border-slate-700 scale-105' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}>
                <div className={`text-6xl font-serif mb-4 transition-colors duration-500 ${
                  activeStep === index ? 'text-white' : 'text-slate-700'
                }`}>
                  {step.number}
                </div>
                <h3 className="font-serif text-2xl text-white mb-3">
                  {step.title}
                </h3>
                <p className="font-sans text-slate-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Active indicator */}
                {activeStep === index && (
                  <div className="absolute -bottom-2 left-8 right-8 h-1 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-3 mt-12 lg:hidden">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeStep === index ? 'bg-white w-8' : 'bg-slate-700'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
