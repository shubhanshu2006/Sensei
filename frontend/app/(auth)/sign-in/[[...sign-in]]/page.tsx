'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignIn } from '@clerk/nextjs';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { apiClient } from '@/lib/api/client';
import { ShieldCheck, Lock, ArrowLeft, Sparkles, Mic, Zap, Trophy, Quote } from 'lucide-react';
import { maskEmail } from '@/lib/utils';

export default function SignInPage() {
  const [boundEmail, setBoundEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkLock() {
      // 1. Check local storage
      const localEmail = localStorage.getItem('sensei_bound_account_email');
      if (localEmail && isMounted) {
        setBoundEmail(maskEmail(localEmail));
        return;
      }

      // 2. Check backend device binding
      try {
        const fp = await getDeviceFingerprint();
        if (!isMounted || !fp) return;

        const { data } = await apiClient.post('/auth/check-device', { visitorId: fp });
        const res = data?.data || data;
        if (res?.isRegistered && res?.maskedEmail && isMounted) {
          setBoundEmail(res.maskedEmail);
        }
      } catch {
        // Silently continue
      }
    }

    checkLock();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff8f3] via-white to-pink-50/40 relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-orange-400/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-tl from-pink-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 px-6 sm:px-12 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 group-hover:text-slate-900 transition-all" />
          <span>Back to Home</span>
        </Link>

        <Link href="/" className="flex items-center group py-0.5">
          <Image
            src="/Logo.png"
            alt="Sensei"
            width={125}
            height={36}
            priority
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-12 py-4 lg:py-8 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 w-full items-center">
          
          {/* Left Column: Brand Showcase & Value Proposition */}
          <div className="lg:col-span-6 space-y-8 hidden lg:block pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-orange-200/80 shadow-xs backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                Adaptive AI Mock Interviews
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl xl:text-5xl font-bold text-slate-950 tracking-tight leading-[1.15]">
                Welcome back to your{' '}
                <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                  interview advantage
                </span>
                .
              </h1>
              <p className="text-slate-600 text-base leading-relaxed max-w-lg">
                Log in to resume active practice tracks, view your latest dimensional scorecards, and review speech telemetry from recent mock rounds.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3.5 text-sm text-slate-700 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Real-Time Voice AI Rounds</p>
                  <p className="text-xs text-slate-500">Live conversational pushback mimicking actual Bar-Raiser loops</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm text-slate-700 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0 border border-pink-100">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Instant Dimensional Scorecard</p>
                  <p className="text-xs text-slate-500">Immediate strengths, architectural gaps, and pass-rate readiness</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm text-slate-700 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Permanent Track History</p>
                  <p className="text-xs text-slate-500">Full transcripts and historical progress saved to your candidate dashboard</p>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="p-4 rounded-2xl bg-white/80 border border-orange-100 shadow-sm space-y-2.5">
              <div className="flex items-center gap-1 text-orange-500">
                <Quote className="w-4 h-4 fill-orange-500/20" />
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                &quot;The AI challenged my distributed caching schemes with the exact same rigor as my Amazon Bar-Raiser. Landed an SDE-2 offer!&quot;
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-900">Aditya Verma</span>
                <span className="text-slate-500 font-medium">SDE-2 at Amazon</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clerk Sign In Widget */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
            <div className="w-full max-w-md space-y-5">
              
              {/* Mobile Header Title */}
              <div className="lg:hidden text-center space-y-2 mb-4">
                <div className="flex justify-center mb-1">
                  <Image
                    src="/Logo.png"
                    alt="Sensei"
                    width={140}
                    height={42}
                    priority
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <h1 className="font-serif text-2xl font-bold text-slate-900">
                  Welcome back
                </h1>
                <p className="text-slate-600 text-sm">
                  Sign in to continue your interview preparation
                </p>
              </div>

              {boundEmail && (
                <div className="w-full inline-flex items-center justify-center gap-2 p-3 bg-orange-50/90 border border-orange-200/90 rounded-2xl text-xs text-orange-950 font-medium shadow-xs">
                  <Lock className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span>Device locked to registered account: <strong className="font-semibold">{maskEmail(boundEmail)}</strong></span>
                </div>
              )}

              <div className="bg-white/90 backdrop-blur-xl p-2 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xl shadow-orange-500/5">
                <SignIn
                  fallbackRedirectUrl="/candidate/dashboard"
                  initialValues={boundEmail && !boundEmail.includes('*') ? { emailAddress: boundEmail } : undefined}
                  appearance={{
                    elements: {
                      rootBox: "mx-auto w-full",
                      card: "shadow-none border-0 bg-transparent p-4 sm:p-6",
                      headerTitle: "font-serif text-2xl font-bold text-slate-950 text-center tracking-tight",
                      headerSubtitle: "text-slate-600 text-sm text-center",
                      socialButtonsBlockButton:
                        "border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all rounded-xl h-11 shadow-xs",
                      socialButtonsBlockButtonText: "font-medium text-slate-700 text-sm",
                      formButtonPrimary:
                        "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 rounded-xl h-11 text-sm font-semibold shadow-md shadow-orange-500/20 text-white transition-all hover:scale-[1.01]",
                      formFieldInput:
                        "rounded-xl border-slate-300 focus:border-orange-500 focus:ring-orange-500 h-11 text-sm",
                      formFieldLabel: "text-slate-700 font-medium text-xs uppercase tracking-wide",
                      footerActionLink:
                        "text-orange-600 hover:text-pink-600 font-semibold transition-colors",
                      identityPreviewEditButton:
                        "text-orange-600 hover:text-pink-600",
                      formResendCodeLink: "text-orange-600 hover:text-pink-600 font-medium",
                      dividerLine: "bg-slate-200",
                      dividerText: "text-slate-400 text-xs uppercase tracking-wider",
                    },
                  }}
                />
              </div>

              {/* Bottom Security Assurance */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enterprise grade security • 100% digital platform</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Links */}
      <footer className="relative z-10 px-6 py-6 max-w-7xl mx-auto w-full text-center text-xs text-slate-500 border-t border-slate-200/60 mt-8">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span>&copy; {new Date().getFullYear()} Sensei. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Support Desk</Link>
        </div>
      </footer>
    </div>
  );
}
