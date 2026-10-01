'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignUp } from '@clerk/nextjs';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { apiClient } from '@/lib/api/client';
import { ShieldAlert, ShieldCheck, ArrowRight, ArrowLeft, Lock, Loader2, Sparkles, Gift, Zap, BarChart3, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { maskEmail } from '@/lib/utils';

export default function SignUpPage() {
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<{ maskedEmail?: string; message?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyDevice() {
      try {
        const visitorId = await getDeviceFingerprint();
        if (!isMounted) return;

        if (visitorId) {
          const { data } = await apiClient.post('/auth/check-device', { visitorId });
          const res = data?.data || data;

          if (res?.isRegistered && isMounted) {
            setDeviceBlocked(true);
            setBlockedInfo({
              maskedEmail: res.maskedEmail,
              message: res.message,
            });
          }
        }
      } catch (err) {
        console.warn('Device verification check error:', err);
      } finally {
        if (isMounted) {
          setCheckingDevice(false);
        }
      }
    }

    verifyDevice();

    return () => {
      isMounted = false;
    };
  }, []);

  if (checkingDevice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/40 px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-slate-500 bg-white/80 p-6 rounded-2xl border border-orange-100 shadow-lg backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium text-slate-700">Verifying device integrity...</p>
        </div>
      </div>
    );
  }

  // If this device already has an account registered, BLOCK new sign-ups and prevent account switching
  if (deviceBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/40 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border border-orange-200/90 shadow-2xl shadow-orange-500/10 bg-white rounded-3xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 text-orange-600 border border-orange-200 shadow-sm">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-semibold mb-2">
                <Lock className="h-3 w-3" />
                <span>Single Account Policy</span>
              </div>
              <CardTitle className="text-2xl font-serif font-bold text-slate-900">
                Device Already Registered
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-2 leading-relaxed">
                This device is already associated with an existing Sensei account. To prevent abuse and protect trial fairness, creating multiple accounts or account switching is not permitted on the same device.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-8 px-6 space-y-5">
              {blockedInfo?.maskedEmail && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-center">
                  <p className="text-xs text-slate-500 font-medium">Linked Account</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 tracking-wide">
                    {maskEmail(blockedInfo.maskedEmail)}
                  </p>
                </div>
              )}

              <Link href="/sign-in" className="block w-full">
                <Button className="w-full h-11 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                  <span>Sign In to Your Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <div className="text-center text-xs text-slate-400">
                If you believe this is in error, please contact{' '}
                <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 underline font-medium">
                  support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 border border-orange-500/20 shadow-xs backdrop-blur-sm">
              <Gift className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                2 Free AI Mock Interviews Included
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-serif text-4xl xl:text-5xl font-bold text-slate-950 tracking-tight leading-[1.15]">
                Master your next{' '}
                <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                  technical interview
                </span>
                .
              </h1>
              <p className="text-slate-600 text-base leading-relaxed max-w-lg">
                Join thousands of candidates who practice system design, frontend, backend, and STAR behavioral interviews with an adaptive AI interviewer.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3.5 text-sm text-slate-700 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">2 Free Mock Rounds on Signup</p>
                  <p className="text-xs text-slate-500">Zero payment details or credit card required to start practicing</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm text-slate-700 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0 border border-pink-100">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Adaptive Bar-Raiser Rigor</p>
                  <p className="text-xs text-slate-500">Live follow-up drilldowns tailored to your exact responses in real time</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-sm text-slate-700 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200/60 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Comprehensive Scorecards</p>
                  <p className="text-xs text-slate-500">Detailed metric analysis, red flag detection, and clear improvement tips</p>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="p-4 rounded-2xl bg-white/80 border border-orange-100 shadow-sm space-y-2.5">
              <div className="flex items-center gap-1 text-orange-500">
                <Quote className="w-4 h-4 fill-orange-500/20" />
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed">
                &quot;With Sensei&apos;s ₹5 practice credits, I did mock rounds daily for three weeks and cracked Google&apos;s campus hiring loop!&quot;
              </p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-900">Sneha Kulkarni</span>
                <span className="text-slate-500 font-medium">Software Engineer at Google</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clerk Sign Up Widget */}
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
                  Join Sensei
                </h1>
                <p className="text-slate-600 text-sm">
                  Start your free AI interview preparation today
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-xl p-2 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xl shadow-orange-500/5">
                <SignUp
                  fallbackRedirectUrl="/candidate/dashboard"
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
                <span>Single-device trial protection • No credit card required</span>
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
