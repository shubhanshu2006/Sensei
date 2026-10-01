'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function Pricing() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const plans = [
    {
      name: 'Sprint Pack',
      price: '25',
      unit: '5 credits',
      badge: null,
      description: 'Ideal for focused prep and rapid interview readiness',
      features: [
        '5 Full AI Voice Mock Interviews (₹5/session)',
        'Tailored questions for Frontend, Backend & System Design',
        'Instant bar-raiser scorecards & metrics',
        'Strengths & improvement feedback',
        'Instant digital activation • Credits never expire',
      ],
      highlighted: false,
    },
    {
      name: 'Pro Pack',
      price: '45',
      unit: '10 credits',
      badge: 'Most Popular',
      description: 'Our most popular pack for campus and placement preparation',
      features: [
        '10 Full AI Mock Interviews (₹4.5/session)',
        'All technical, sales, behavioral, and HR tracks',
        'Real-time speech analytics & voice telemetry',
        'Comprehensive scorecard analytics & pass rate',
        'Instant digital activation • Credits never expire',
      ],
      highlighted: true,
    },
    {
      name: 'Placement Pack',
      price: '100',
      unit: '25 credits',
      badge: 'Best Value',
      description: 'Best value for comprehensive preparation across all rounds',
      features: [
        '25 Full AI Mock Interviews (₹4/session)',
        'All difficulty levels: Beginner to Expert bar-raiser',
        'Permanent scorecard history & progress tracking',
        'Deep architectural drilldowns & system design',
        'Instant digital activation • Credits never expire',
      ],
      highlighted: false,
    },
  ];

  // Determine if a card should be highlighted based on hover state
  const isHighlighted = (planName: string) => {
    if (hoveredCard === null) {
      return planName === 'Pro Pack';
    }
    return planName === hoveredCard;
  };

  // Determine scale
  const getScale = (planName: string) => {
    if (hoveredCard === null) {
      return planName === 'Pro Pack' ? 'scale-105' : '';
    }
    return planName === hoveredCard ? 'scale-105' : '';
  };

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-xs">
            <span className="text-xs font-sans text-slate-700 uppercase tracking-wider font-semibold">Pricing &amp; Packs</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-bold tracking-tight">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
              practice credits
            </span>
          </h2>
          <p className="font-sans text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Choose the ideal pack for your interview preparation. Every candidate starts with 2 free mock sessions, zero payment details required.
          </p>
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200/80 text-xs font-semibold text-orange-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
              <span>🎁 Every new candidate receives 2 Free Mock Interviews on signup • No credit card required</span>
            </div>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const highlighted = isHighlighted(plan.name);
            const scale = getScale(plan.name);

            return (
              <div
                key={index}
                className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  highlighted
                    ? 'bg-gradient-to-b from-white via-orange-50/30 to-pink-50/20 text-slate-950 shadow-2xl shadow-orange-500/10 border-2 border-orange-500/60'
                    : 'bg-white text-slate-900 border border-slate-200/90 shadow-md hover:shadow-xl hover:border-slate-300'
                } ${scale} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => {
                  if (plan.name !== 'Pro Pack') {
                    setHoveredCard(plan.name);
                  }
                }}
                onMouseLeave={() => {
                  if (plan.name !== 'Pro Pack') {
                    setHoveredCard(null);
                  }
                }}
              >
                <div>
                  {/* Badges */}
                  {plan.badge && (
                    <div
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-semibold rounded-full shadow-md ${
                        plan.name === 'Pro Pack'
                          ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 shadow-orange-500/25'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25'
                      }`}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-serif text-2xl font-bold mb-1.5 text-slate-950">
                      {plan.name}
                    </h3>
                    <p className="font-sans text-xs text-slate-600 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6 pb-5 border-b border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-4xl sm:text-5xl font-bold text-slate-950">
                        ₹{plan.price}
                      </span>
                      <span className="font-sans text-xs font-medium text-slate-500">
                        / {plan.unit}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 flex-shrink-0 text-orange-500 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="font-sans text-xs sm:text-sm text-slate-700 leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/sign-up"
                  className={`block text-center w-full py-3.5 rounded-full font-sans text-sm font-semibold transition-all duration-300 ${
                    highlighted
                      ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02]'
                      : 'bg-slate-950 text-white hover:bg-slate-800 hover:scale-[1.02]'
                  }`}
                >
                  {plan.price === '0' ? 'Start Free Trial' : 'Get Started'}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-16 space-y-2">
          <p className="font-sans text-sm text-slate-700 font-medium">
            All packages are 100% digital goods with instant electronic delivery upon payment. Credits never expire.
          </p>
          <p className="font-sans text-xs text-slate-500">
            Single sessions starting at ₹4 • All prices in Indian Rupees (INR) • Taxes included
          </p>
        </div>
      </div>
    </section>
  );
}
