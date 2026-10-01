"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCandidatePracticeCredits,
  useCandidateInterviewHistory,
  useCandidateDashboard,
} from "@/lib/api/queries/candidates";
import { usePracticeJobs, PracticeJob } from "@/lib/api/queries/practice";
import { BuyCreditsDialog } from "@/components/candidate/BuyCreditsDialog";
import {
  Zap,
  Play,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Clock,
  TrendingUp,
  CreditCard,
  Layers,
  Award,
  Calendar,
  FileText,
  ChevronRight,
  CheckCircle2,
  Terminal,
  Users,
  MessageSquare,
} from "lucide-react";
import { useFingerprint } from "@/hooks/useFingerprint";

export default function CandidateDashboard() {
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  // Automatically sync open-source device fingerprint for candidate abuse protection
  useFingerprint(true);

  const { data: creditsData, isLoading: creditsLoading } = useCandidatePracticeCredits();
  const { data: dashboardData, isLoading: dashboardLoading } = useCandidateDashboard();
  const { data: practiceData, isLoading: practiceJobsLoading } = usePracticeJobs();
  const { data: historyData, isLoading: historyLoading } = useCandidateInterviewHistory(1, 10);

  const practiceJobs: PracticeJob[] = practiceData?.jobs || [];
  const sessions = historyData?.sessions || historyData?.data || [];

  const totalCredits = creditsData?.practiceCredits ?? 2;
  const creditsUsed = creditsData?.practiceCreditsUsed ?? 0;
  const remainingCredits = Math.max(0, totalCredits - creditsUsed);

  // Calculate average score if history exists
  const scoredSessions = sessions.filter(
    (s: any) =>
      s.scorecard?.overallScore != null ||
      s.evaluation?.overallScore != null ||
      s.overallScore != null
  );

  const calculatedAvg =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce(
            (acc: number, s: any) =>
              acc +
              (s.scorecard?.overallScore ??
                s.evaluation?.overallScore ??
                s.overallScore ??
                0),
            0
          ) / scoredSessions.length
        )
      : null;

  const backendAvg =
    dashboardData?.data?.averageScore ?? dashboardData?.averageScore;
  const averageScore = backendAvg ?? calculatedAvg;

  const getDifficultyBadge = (diff?: string) => {
    const d = diff?.toUpperCase();
    if (d === "BEGINNER") {
      return (
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Beginner
        </span>
      );
    }
    if (d === "INTERMEDIATE") {
      return (
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          Intermediate
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
        Advanced
      </span>
    );
  };

  const getRecommendationBadge = (rec?: string) => {
    switch (rec) {
      case "STRONG_YES":
      case "YES":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Passed Loop
          </span>
        );
      case "CONSIDER":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            Consider
          </span>
        );
      case "NO":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Needs Practice
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Evaluated
          </span>
        );
    }
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-6 pb-8 font-sans">
        {/* Crisp luminous hero banner (clean light aesthetic) */}
        <div className="relative rounded-2xl p-5 sm:p-6 md:p-7 bg-gradient-to-br from-white via-orange-50/20 to-pink-50/15 text-slate-900 border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Ambient background glows in Orange & Pink */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2.5 max-w-xl">
              {/* Top micro pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-[10px] font-mono font-semibold text-orange-600">
                <Sparkles className="h-3 w-3 text-orange-500 animate-pulse" />
                <span>AI Practice Studio • 115ms Groq Voice STT</span>
              </div>

              {/* Headline in clean Inter font */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
                Calibrate your technique for{" "}
                <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                  top-tier offers.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg">
                Practice real-time spoken rounds calibrated against actual Google, Amazon, and Stripe bar-raiser rubrics with instant dimensional evaluation.
              </p>
            </div>

            {/* Quick Actions in Hero */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Link href="/candidate/practice">
                <Button
                  className="w-full sm:w-auto px-4 py-2 h-9 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-xs shadow-orange-500/20 transition-all inline-flex items-center justify-center gap-1.5 border-0"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Mock Session</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>

              <Button
                variant="outline"
                onClick={() => setBuyDialogOpen(true)}
                className="w-full sm:w-auto px-4 py-2 h-9 rounded-full text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-all inline-flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5 text-orange-500" />
                <span>Buy Credits</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Telemetry Bento: 4 Stat Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Available Practice Credits */}
          <div className="relative rounded-xl p-4 bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-500/5 to-pink-500/5 rounded-full pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  Available Credits
                </p>
                {creditsLoading ? (
                  <Skeleton className="mt-1.5 h-7 w-16 rounded-md" />
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-2xl font-bold text-slate-900">
                      {remainingCredits}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      of {totalCredits} total
                    </span>
                  </div>
                )}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-slate-600">
                    {remainingCredits > 0 ? "Ready for mock interviews" : "Top up to practice"}
                  </span>
                </div>
              </div>
              <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-xs">
                <Zap className="h-4 w-4 fill-current" />
              </div>
            </div>
          </div>

          {/* Card 2: Interviews Completed */}
          <div className="relative rounded-xl p-4 bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all group overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  Interviews Completed
                </p>
                {creditsLoading ? (
                  <Skeleton className="mt-1.5 h-7 w-16 rounded-md" />
                ) : (
                  <p className="text-2xl sm:text-2xl font-bold text-slate-900 mt-1">
                    {creditsUsed}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] font-medium text-slate-600">
                  Recorded and evaluated
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-500 shadow-xs">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Average Evaluation Score */}
          <div className="relative rounded-xl p-4 bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all group overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-500">
                  Performance Index
                </p>
                {historyLoading && dashboardLoading ? (
                  <Skeleton className="mt-1.5 h-7 w-16 rounded-md" />
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl sm:text-2xl font-bold text-slate-900">
                      {averageScore != null ? `${averageScore}%` : "—"}
                    </span>
                    {averageScore != null && (
                      <span className="text-[10px] font-mono font-semibold text-orange-600">
                        Avg
                      </span>
                    )}
                  </div>
                )}
                <p className="mt-1.5 text-[11px] font-medium text-slate-600">
                  {averageScore != null && averageScore >= 80
                    ? "Bar-raiser calibrated"
                    : "Mock score baseline"}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-xs">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Card 4: Disciplines Ready */}
          <Link href="/candidate/practice" className="block group">
            <div className="relative rounded-xl p-4 bg-gradient-to-br from-orange-50/50 via-white to-pink-50/50 border border-orange-200/70 shadow-xs group-hover:shadow-sm group-hover:border-orange-400 transition-all cursor-pointer h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider font-semibold text-orange-700">
                    Role Tracks
                  </p>
                  <p className="text-2xl sm:text-2xl font-bold text-slate-900 mt-1">
                    4 Tracks
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-600">
                    Tech, Sales, HR & Speech
                  </p>
                </div>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Featured Practice Tracks Section */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Recommended Practice Tracks
                </h2>
                <span className="text-[9px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  Bar-Raiser Curated
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dynamic voice mock rounds tailored to your specific engineering or leadership path.
              </p>
            </div>

            <Link
              href="/candidate/practice"
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-pink-600 transition-colors"
            >
              <span>Explore all practice blueprints</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {practiceJobsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : practiceJobs.length === 0 ? (
            <div className="rounded-2xl p-8 text-center bg-white border border-slate-200/90 shadow-xs space-y-2">
              <Layers className="mx-auto h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-800">
                Practice tracks loading
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Platform blueprints are syncing with the interview engine. Check back in a moment or visit the tracks directory.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {practiceJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl p-4.5 bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-orange-500/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {job.category?.replace(/_/g, " ").toLowerCase()}
                      </span>
                      {getDifficultyBadge(job.difficulty)}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                      {job.title}
                    </h3>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skill chips */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {job.requiredSkills?.slice(0, 3).map((skill: string) => (
                        <span
                          key={skill}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-orange-50/80 text-orange-700 border border-orange-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{job.estimatedDuration ?? 20} mins</span>
                    </div>

                    <Link href="/candidate/practice">
                      <Button
                        size="sm"
                        className="rounded-full px-3 py-1 h-7 text-[11px] font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xs inline-flex items-center gap-1"
                      >
                        <Play className="h-2.5 w-2.5 fill-current" />
                        <span>Practice</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Practice Scorecards & Evaluations */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-orange-500" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Recent Evaluation Scorecards
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review your mock interview audio recordings, AI breakdowns, and rubric strengths.
              </p>
            </div>

            <Link href="/candidate/practice">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-[11px] font-semibold h-7 border-slate-200 text-slate-700 hover:border-orange-300"
              >
                <span>Launch New Session</span>
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {historyLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center mx-auto">
                  <Award className="h-6 w-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    No Practice Interviews Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You have {remainingCredits} free practice credits ready. Select any blueprint above to speak with our AI interviewer and generate your first scorecard.
                  </p>
                </div>
                <Link href="/candidate/practice">
                  <Button className="rounded-full px-4 py-2 h-8 text-xs font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xs">
                    <Play className="h-3 w-3 mr-1.5 fill-current" />
                    <span>Start Your First AI Mock Interview</span>
                  </Button>
                </Link>
              </div>
            ) : (
              sessions.map((session: any) => {
                const evalData = session.scorecard || session.evaluation;
                const score = evalData?.overallScore ?? session.overallScore;
                const title =
                  session.job?.title ||
                  session.practiceJob?.title ||
                  "AI Mock Interview Session";
                const dateStr = session.createdAt
                  ? formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })
                  : "Recently";
                const resultsUrl = `/interview/${session.sessionToken || session.id}/results`;

                return (
                  <div
                    key={session.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-orange-500/10 to-pink-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span className="capitalize font-mono">
                            {session.status?.toLowerCase().replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-1.5 sm:pt-0">
                      {score != null && (
                        <div className="text-left sm:text-right px-1.5">
                          <div className="text-sm sm:text-base font-bold text-slate-900">
                            {Math.round(score)}%
                          </div>
                          <div className="text-[9px] font-mono uppercase text-slate-400">
                            Score
                          </div>
                        </div>
                      )}

                      {evalData?.overallRecommendation &&
                        getRecommendationBadge(evalData?.overallRecommendation)}

                      <Link href={resultsUrl}>
                        <Button
                          size="sm"
                          className="rounded-full px-3 py-1 h-7 text-[11px] font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xs inline-flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span>Scorecard</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Buy Credits Dialog */}
      <BuyCreditsDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} />
    </DashboardLayout>
  );
}
