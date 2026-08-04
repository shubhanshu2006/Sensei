'use client';

import { useEffect, useRef, useState } from 'react';

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
      name: 'Starter',
      price: '49',
      description: 'Perfect for small teams getting started',
      features: [
        '10 interviews per month',
        'AI screening',
        'Basic analytics',
        'Email support',
        '7-day free trial',
      ],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '149',
      description: 'For growing teams with advanced needs',
      features: [
        '50 interviews per month',
        'AI screening & voice interviews',
        'Advanced analytics',
        'Priority support',
        'Custom scorecards',
        'Resume insights',
      ],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Tailored solutions for large organizations',
      features: [
        'Unlimited interviews',
        'All features included',
        'Dedicated account manager',
        '24/7 support',
        'Custom integrations',
        'SLA guarantee',
      ],
      highlighted: false,
    },
  ];

  // Determine if a card should be dark based on hover state
  const isDark = (planName: string) => {
    if (hoveredCard === null) {
      // Default state: only Professional is dark
      return planName === 'Professional';
    }
    // When hovering Starter or Enterprise, that card becomes dark and Professional becomes light
    return planName === hoveredCard;
  };

  // Determine if card should show "Most Popular" badge
  const showBadge = (planName: string) => {
    if (hoveredCard === null) {
      return planName === 'Professional';
    }
    return planName === hoveredCard;
  };

  // Determine scale
  const getScale = (planName: string) => {
    if (hoveredCard === null) {
      return planName === 'Professional' ? 'scale-105' : '';
    }
    return planName === hoveredCard ? 'scale-105' : '';
  };

  return (
    <section ref={sectionRef} className="py-32 px-6 sm:px-8 lg:px-12 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        {/* Section header - matching Platform showcase style */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-white rounded-full mb-6 shadow-sm">
            <span className="text-sm font-sans text-slate-700 uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-slate-900 mb-6">
            Simple, transparent pricing
          </h2>
          <p className="font-sans text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose the perfect plan for your hiring needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const dark = isDark(plan.name);
            const scale = getScale(plan.name);

            return (
              <div
                key={index}
                className={`relative rounded-3xl p-8 transition-all duration-500 cursor-pointer ${
                  dark
                    ? 'bg-slate-900 text-white shadow-2xl'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-lg'
                } ${scale} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => {
                  // Only allow hover on Starter and Enterprise
                  if (plan.name !== 'Professional') {
                    setHoveredCard(plan.name);
                  }
                }}
                onMouseLeave={() => {
                  if (plan.name !== 'Professional') {
                    setHoveredCard(null);
                  }
                }}
              >
                {/* Most Popular badge - only on Professional card always */}
                {plan.name === 'Professional' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`font-serif text-3xl mb-2 transition-colors duration-500 ${dark ? 'text-white' : 'text-black'}`}>
                    {plan.name}
                  </h3>
                  <p className={`font-sans text-sm transition-colors duration-500 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    {plan.price === 'Custom' ? (
                      <span className={`font-serif text-5xl transition-colors duration-500 ${dark ? 'text-white' : 'text-black'}`}>
                        Custom
                      </span>
                    ) : (
                      <>
                        <span className={`font-serif text-5xl transition-colors duration-500 ${dark ? 'text-white' : 'text-black'}`}>
                          ${plan.price}
                        </span>
                        <span className={`font-sans text-lg transition-colors duration-500 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                          /month
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg
                        className={`w-6 h-6 flex-shrink-0 transition-colors duration-500 ${
                          dark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
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
                      <span className={`font-sans transition-colors duration-500 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-4 rounded-full font-sans font-semibold transition-all duration-500 ${
                    dark
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-16">
          <p className="font-sans text-slate-600">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
