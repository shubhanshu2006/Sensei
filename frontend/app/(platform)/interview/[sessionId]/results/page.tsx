"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  MessageSquare,
  FileText,
  ArrowLeft,
  Sparkles,
  Zap,
  Award,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { useInterviewResults } from "@/lib/api/queries/interviews";

export default function InterviewResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const { data: session, isLoading } = useInterviewResults(sessionId);

  if (isLoading) {
    return (
      <DashboardLayout role="CANDIDATE">
        <div className="space-y-6 pb-12 font-sans max-w-6xl">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <div className="grid gap-5 sm:grid-cols-3">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  const scorecard = session?.scorecard;
  const resumeFeedback = session?.resumeFeedback;
  const transcript = session?.transcript;
  const job = session?.practiceJob || session?.application?.job;
  const jobTitle = job?.title || "AI Practice Blueprint";
  const overallScore = scorecard?.overallScore ?? 0;
  const qaData = (transcript?.qaData as any[]) || [];
  // Required skills that no answered question covered (only computable when questions carry a topic).
  const requiredSkills: string[] = Array.isArray((job as any)?.requiredSkills)
    ? ((job as any).requiredSkills as string[])
    : [];
  const answeredTopics = new Set(
    qaData
      .filter((qa) => qa.topic && (qa.answer || "").trim().length > 5)
      .map((qa) => String(qa.topic).toLowerCase()),
  );
  const unassessedSkills: string[] = qaData.some((qa) => qa.topic)
    ? requiredSkills.filter((s) => !answeredTopics.has(s.toLowerCase()))
    : [];
  const jdMatch = (resumeFeedback?.resumeOptimization as any) || null;
  const matchedRequirements: string[] = Array.isArray(jdMatch?.matchedRequirements)
    ? jdMatch.matchedRequirements
    : [];
  const unmetRequirements: string[] = Array.isArray(jdMatch?.unmetRequirements)
    ? jdMatch.unmetRequirements
    : [];

  const isEvaluating = !scorecard || session?.isEvaluating;

  // Extract short verdict cleanly
  const getShortVerdict = () => {
    const rawRec = (scorecard?.overallRecommendation as string) || "";
    if (rawRec === "STRONG_YES") {
      return { label: "Strong Hire", status: "success" };
    }
    if (rawRec === "YES") {
      return { label: "Hire Ready", status: "success" };
    }
    if (rawRec === "CONSIDER") {
      return { label: "Consider", status: "warning" };
    }
    if (rawRec === "NO") {
      return { label: "Needs Practice", status: "danger" };
    }

    // If recommendation is a sentence/paragraph, derive concise verdict from the score
    if (overallScore >= 80) return { label: "Strong Hire", status: "success" };
    if (overallScore >= 65) return { label: "Hire Ready", status: "success" };
    if (overallScore >= 50) return { label: "Consider", status: "warning" };
    return { label: "Needs Practice", status: "danger" };
  };

  const verdict = getShortVerdict();

  // If detailed feedback or recommendation is long paragraph text, display it in the synthesis box
  const rawRecommendation = (scorecard?.overallRecommendation as string) || "";
  const detailedFeedback = (scorecard?.detailedFeedback as string) || "";
  const evaluationSynthesis =
    detailedFeedback || (rawRecommendation.length > 20 ? rawRecommendation : null);

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-8 pb-16 font-sans max-w-6xl">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/candidate/scorecards"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to All Scorecards</span>
            </Link>

            <Link href="/candidate/practice">
              <Button
                size="sm"
                className="rounded-full px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md shadow-orange-500/20 transition-all"
              >
                <span>Practice Another Blueprint</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Interactive Role Card - Click to view full job description */}
          <div
            onClick={() => setIsJobModalOpen(true)}
            className="group rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-orange-400 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-mono font-semibold text-orange-600">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                  <span>Dimensional Scorecard Report</span>
                </span>

                {job?.category && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {job.category.replace(/_/g, " ")}
                  </span>
                )}

                {job?.difficulty && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                    {job.difficulty}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                {jobTitle}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
                <span>Evaluation calibrated against actual bar-raiser rubrics.</span>
                <span className="text-orange-600 font-semibold group-hover:underline underline-offset-2">
                  Click to inspect full job description &amp; requirements &rarr;
                </span>
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsJobModalOpen(true);
              }}
              className="rounded-full text-xs font-semibold border-slate-200 text-slate-700 group-hover:border-orange-300 group-hover:bg-orange-50/50 shrink-0"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
              <span>View Job Description</span>
              <ExternalLink className="h-3 w-3 ml-1 text-slate-400" />
            </Button>
          </div>
        </div>

        {/* Evaluation In Progress Banner */}
        {isEvaluating ? (
          <div className="relative rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-white via-orange-50/20 to-pink-50/15 text-slate-900 border border-slate-200/90 shadow-sm overflow-hidden text-center space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 text-orange-600">
                <Sparkles className="h-8 w-8 animate-pulse text-orange-500" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-r from-orange-500 to-pink-500" />
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Dimensional AI Evaluation In Progress...
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Our bar-raiser model is analyzing your spoken responses, extracting algorithmic depth, communication clarity, and problem-solving speed.
                </p>
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">Audio Captured</p>
                    <p className="text-[11px] text-slate-500">{qaData.length} answers logged</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-300 bg-orange-50/60 p-3.5 flex items-start gap-2.5 animate-pulse">
                  <Clock className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-orange-800">Scoring Rubrics</p>
                    <p className="text-[11px] text-orange-600">Benchmarking tiers...</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
                  <Zap className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Drafting Rubric</p>
                    <p className="text-[11px] text-slate-500">Strengths &amp; weaknesses</p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] font-mono text-slate-500 pt-1">
                This report updates automatically once evaluation finishes.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 Bento Metric Cards - Symmetrical & Balanced */}
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Card 1: Overall Performance Score */}
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden h-44">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                      Overall Score
                    </p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl sm:text-5xl font-bold text-slate-900">
                        {Math.round(overallScore)}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">/100</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Threshold: 75/100</span>
                  <span className={`font-mono font-semibold ${overallScore >= 75 ? "text-orange-600" : "text-slate-500"}`}>
                    {overallScore >= 75 ? "Bar-Raiser Cleared" : "Needs Development"}
                  </span>
                </div>
              </div>

              {/* Card 2: Hiring Loop Verdict (Clean concise pill) */}
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between h-44">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                      Hiring Loop Verdict
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 truncate">
                      {verdict.label}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shadow-xs">
                    <Award className="h-6 w-6" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>Rubric Standard</span>
                  <span className="font-mono text-slate-700 font-medium">Dimensional</span>
                </div>
              </div>

              {/* Card 3: Rounds Logged */}
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between h-44">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                      Rounds Logged
                    </p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl sm:text-5xl font-bold text-slate-900">
                        {session?.questionsAnswered || qaData.length}
                      </span>
                      <span className="text-sm text-slate-400 font-medium">questions</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center shadow-xs">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span>Audio &amp; Transcripts</span>
                  <span className="font-mono text-emerald-600 font-semibold">Indexed</span>
                </div>
              </div>
            </div>

            {/* Executive AI Interviewer Synthesis Box - Formatted reading container */}
            {evaluationSynthesis && (
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="h-8 w-8 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Executive AI Evaluation &amp; Recommendation Synthesis
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Comprehensive summary generated across algorithmic problem-solving, verbal articulation, and resume baseline.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-5 border border-slate-200/70">
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {evaluationSynthesis}
                  </p>
                </div>
              </div>
            )}

            {/* Score Dimensions Breakdown */}
            {scorecard && (
              <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Dimensional Competency Breakdown
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Target metrics evaluating architectural thinking, verbal cadence, and problem agility.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { key: "technicalScore", fallback: "Technical Depth", score: (scorecard.technicalScore as any)?.score ?? 0, desc: (scorecard.technicalScore as any)?.reasoning },
                    { key: "communicationScore", fallback: "Communication Clarity", score: (scorecard.communicationScore as any)?.score ?? 0, desc: (scorecard.communicationScore as any)?.reasoning },
                    { key: "problemSolvingScore", fallback: "Problem Solving Speed", score: (scorecard.problemSolvingScore as any)?.score ?? 0, desc: (scorecard.problemSolvingScore as any)?.reasoning },
                    { key: "confidenceScore", fallback: "Executive Presence", score: (scorecard.confidenceScore as any)?.score ?? 0, desc: (scorecard.confidenceScore as any)?.reasoning },
                  ].map((dim, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200/90 p-5 bg-slate-50/50 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-800">{dim.fallback}</p>
                          <span className="font-mono text-xs font-bold text-orange-600">{dim.score}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                      </div>

                      {dim.desc && (
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                          {dim.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses 2-Column Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-orange-600 pb-2 border-b border-slate-100">
                  <CheckCircle2 className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-slate-900">Key Strengths Demonstrated</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {((scorecard?.strengths as string[]) || []).map((s: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-pink-600 pb-2 border-b border-slate-100">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-slate-900">Calibration &amp; Weaknesses</h3>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {((scorecard?.weaknesses as string[]) || []).map((w: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-pink-500 mt-2 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {unassessedSkills.length > 0 && (
              <div className="rounded-3xl p-6 sm:p-7 bg-amber-50/70 border border-amber-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-600 pb-2 border-b border-amber-100">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-slate-900">Not Assessed in This Interview</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  No question covered these skills from the job description, so your score says nothing about them:
                </p>
                <div className="flex flex-wrap gap-2">
                  {unassessedSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full bg-white text-amber-700 border border-amber-200 text-xs font-mono font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Optimization Suggestions */}
            {resumeFeedback && (
              <div className="rounded-3xl p-6 sm:p-7 bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-orange-500 pb-2 border-b border-slate-100">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-slate-900">Resume &amp; Application Optimization</h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  {typeof jdMatch?.jdMatchScore === "number" && (
                    <div className="rounded-2xl bg-orange-50/60 border border-orange-100 p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800">
                            Resume match for {jobTitle}
                          </p>
                          <span className="font-mono text-sm font-bold text-orange-600">
                            {jdMatch.jdMatchScore}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-orange-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{ width: `${Math.min(100, Math.max(0, jdMatch.jdMatchScore))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          How well your resume, as written, covers this job description&apos;s requirements.
                        </p>
                      </div>

                      {matchedRequirements.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-800">Requirements your resume shows:</p>
                          <ul className="space-y-1.5 text-slate-600">
                            {matchedRequirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {unmetRequirements.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-800">Requirements not evidenced in your resume:</p>
                          <ul className="space-y-1.5 text-slate-600">
                            {unmetRequirements.map((req, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {resumeFeedback.missingSkills && (
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">Keywords &amp; Skills to Add to Resume:</p>
                      <div className="flex flex-wrap gap-2">
                        {((resumeFeedback.missingSkills as string[]) || []).map((skill: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-mono font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {resumeFeedback.improvementSuggestions && (
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-800">Actionable Suggestions:</p>
                      <ul className="space-y-2 text-slate-600">
                        {((resumeFeedback.improvementSuggestions as string[]) || []).map((sugg: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold">•</span>
                            <span>{sugg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Transcript QA Log */}
        {qaData.length > 0 && (
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">
                Verbal Dialogue Log &amp; Question Responses
              </h3>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {qaData.map((qa, index) => (
                <div key={index} className="pt-4 first:pt-0 space-y-2.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-900">
                    Q{index + 1}: {qa.question}
                    {qa.isFollowUp && (
                      <span className="ml-2 align-middle px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200 text-[10px] font-mono font-semibold uppercase">
                        Cross-question
                      </span>
                    )}
                  </p>
                  <div className="rounded-2xl bg-slate-50 p-4 text-xs sm:text-sm text-slate-700 border border-slate-200/80">
                    <p className="font-mono text-[10px] uppercase font-bold text-slate-400 mb-1">
                      Your Spoken Response:
                    </p>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {qa.answer ||
                        (qa.answered === true || qa.isVoiceMode !== undefined
                          ? "(No verbal answer recorded)"
                          : "(Interview ended before this question was answered — not scored)")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Complete Job Description Modal */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        {job && (
          <DialogContent className="max-w-2xl p-6 sm:p-7 bg-white text-slate-900 border border-slate-200 rounded-3xl font-sans shadow-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {job.category && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    {job.category.replace(/_/g, " ")}
                  </span>
                )}
                {job.difficulty && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                    {job.difficulty}
                  </span>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {job.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Full blueprint specifications, expectations, and evaluation criteria.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-sm text-slate-700">
              {/* Role Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                  Role Overview
                </h4>
                <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {job.description || "No full description provided for this blueprint."}
                </p>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                    Key Responsibilities
                  </h4>
                  <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {job.responsibilities}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                    Target Qualifications &amp; Background
                  </h4>
                  <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {job.requirements}
                  </p>
                </div>
              )}

              {/* Required Core Skills */}
              {job.requiredSkills && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                    Target Core Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(Array.isArray(job.requiredSkills) ? job.requiredSkills : []).map(
                      (skill: string) => (
                        <span
                          key={skill}
                          className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-mono font-medium text-orange-700 border border-orange-200"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
