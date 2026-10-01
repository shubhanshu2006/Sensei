'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Mic,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Zap,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Terminal,
  Users,
  MessageSquare,
} from 'lucide-react';

const LIVE_ACTIVITIES = [
  {
    track: 'System Design',
    title: 'Distributed Rate Limiter (Token Bucket)',
    time: 'Just now',
    badge: 'Score: 92/100',
    badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200/80 font-semibold',
    color: 'bg-orange-500',
  },
  {
    track: 'Enterprise Sales',
    title: 'MEDDPICC Discovery & Executive Pitch',
    time: '3m ago',
    badge: 'Feedback Ready',
    badgeStyle: 'bg-pink-50 text-pink-700 border-pink-200/80 font-semibold',
    color: 'bg-pink-500',
  },
  {
    track: 'Voice AI Engine',
    title: 'Groq Whisper Audio Stream (115ms)',
    time: '7m ago',
    badge: 'Transcribed',
    badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200/80 font-semibold',
    color: 'bg-orange-500',
  },
  {
    track: 'HR & People',
    title: 'STAR Behavioral: Resolving Cross-Team Conflict',
    time: '12m ago',
    badge: 'Score: 89/100',
    badgeStyle: 'bg-pink-50 text-pink-700 border-pink-200/80 font-semibold',
    color: 'bg-pink-500',
  },
  {
    track: 'Technical Depth',
    title: 'Concurrency, Mutexes & Go Routines',
    time: '19m ago',
    badge: 'Bar-Raiser Pass',
    badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200/80 font-semibold',
    color: 'bg-orange-500',
  },
  {
    track: 'Executive Presence',
    title: 'PREP Framework: Crisp Architecture Pitch',
    time: '26m ago',
    badge: 'Evaluated',
    badgeStyle: 'bg-pink-50 text-pink-700 border-pink-200/80 font-semibold',
    color: 'bg-pink-500',
  },
  {
    track: 'Dimensional Scorecard',
    title: 'Dimensional Report: Senior Architect Track',
    time: '38m ago',
    badge: 'Generated',
    badgeStyle: 'bg-orange-50 text-orange-700 border-orange-200/80 font-semibold',
    color: 'bg-orange-500',
  },
  {
    track: 'Sales & BD',
    title: 'Objection Handling: Competitor Displacement',
    time: '45m ago',
    badge: 'Score: 86/100',
    badgeStyle: 'bg-pink-50 text-pink-700 border-pink-200/80 font-semibold',
    color: 'bg-pink-500',
  },
];

const PRACTICE_TRACKS = [
  {
    title: 'Technical',
    desc: 'Frontend, Backend, System Design',
    icon: Terminal,
    isOrange: true,
  },
  {
    title: 'Sales & BD',
    desc: 'Pitching, Discovery, Closing',
    icon: TrendingUp,
    isOrange: false,
  },
  {
    title: 'HR & People',
    desc: 'STAR Behavioral & Strategy',
    icon: Users,
    isOrange: false,
  },
  {
    title: 'Communication',
    desc: 'Executive Presence & PREP',
    icon: MessageSquare,
    isOrange: true,
  },
];

function AnimatedNumber({
  value,
  isVisible,
  delay = 0,
  duration = 1000,
}: {
  value: number;
  isVisible: boolean;
  delay?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayValue(0);
      return;
    }

    const timer = setTimeout(() => {
      const startTime = performance.now();
      const startVal = 0;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(startVal + (value - startVal) * ease);

        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, value, delay, duration]);

  return <span>{displayValue}</span>;
}

export default function BentoGrid() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPausedTracks, setIsPausedTracks] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || isPausedTracks) return;
    const interval = setInterval(() => {
      setActiveTrackIndex((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, [isVisible, isPausedTracks]);

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
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden"
    >
      {/* Background ambient glow in Orange & Pink */}
      <div className="absolute top-1/4 -left-36 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-36 w-80 h-80 bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Section Header with balanced, smaller font sizing */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 border border-orange-500/20 shadow-xs">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-sans font-semibold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Platform Showcase
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight font-bold">
            See Sensei in{' '}
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
              live action
            </span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            Experience real-time voice interviews, continuous practice telemetry, and adaptive feedback calibrated for top-tier tech rounds.
          </p>
        </div>

        {/* PRIMARY FEATURE SHOWCASE: Continuous Activity & Live Feed (Luminous Clean Styling) */}
        <div
          className={`rounded-3xl p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-white via-orange-50/25 to-pink-50/20 text-slate-900 border border-slate-200/90 shadow-xl shadow-slate-200/50 relative overflow-hidden transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          {/* Subtle ambient glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-slate-950 font-bold tracking-tight">
                  Continuous Evaluation Activity
                </h3>
              </div>
              <p className="font-sans text-xs sm:text-sm text-slate-600">
                Every technical response, architecture diagram, and interview session evaluated over time.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-semibold self-start sm:self-auto shadow-xs">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              Live Telemetry
            </div>
          </div>

          {/* Two-Column Grid: Chart on Left, Activity Feed on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Left Panel: Analytics & Animated Monthly Bars (Spans 7 cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md p-6 flex flex-col justify-between space-y-5 transition-shadow">
              {/* Header metrics */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-slate-950 tracking-tight">
                    24,582
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700">
                    <TrendingUp className="h-3 w-3 text-orange-600" /> +18%
                  </span>
                </div>
                <p className="font-sans text-xs text-slate-500">
                  Total practice rounds evaluated this month
                </p>
              </div>

              {/* Middle Telemetry Row: Key platform performance stats */}
              <div className="grid grid-cols-3 gap-3 py-3 px-1 border-y border-slate-100 font-sans">
                <div className="space-y-0.5">
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Avg Score</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-serif">84.2%</span>
                    <span className="text-[10px] font-mono text-orange-600 font-semibold bg-orange-50 px-1 rounded">+6.4%</span>
                  </div>
                </div>

                <div className="space-y-0.5 border-x border-slate-100 px-3">
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">STT Latency</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-serif">115ms</span>
                    <span className="text-[10px] font-mono text-orange-600 font-semibold bg-orange-50 px-1 rounded">Groq</span>
                  </div>
                </div>

                <div className="space-y-0.5 pl-1">
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Readiness Pass</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold text-slate-900 font-serif">78.5%</span>
                    <span className="text-[10px] font-mono text-pink-600 font-semibold bg-pink-50 px-1 rounded">Top Tier</span>
                  </div>
                </div>
              </div>

              {/* Animated Bar Chart with Unified Baseline & Proper Bottom Spacing */}
              <div className="space-y-2 pt-1 pb-1">
                <div className="relative flex items-end justify-between gap-1.5 sm:gap-2 h-36 sm:h-40 px-1 pb-2 border-b border-slate-100">
                  {/* Subtle horizontal dashed guide lines */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-30">
                    <div className="border-b border-dashed border-slate-300 w-full" />
                    <div className="border-b border-dashed border-slate-300 w-full" />
                    <div className="border-b border-dashed border-slate-300 w-full" />
                  </div>

                  {[35, 52, 42, 65, 40, 48, 56, 74, 62, 50, 68, 58, 80, 64, 88, 96].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-orange-500 via-rose-500 to-pink-500 group-hover:brightness-110 shadow-xs relative overflow-hidden transition-all"
                        style={{
                          height: isVisible ? `${height}%` : '8%',
                          transformOrigin: 'bottom',
                          animation: isVisible
                            ? `barWaveContinuous 2.6s ease-in-out ${(i * 0.16)}s infinite alternate`
                            : 'none',
                        }}
                      >
                        {/* Shimmer on bars */}
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unified Month Labels with clean spacing */}
                <div className="flex justify-between px-2 pt-1 text-[11px] font-sans text-slate-500 font-medium">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>

            {/* Right Panel: Live Activity Feed (Spans 5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-sm hover:shadow-md p-6 flex flex-col justify-between space-y-4 overflow-hidden relative group transition-shadow">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-pink-600">
                    Live Telemetry
                  </span>
                  <h4 className="font-serif text-xl font-bold text-slate-950 tracking-tight">
                    Live Session Feed
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-[10px] font-mono text-pink-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                  Live Ticker
                </span>
              </div>

              {/* Upward Constantly Moving Activity Feed Viewport */}
              <div className="relative h-[255px] overflow-hidden">
                {/* Top gradient fade */}
                <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white via-white/80 to-transparent z-10" />
                {/* Bottom gradient fade */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />

                {/* Animated scrolling container */}
                <div className="animate-scroll-up flex flex-col gap-2.5 font-sans">
                  {[...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES].map((item, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50/90 hover:bg-white border border-slate-200/70 hover:border-orange-300 hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${item.color} shrink-0 animate-pulse`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="text-slate-600 font-medium">{item.track}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom footer status */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  Continuous Telemetry
                </span>
                <span className="text-slate-400">Hover to pause</span>
              </div>
            </div>

          </div>

          {/* Bottom tag */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-500">
            <span>A more rigorous technical preparation ecosystem.</span>
            <span className="text-slate-600 font-medium">Zero recruiters • Candidate-first platform</span>
          </div>
        </div>

        {/* SECOND ROW BENTO: Live Voice AI + Live Timer + Smart Scoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card A: Live Voice Interviewer & Waveform */}
          <div
            className={`rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/80 shadow-lg relative overflow-hidden group hover:shadow-xl hover:border-orange-500/30 transition-all duration-700 flex flex-col justify-between ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            style={{ transitionDelay: '150ms' }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Mic className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  Ultra-Low Latency
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1">
                Live Voice Interviewer
              </h3>
              <p className="font-sans text-xs text-slate-600 mb-4 leading-relaxed">
                Real spoken dialogue. Explains nuances and challenges hand-wavy claims in real-time.
              </p>

              {/* Voice Audio Waveform Animation (Luminous Clean Design) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/80 via-pink-50/50 to-slate-50 border border-orange-200/70 shadow-xs space-y-2.5 mb-3.5">
                <div className="flex items-center justify-between text-[11px] text-slate-700 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    <span className="font-semibold text-slate-800">Neural Voice Stream</span>
                  </span>
                  <span className="font-bold text-orange-600 bg-orange-100/70 px-1.5 py-0.5 rounded">120ms</span>
                </div>

                <div className="flex items-center justify-between gap-1 h-8 px-1">
                  {[30, 65, 45, 90, 55, 100, 65, 80, 40, 85, 60, 75, 50, 88, 35].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-orange-500 via-rose-500 to-pink-500 rounded-full shadow-xs transition-all duration-300"
                      style={{
                        height: isVisible ? `${h}%` : '20%',
                        animation: `pulse 1.3s ease-in-out ${i * 0.08}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Real-time AI Voice Dialogue Turn */}
              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-100/90 space-y-1 font-sans">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-orange-700 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-orange-600" /> Sensei Voice AI
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Real-Time Turn</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-snug">
                  &ldquo;You mentioned sharding by user_id, but how do you prevent hot partition bottlenecks during peak traffic?&rdquo;
                </p>
              </div>
            </div>

            {/* Bottom Telemetry Status Bar */}
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-100 mt-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Full-Duplex Speech
              </span>
              <span className="text-orange-600 font-semibold">Groq Whisper Engine</span>
            </div>
          </div>

          {/* Card B: Multi-Track Practice Library */}
          <div
            className={`rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-orange-50/70 via-white to-pink-50/50 border border-orange-100/90 shadow-lg relative overflow-hidden group hover:shadow-2xl hover:border-orange-300/80 transition-all duration-700 flex flex-col justify-between ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            style={{ transitionDelay: '250ms' }}
          >
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-bl from-orange-400/20 via-pink-400/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr from-amber-400/15 via-orange-400/10 to-transparent rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="relative inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-50/90 text-orange-700 border border-orange-200/90 shadow-2xs overflow-hidden">
                  <span className="relative z-10 flex items-center gap-1">
                    Beginner <span className="text-orange-400 font-sans group-hover:translate-x-0.5 transition-transform">→</span> Expert
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent -translate-x-full animate-shimmer" />
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1 group-hover:text-slate-950 transition-colors">
                Multi-Track Practice Library
              </h3>
              <p className="font-sans text-xs text-slate-600 mb-5 leading-relaxed">
                Role-tailored mock interview tracks calibrated across Tech, Sales, HR, and Communication.
              </p>

              {/* 4 Role Track Badges Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-4 font-sans">
                {PRACTICE_TRACKS.map((track, idx) => {
                  const IconComponent = track.icon;
                  const isActive = activeTrackIndex === idx;
                  const isOrange = track.isOrange;

                  return (
                    <div
                      key={track.title}
                      onMouseEnter={() => {
                        setActiveTrackIndex(idx);
                        setIsPausedTracks(true);
                      }}
                      onMouseLeave={() => setIsPausedTracks(false)}
                      className={`p-3 rounded-2xl relative overflow-hidden transition-all duration-300 cursor-pointer ${isActive
                        ? isOrange
                          ? 'bg-white shadow-md shadow-orange-500/10 border-orange-300 ring-2 ring-orange-400/25 -translate-y-0.5'
                          : 'bg-white shadow-md shadow-pink-500/10 border-pink-300 ring-2 ring-pink-400/25 -translate-y-0.5'
                        : isOrange
                          ? 'bg-white/80 border border-orange-100/90 shadow-2xs hover:border-orange-300 hover:bg-white'
                          : 'bg-white/80 border border-pink-100/90 shadow-2xs hover:border-pink-300 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${isActive
                              ? isOrange
                                ? 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xs scale-105'
                                : 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-xs scale-105'
                              : isOrange
                                ? 'bg-orange-100/80 text-orange-600'
                                : 'bg-pink-100/80 text-pink-600'
                              }`}
                          >
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-900 truncate">
                            {track.title}
                          </span>
                        </div>

                        {/* Live active beacon dot */}
                        {isActive && (
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOrange ? 'bg-orange-400' : 'bg-pink-400'
                                }`}
                            />
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${isOrange ? 'bg-orange-500' : 'bg-pink-500'
                                }`}
                            />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight pl-0.5">
                        {track.desc}
                      </p>

                      {/* Active indicator bottom glowing bar */}
                      {isActive && (
                        <div className="absolute bottom-0 inset-x-0 h-0.5 bg-slate-100/60 overflow-hidden">
                          <div
                            className={`h-full w-full ${isOrange
                              ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500'
                              } animate-pulse`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Difficulty Tiers Bar */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-3 border-t border-orange-100/80">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                  </span>
                  Adaptive Practice
                </span>
                <span className="inline-flex items-center text-orange-600 font-semibold px-2 py-0.5 rounded-md bg-orange-100/60 border border-orange-200/60">
                  4 Role Tracks
                </span>
              </div>
            </div>
          </div>

          {/* Card C: Smart Scoring Arc Metric (Earlier Beloved Style) */}
          <div
            className={`rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-pink-50/60 via-white to-rose-50/50 border border-pink-100/90 shadow-lg relative overflow-hidden group hover:shadow-2xl hover:border-pink-300/80 transition-all duration-700 flex flex-col justify-between ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            style={{ transitionDelay: '350ms' }}
          >
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 bg-gradient-to-bl from-pink-400/20 via-rose-400/10 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 bg-gradient-to-tr from-orange-400/15 via-pink-400/10 to-transparent rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="relative inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/90 shadow-2xs overflow-hidden">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Bar-Raiser Calibrated
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-slate-900 mb-1 group-hover:text-slate-950 transition-colors">
                Dimensional Scorecards
              </h3>
              <p className="font-sans text-xs text-slate-600 mb-5 leading-relaxed">
                Instant evaluation on algorithm optimization, edge-cases, and architecture scale.
              </p>

              {/* Large Circular Score Gauge */}
              <div className="relative w-32 h-32 mx-auto mb-5 group/gauge">
                {/* Soft ambient breathing halo */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-orange-400/20 via-rose-400/20 to-pink-500/20 blur-xl animate-pulse pointer-events-none group-hover/gauge:scale-110 transition-transform duration-500" />

                <svg className="w-full h-full transform -rotate-90 relative z-10">
                  {/* Background Track */}
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="#fed7aa"
                    strokeOpacity="0.45"
                    strokeWidth="10"
                    fill="none"
                  />
                  {/* Animated Foreground Circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="54"
                    stroke="url(#bentoScoreGrad)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 54}`}
                    strokeDashoffset={isVisible ? `${2 * Math.PI * 54 * (1 - 0.91)}` : `${2 * Math.PI * 54}`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  {/* Glowing tip beacon at 91% mark */}
                  <circle
                    cx="109.6"
                    cy="35.1"
                    r="4"
                    fill="#ffffff"
                    className={`transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                    style={{
                      filter: 'drop-shadow(0 0 5px #ec4899)',
                      transitionDelay: '900ms',
                    }}
                  />
                  <defs>
                    <linearGradient id="bentoScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center score with animated counter */}
                <div className="absolute inset-0 flex items-center justify-center flex-col z-20 pointer-events-none">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight group-hover/gauge:scale-105 transition-transform duration-300">
                    <AnimatedNumber value={91} isVisible={isVisible} duration={1200} />
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
                    Overall
                  </span>
                </div>
              </div>

              {/* 3 Skill Breakdown Progress Bars */}
              <div className="space-y-2.5 text-xs font-sans">
                {[
                  { label: 'Technical Depth', val: 94 },
                  { label: 'Communication Clarity', val: 88 },
                  { label: 'Problem Solving Speed', val: 92 },
                ].map((skill, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredSkill(i)}
                    onMouseLeave={() => setHoveredSkill(null)}
                    className={`p-1.5 -mx-1.5 rounded-xl transition-all duration-300 cursor-default ${hoveredSkill === i
                      ? 'bg-white/90 shadow-sm border border-pink-100/90 -translate-y-0.5'
                      : 'hover:bg-white/40'
                      }`}
                  >
                    <div className="flex justify-between font-medium mb-1">
                      <span
                        className={`text-[11px] transition-colors ${hoveredSkill === i ? 'text-slate-950 font-semibold' : 'text-slate-600'
                          }`}
                      >
                        {skill.label}
                      </span>
                      <span className="text-slate-900 font-bold text-[11px] font-mono">
                        <AnimatedNumber
                          value={skill.val}
                          isVisible={isVisible}
                          delay={i * 150 + 350}
                          duration={900}
                        />
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100/90 rounded-full h-1.5 overflow-hidden relative shadow-inner">
                      <div
                        className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000 ease-out relative"
                        style={{
                          width: isVisible ? `${skill.val}%` : '0%',
                          transitionDelay: `${i * 150 + 400}ms`,
                        }}
                      >
                        {/* Ambient shimmer across progress fill */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
                        {/* Glowing tip */}
                        <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full shadow-[0_0_6px_#f43f5e]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
