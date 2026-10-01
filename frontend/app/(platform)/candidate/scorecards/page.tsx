"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCandidateInterviewHistory } from "@/lib/api/queries/candidates";
import {
  Award,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Play,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function CandidateScorecardsPage() {
  const [selectedJobForModal, setSelectedJobForModal] = useState<any | null>(null);
  const { data: historyData, isLoading } = useCandidateInterviewHistory(1, 50);

  const sessions = historyData?.sessions || historyData?.data || [];

  // Scored sessions count & average
  const scoredSessions = sessions.filter(
    (s: any) =>
      s.scorecard?.overallScore != null ||
      s.evaluation?.overallScore != null ||
      s.overallScore != null
  );

  const averageScore =
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

  const passedCount = scoredSessions.filter(
    (s: any) =>
      (s.scorecard?.overallScore ?? s.overallScore ?? 0) >= 75 ||
      s.scorecard?.overallRecommendation === "STRONG_YES" ||
      s.scorecard?.overallRecommendation === "YES"
  ).length;

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-8 pb-16 font-sans max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-mono font-semibold text-orange-600 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span>Performance Analytics &amp; Reports</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Interview Scorecards
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Review dimensional evaluation rubrics, resume alignments, and spoken transcripts from your practice loops.
            </p>
          </div>

          <Link href="/candidate/practice">
            <Button className="rounded-full px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md shadow-orange-500/20 transition-all">
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              <span>Practice New Round</span>
            </Button>
          </Link>
        </div>

        {/* Telemetry Overview */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                Completed Loops
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {sessions.length}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Full sessions evaluated</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shadow-xs">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                Performance Index
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {averageScore != null ? `${averageScore}%` : "—"}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Average across all tracks</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-500">
                Target Offers Cleared
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {passedCount} <span className="text-xs font-normal text-slate-400">/ {scoredSessions.length}</span>
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">Above 75% bar-raiser mark</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center shadow-xs">
              <Award className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Evaluation History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any scorecard to inspect rubrics or preview the complete job description.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center mx-auto">
                  <Award className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    No Scorecards Generated Yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Complete your first AI mock interview to generate an instant dimensional evaluation scorecard and speech breakdown.
                  </p>
                </div>
                <Link href="/candidate/practice">
                  <Button className="rounded-full px-6 py-2.5 font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20">
                    <Play className="h-4 w-4 mr-2 fill-current" />
                    <span>Start Practice Session</span>
                  </Button>
                </Link>
              </div>
            ) : (
              sessions.map((session: any) => {
                const evalData = session.scorecard || session.evaluation;
                const score = evalData?.overallScore ?? session.overallScore;
                const job = session.practiceJob || session.application?.job;
                const title = job?.title || "AI Mock Interview Session";
                const dateStr = session.createdAt
                  ? formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })
                  : "Recently";
                const resultsUrl = `/interview/${session.sessionToken || session.id}/results`;

                return (
                  <div
                    key={session.id}
                    className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start space-x-4 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-pink-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Award className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-slate-900 hover:text-orange-600 transition-colors truncate">
                            {title}
                          </h3>

                          {job?.category && (
                            <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {job.category.replace(/_/g, " ")}
                            </span>
                          )}

                          {job?.difficulty && (
                            <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                              {job.difficulty}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {dateStr}
                          </span>
                          <span>•</span>
                          <span className="capitalize font-mono">
                            {session.status?.toLowerCase().replace(/_/g, " ")}
                          </span>

                          {job?.description && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setSelectedJobForModal(job)}
                                className="text-orange-600 hover:text-pink-600 font-semibold underline underline-offset-2 flex items-center gap-1"
                              >
                                View Job Description
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0">
                      {score != null ? (
                        <div className="text-left md:text-right px-3">
                          <div className="text-2xl font-bold text-slate-900">
                            {Math.round(score)}%
                          </div>
                          <div className="text-[10px] font-mono uppercase text-slate-400">
                            {score >= 75 ? "Cleared" : "Evaluated"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-400 italic px-3">
                          Evaluation Pending
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {job && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedJobForModal(job)}
                            className="rounded-full text-xs font-semibold border-slate-200 text-slate-700 hover:border-orange-300"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            <span>Job Blueprint</span>
                          </Button>
                        )}

                        <Link href={resultsUrl}>
                          <Button
                            size="sm"
                            className="rounded-full px-4 text-xs font-medium bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-xs inline-flex items-center gap-1.5"
                          >
                            <span>Open Scorecard</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Complete Job Description Modal */}
      <Dialog open={!!selectedJobForModal} onOpenChange={(open) => !open && setSelectedJobForModal(null)}>
        {selectedJobForModal && (
          <DialogContent className="max-w-2xl p-6 sm:p-7 bg-white text-slate-900 border border-slate-200 rounded-3xl font-sans shadow-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  {selectedJobForModal.category || "Role Blueprint"}
                </span>
                {selectedJobForModal.difficulty && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                    {selectedJobForModal.difficulty}
                  </span>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {selectedJobForModal.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Comprehensive role description and bar-raiser assessment requirements.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-sm text-slate-700">
              {/* Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                  Role Overview
                </h4>
                <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                  {selectedJobForModal.description || "No description provided for this blueprint."}
                </p>
              </div>

              {/* Responsibilities if available */}
              {selectedJobForModal.responsibilities && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                    Key Responsibilities
                  </h4>
                  <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {selectedJobForModal.responsibilities}
                  </p>
                </div>
              )}

              {/* Requirements if available */}
              {selectedJobForModal.requirements && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                    Requirements &amp; Qualifications
                  </h4>
                  <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {selectedJobForModal.requirements}
                  </p>
                </div>
              )}

              {/* Skills */}
              {selectedJobForModal.requiredSkills && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 font-mono">
                    Required Core Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(Array.isArray(selectedJobForModal.requiredSkills)
                      ? selectedJobForModal.requiredSkills
                      : []
                    ).map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-mono font-medium text-orange-700 border border-orange-200"
                      >
                        {skill}
                      </span>
                    ))}
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
