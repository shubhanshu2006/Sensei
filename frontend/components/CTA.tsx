'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Layers,
  CheckCircle2,
} from 'lucide-react';

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
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-200/60 relative overflow-hidden"
    >
      {/* Radiant ambient glow in Orange & Pink */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-orange-500/10 via-pink-500/10 to-rose-500/5 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div
          className={`relative p-8 sm:p-12 md:p-16 bg-gradient-to-br from-white via-orange-50/30 to-pink-50/20 backdrop-blur-2xl rounded-[32px] border border-slate-200/90 shadow-2xl shadow-slate-200/50 overflow-hidden transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Top highlight border line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 via-pink-500/60 to-transparent" />

          {/* Corner ambient glows */}
          <div className="absolute -top-28 -left-28 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 -right-28 w-80 h-80 bg-gradient-to-tl from-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-mono font-semibold text-orange-700 shadow-xs mb-6">
              <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
              <span>Instant Bar-Raiser Calibration • 2 Free AI Credits</span>
            </div>

            {/* Headline */}
            <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-slate-950 font-bold tracking-tight mb-5 leading-[1.15]">
              Ready to ace your next{' '}
              <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                technical interview?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="font-sans text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
              Join engineers and candidates using Sensei AI to practice real-time voice mock interviews with adaptive questions and instant bar-raiser feedback.
            </p>

            {/* 3 Floating Tech Value Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-10 font-sans">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 text-left">
                <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">120ms Voice STT</p>
                  <p className="text-[11px] text-slate-500">Groq Whisper Engine</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 text-left">
                <div className="h-9 w-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Zero Hallucinations</p>
                  <p className="text-[11px] text-slate-500">Resume &amp; JD Calibrated</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 text-left">
                <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">4 Practice Tracks</p>
                  <p className="text-[11px] text-slate-500">Tech, Sales, HR &amp; Speech</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-sans font-semibold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Practice (2 Credits)
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              </Link>

              <Link
                href="/candidate/practice"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-sans font-medium text-slate-800 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 shadow-xs transition-all duration-300 hover:scale-[1.02] w-full sm:w-auto"
              >
                Explore Practice Tracks
              </Link>
            </div>

            {/* Trust Seals Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 pt-6 border-t border-slate-200/80 text-xs font-mono text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-pink-600" />
                Instant 2 free credits on sign up
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                Full voice &amp; scorecard access
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
