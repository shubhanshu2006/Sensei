import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Target,
  Users,
  Building2,
  Mail,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Us | Sensei — AI-Powered Interview Preparation Platform",
  description:
    "Learn about Sensei, our mission, legal business details, and how we empower job seekers with adaptive AI mock interviews.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#fff7f2] via-slate-50 to-slate-50 pt-28 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 border border-orange-200/60 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              Company &amp; Platform Overview
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              About Sensei
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Sensei is an intelligent, voice-first AI technical mock interview and candidate assessment platform designed to help engineering talent excel in high-stakes interviews.
            </p>
          </div>

          {/* Quick Legal & Business Profile Box for Compliance Reviewers */}
          <Card className="p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <h2 className="font-serif text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-orange-500" />
              Business &amp; Merchant Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Legal Business / Trade Name
                </span>
                <p className="font-medium text-slate-800 text-base">
                  Sensei (Operated by Shubhanshu Singh)
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Business Category &amp; Industry
                </span>
                <p className="font-medium text-slate-800 text-base">
                  Educational Technology (EdTech) / Software as a Service (SaaS)
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Nature of Products / Services
                </span>
                <p className="font-medium text-slate-800">
                  Digital AI Mock Interview Simulations, Real-Time Audio Feedback, &amp; Practice Credits
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Official Contact Email
                </span>
                <p className="font-medium text-slate-800">
                  <a
                    href="mailto:shubhanshus450@gmail.com"
                    className="text-orange-600 hover:text-pink-600 transition-colors font-medium hover:underline"
                  >
                    shubhanshus450@gmail.com
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Operational Location
                </span>
                <p className="font-medium text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" /> India
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Customer Support Hours
                </span>
                <p className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" /> Mon – Sat: 9:00 AM – 6:00 PM IST
                </p>
              </div>
            </div>
          </Card>

          {/* Mission & What We Do */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900">
                Our Mission
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Technical interviews can be intimidating and unpredictable. Our mission is to make comprehensive interview coaching affordable and accessible to every candidate worldwide through conversational AI that feels just like talking with a Senior Staff Engineer.
              </p>
            </Card>

            <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-slate-900">
                How Sensei Works
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Candidates purchase affordable digital practice credits to run realistic mock interviews across Frontend, Backend, System Design, and Algorithms. Each interview delivers instant scorecard evaluations with actionable steps for improvement.
              </p>
            </Card>
          </div>

          {/* Core Values */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Why Engineers Choose Sensei
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <ShieldCheck className="h-6 w-6 text-orange-500" />
                <h4 className="font-semibold text-slate-900">Zero Judgment</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Practice repeatedly in a safe environment without fear of rejection. Build genuine confidence before your real-world rounds.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <Sparkles className="h-6 w-6 text-pink-500" />
                <h4 className="font-semibold text-slate-900">Bar-Raiser Rubrics</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Scorecards benchmarked against FAANG &amp; top tier tech competencies to give you genuine indicators of your hiring readiness.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <Users className="h-6 w-6 text-orange-500" />
                <h4 className="font-semibold text-slate-900">Affordable For Students</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Starting at just ₹4 per session, high quality interview prep is never out of reach for students and campus graduates.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-2xl font-bold">Ready to practice?</h3>
              <p className="text-slate-400 text-sm mt-1">
                Start with 2 free mock sessions or explore our practice tracks.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/#pricing"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:opacity-95 text-white font-medium text-sm transition-all shadow-md shadow-orange-500/20"
              >
                View Plans
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
