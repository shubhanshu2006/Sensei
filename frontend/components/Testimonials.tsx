'use client';

import { useEffect, useRef, useState } from 'react';
import { Quote, Sparkles, CheckCircle2, Star } from 'lucide-react';

const testimonials = [
  {
    quote:
      "I practiced 14 system design mock rounds on Sensei before my final on-site loop at Amazon. The AI challenged my cache invalidation strategy and sharding schemes with the exact same rigor as the real Bar-Raiser. Landed an SDE-2 offer!",
    author: "Aditya Verma",
    role: "Software Development Engineer II",
    company: "Amazon",
    avatar: "AV",
    verified: "SDE-2 Offer Accepted",
    accent: "from-orange-500 to-rose-500",
  },
  {
    quote:
      "The voice interviewer is astonishingly natural. It immediately called me out when my answer on React Fiber reconciliation was vague, forcing me to walk through the actual render and commit phases. That feedback alone transformed how I communicate.",
    author: "Rohan Mehta",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    avatar: "RM",
    verified: "Senior FE Offer",
    accent: "from-pink-500 to-rose-500",
  },
  {
    quote:
      "As a tier-3 college graduate, campus placement prep was daunting. I couldn't afford expensive ₹10,000 interview coaches. With Sensei's ₹5 practice credits, I did mock rounds daily for three weeks and cracked Google's campus hiring!",
    author: "Sneha Kulkarni",
    role: "Software Engineer",
    company: "Google",
    avatar: "SK",
    verified: "Campus Placement Winner",
    accent: "from-orange-500 to-pink-500",
  },
  {
    quote:
      "The instant scorecard with strengths and red flags is gold. It pointed out that while my algorithmic implementation was O(N), I failed to check null boundaries and integer overflow. Fixed those habits before my Meta rounds.",
    author: "Kavya Patel",
    role: "Infrastructure Engineer",
    company: "Meta",
    avatar: "KP",
    verified: "E4 Infrastructure Engineer",
    accent: "from-pink-500 to-rose-500",
  },
  {
    quote:
      "The Enterprise Sales & Discovery track gives realistic procurement pushback and MEDDPICC qualification scenarios. It prepared me for executive-level objections better than any mentor roleplay.",
    author: "Aman Sharma",
    role: "Enterprise Account Executive",
    company: "Microsoft",
    avatar: "AS",
    verified: "Enterprise AE Accepted",
    accent: "from-orange-500 to-pink-500",
  },
  {
    quote:
      "Sensei's STAR behavioral feedback highlighted exactly where my answers were drifting into story-telling instead of articulating measurable outcomes. Secured an L6 Engineering Lead role.",
    author: "Priya Nair",
    role: "Engineering Lead",
    company: "Atlassian",
    avatar: "PN",
    verified: "Engineering Lead Offer",
    accent: "from-pink-500 to-rose-500",
  },
];

export default function Testimonials() {
  const [isVisible, setIsVisible] = useState(false);
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

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden"
    >
      {/* Ambient background glows in Orange & Pink */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-orange-400/10 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-sans font-semibold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Candidate Success Stories
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-slate-900 font-bold tracking-tight">
            Engineers who conquered{' '}
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
              their dream job offers
            </span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Real feedback from software engineers, sales professionals, and leaders who transformed their technique using Sensei.
          </p>
        </div>
      </div>

      {/* Constantly Moving Horizontal Testimonials Marquee */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Left & Right gradient edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-10" />

        {/* Marquee Track */}
        <div className="animate-marquee-smooth flex gap-6 px-4">
          {[...testimonials, ...testimonials].map((item, index) => (
            <div
              key={index}
              className="w-[340px] sm:w-[400px] shrink-0 rounded-3xl bg-white text-slate-900 border border-slate-200/90 p-6 sm:p-7 shadow-lg shadow-slate-200/50 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Subtle card glow on hover */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 space-y-4">
                {/* Header: Stars & verified badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1.5 text-[11px] font-mono font-semibold text-slate-600">5.0</span>
                  </div>

                  <div className="h-7 w-7 rounded-lg bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600">
                    <Quote className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Quote Text */}
                <p className="font-serif text-sm sm:text-base text-slate-700 leading-snug line-clamp-5">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-tr ${item.accent} flex items-center justify-center text-white font-serif font-bold text-sm shrink-0 shadow-md shadow-orange-500/20`}
                  >
                    {item.avatar}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-serif text-sm font-bold text-slate-950 truncate">
                      {item.author}
                    </h4>
                    <p className="font-sans text-[11px] text-slate-500 truncate">
                      {item.role} • <span className="text-orange-600 font-semibold">{item.company}</span>
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-mono font-semibold shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-pink-600" />
                  {item.verified}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtle indicator bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 text-center">
        <p className="text-xs font-mono text-slate-500 inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
          <span>Verified candidate feedback from Amazon, Google, Stripe, Meta, and Microsoft</span>
          <span>•</span>
          <span className="text-slate-400">Hover card to pause</span>
        </p>
      </div>
    </section>
  );
}
