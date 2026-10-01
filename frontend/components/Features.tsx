'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Mic,
  FileText,
  CheckCircle2,
  TrendingUp,
  Volume2,
  Users,
  MessageSquare,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Brain,
} from 'lucide-react';

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSpeechState, setActiveSpeechState] = useState<'ai' | 'candidate'>('ai');
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

  // Alternate AI speaking and Candidate speaking animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpeechState((prev) => (prev === 'ai' ? 'candidate' : 'ai'));
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
      {/* Background ambient glow in Orange & Pink */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-gradient-to-br from-pink-500/10 to-orange-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-gradient-to-br from-orange-400/10 to-rose-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 shadow-xs">
            <Sparkles className="h-3 w-3 text-orange-500" />
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Core Platform Capabilities
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 tracking-tight font-bold">
            How Sensei prepares you for{' '}
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
              real interview rounds
            </span>
          </h2>

          <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            From resume-tailored LangGraph questioning and live neural voice dialogue to 4-dimensional bar-raiser scorecards.
          </p>
        </div>

        {/* 3 CORE REAL SENSEI FEATURES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CARD 1: RESUME-PERSONALIZED QUESTIONING (InterviewGraph + ResumeParser) */}
          <div
            className={`rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-orange-50/50 via-white to-pink-50/30 border border-orange-100 shadow-md relative overflow-hidden group hover:shadow-xl transition-all duration-700 flex flex-col justify-between ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-orange-600 font-semibold mb-2">
                <Brain className="h-3.5 w-3.5 text-orange-500" />
                Adaptive LangGraph Engine
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                Resume-Tailored Questions
              </h3>
              <p className="font-sans text-xs text-slate-600 mb-4 leading-relaxed">
                Sensei parses your uploaded resume, extracts your claimed tech stack and projects, and formulates targeted questions.
              </p>

              {/* Resume Parsing + Question Branching Box */}
              <div className="rounded-2xl bg-white border border-orange-100 p-4 shadow-xs space-y-3">
                {/* Resume Source Pill */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    <span className="font-semibold">Candidate_Resume.pdf</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200">
                    Parsed
                  </span>
                </div>

                {/* Detected Competency Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 block">Extracted Stack & Skills:</span>
                  <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">Distributed Systems</span>
                    <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-200">Kafka & Redis</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">PostgreSQL</span>
                  </div>
                </div>

                {/* LangGraph Generated Question */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-orange-200/70 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-orange-800 font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-orange-600" /> Generated Question #2
                    </span>
                    <span className="text-orange-600 text-[9px]">Uncovered Skill Probe</span>
                  </div>
                  <p className="text-[11px] font-sans text-slate-800 leading-snug">
                    &quot;On your resume, you mention building a payment event pipeline. How did you ensure idempotency across distributed microservices?&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Tag */}
            <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dynamic Skill Graph
              </span>
              <span className="text-orange-600 font-bold">100% Personalized</span>
            </div>
          </div>

          {/* CARD 2: LIVE VOICE INTERVIEW ROOM (WebSocket + Speech Synthesis) */}
          <div
            className={`rounded-3xl p-5 sm:p-6 bg-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:border-slate-700 transition-all duration-700 flex flex-col justify-between ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '150ms' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-orange-400 font-semibold">
                  <Mic className="h-3.5 w-3.5 text-orange-400" />
                  Live Interview Room
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  WebSocket Stream
                </div>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-1">
                Voice-Driven Interaction
              </h3>
              <p className="font-sans text-xs text-slate-400 mb-4 leading-relaxed">
                Real spoken dialogue using natural speech synthesis (Jenny / Google Neural TTS) and real-time audio speech-to-text.
              </p>

              {/* Interview Room Simulation Interface */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-3 font-mono text-[11px]">
                {/* Voice Engine Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-pink-400" />
                    <span>Voice: Natural Neural (0.98x)</span>
                  </div>
                  <span className="text-orange-400 font-medium">Question 3 of 6</span>
                </div>

                {/* Animated Speech Waveform reacting to active speaker */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className={`w-2 h-2 rounded-full ${activeSpeechState === 'ai' ? 'bg-orange-400 animate-pulse' : 'bg-pink-400 animate-pulse'}`} />
                      {activeSpeechState === 'ai' ? 'Sensei AI Speaking...' : 'Candidate Answering...'}
                    </span>
                    <span className="text-slate-500">Live Transcript</span>
                  </div>

                  <div className="flex items-center justify-between gap-1 h-7 px-1">
                    {[35, 60, 40, 85, 95, 70, 50, 80, 65, 90, 45, 75, 55, 80, 40].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          activeSpeechState === 'ai'
                            ? 'bg-gradient-to-t from-orange-500 to-rose-500'
                            : 'bg-gradient-to-t from-pink-500 to-orange-400'
                        }`}
                        style={{
                          height: `${h}%`,
                          animation: `pulse 1.2s ease-in-out ${i * 0.08}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Speech transcript snippet */}
                  <p className="text-[10px] font-sans text-slate-300 pt-1 leading-snug">
                    {activeSpeechState === 'ai'
                      ? '"Can you walk me through how you handled partition tolerance during network spikes?"'
                      : '"We implemented a write-ahead log combined with consensus heartbeats to prevent split-brain..."'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Audio Navigation */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-slate-400">Mic & Camera Active</span>
              <span className="text-orange-400 font-bold">Low Latency</span>
            </div>
          </div>

          {/* CARD 3: 4-DIMENSIONAL SCORECARD (EvaluationService) */}
          <div
            className={`rounded-3xl p-5 sm:p-6 bg-white border border-slate-200/80 shadow-md relative overflow-hidden group hover:shadow-xl transition-all duration-700 flex flex-col justify-between ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '300ms' }}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-pink-600 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Bar-Raiser Evaluation
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                  STRONG_YES
                </span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                4-Dimensional Scorecard
              </h3>
              <p className="font-sans text-xs text-slate-600 mb-4 leading-relaxed">
                Instant evaluation against 4 distinct competencies calibrated to your chosen role track, complete with actionable feedback.
              </p>

              {/* Scorecard Metric Breakdown */}
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-700">Competency Breakdown</span>
                  <span className="text-xs font-mono font-bold text-slate-900">Overall: 91/100</span>
                </div>

                {/* 4 Real Evaluation Dimensions */}
                <div className="space-y-2 text-xs font-sans">
                  {[
                    { name: 'Technical Knowledge', score: 94 },
                    { name: 'Problem Solving', score: 90 },
                    { name: 'Communication & STAR', score: 88 },
                    { name: 'Culture & Confidence', score: 92 },
                  ].map((dim, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600">{dim.name}</span>
                        <span className="font-bold text-slate-900">{dim.score}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000"
                          style={{
                            width: isVisible ? `${dim.score}%` : '0%',
                            transitionDelay: `${idx * 100 + 200}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actionable Feedback Bullet */}
                <div className="pt-1 text-[11px] font-sans text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>&quot;Strong articulation of database sharding and trade-offs under high write concurrency.&quot;</span>
                </div>
              </div>
            </div>

            {/* Bottom Scorecard Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span className="text-slate-500">Strengths & Improvement Plan</span>
              <span className="text-pink-600 font-bold flex items-center gap-1">
                Full Report <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: MULTI-TRACK PRACTICE LIBRARY (Directly from candidate/practice/page.tsx) */}
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="font-serif text-lg sm:text-xl font-bold text-white">
                Multi-Track Practice Library
              </h4>
              <p className="font-sans text-xs text-slate-400">
                Choose your specific domain. Sensei adapts its questions and evaluation rubric accordingly.
              </p>
            </div>
            <span className="text-[11px] font-mono text-orange-400 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 self-start sm:self-auto">
              Beginner → Expert Tiers
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
            {[
              {
                title: 'Technical Roles',
                desc: 'Frontend, Backend, System Design, DevOps, Mobile & ML',
                icon: Terminal,
                color: 'text-orange-400',
              },
              {
                title: 'Sales & BD',
                desc: 'Pitching, Value Proposition, Discovery & Deal Closing',
                icon: TrendingUp,
                color: 'text-pink-400',
              },
              {
                title: 'HR & People Ops',
                desc: 'People Strategy, STAR Method, Compliance & Empathy',
                icon: Users,
                color: 'text-rose-400',
              },
              {
                title: 'Communication',
                desc: 'Executive Presence, PREP Framework, Clarity & Tone',
                icon: MessageSquare,
                color: 'text-amber-400',
              },
            ].map((track, idx) => {
              const Icon = track.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${track.color}`} />
                    <span className="text-xs font-bold text-white">{track.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{track.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}


