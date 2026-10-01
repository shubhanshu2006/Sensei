"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplication } from "@/lib/api/queries/applications";
import { ApplicationStatus } from "@/types/application.types";
import { getApplicationStatusColor, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function CandidateApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: application, isLoading } = useApplication(params.id);

  if (isLoading) {
    return (
      <DashboardLayout role="CANDIDATE">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout role="CANDIDATE">
        <div className="text-center py-12">
          <p className="text-slate-600">Application not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const screeningReport = application.screeningReport;

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-slate-900">
                Application Details
              </h1>
              <p className="mt-1 text-slate-600">
                Track your application progress and view feedback
              </p>
            </div>
            <Badge
              variant={getApplicationStatusColor(application.status)}
              className="text-sm"
            >
              {application.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Job Info */}
            <Card>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-orange-100">
                    <Briefcase className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {application.job.title}
                    </h2>
                    <p className="mt-1 text-lg font-medium text-slate-700">
                      {application.job.companyName}
                    </p>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>Applied {formatDate(application.appliedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/candidate/jobs/${application.jobId}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      View Job
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* AI Screening Score */}
            {application.screeningScore !== undefined && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        AI Screening Score
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-emerald-600">
                        {application.screeningScore}%
                      </div>
                      <p className="text-sm text-slate-600">Match Score</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Screening Report */}
            {screeningReport && (
              <>
                {/* Recommendation */}
                <Card>
                  <div className="p-6">
                    <h3 className="mb-4 font-semibold text-slate-900">
                      AI Assessment
                    </h3>
                    <div
                      className={`rounded-xl p-4 ${
                        screeningReport.recommendation === "STRONG_YES" ||
                        screeningReport.recommendation === "YES"
                          ? "bg-emerald-50 border border-emerald-200"
                          : screeningReport.recommendation === "MAYBE"
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-rose-50 border border-rose-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {(screeningReport.recommendation === "STRONG_YES" ||
                          screeningReport.recommendation === "YES") && (
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        )}
                        {(screeningReport.recommendation === "NO" ||
                          screeningReport.recommendation === "STRONG_NO") && (
                          <XCircle className="h-6 w-6 text-rose-600" />
                        )}
                        <span
                          className={`text-lg font-semibold ${
                            screeningReport.recommendation === "STRONG_YES" ||
                            screeningReport.recommendation === "YES"
                              ? "text-emerald-700"
                              : screeningReport.recommendation === "MAYBE"
                                ? "text-amber-700"
                                : "text-rose-700"
                          }`}
                        >
                          {screeningReport.recommendation.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700">
                        {screeningReport.summary}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Score Breakdown */}
                <Card>
                  <div className="p-6">
                    <h3 className="mb-4 font-semibold text-slate-900">
                      Score Breakdown
                    </h3>
                    <div className="space-y-4">
                      <ScoreBar
                        label="Skills Match"
                        score={screeningReport.skillsMatch}
                      />
                      <ScoreBar
                        label="Experience Match"
                        score={screeningReport.experienceMatch}
                      />
                      <ScoreBar
                        label="Culture Fit"
                        score={screeningReport.cultureFit}
                      />
                    </div>
                  </div>
                </Card>

                {/* Strengths & Areas to Improve */}
                <div className="grid gap-6 md:grid-cols-2">
                  {screeningReport.strengths && screeningReport.strengths.length > 0 && (
                    <Card>
                      <div className="p-6">
                        <h3 className="mb-4 flex items-center space-x-2 font-semibold text-slate-900">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <span>Your Strengths</span>
                        </h3>
                        <ul className="space-y-2">
                          {screeningReport.strengths.map((strength: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2 text-sm">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              <span className="text-slate-700">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}

                  {screeningReport.concerns && screeningReport.concerns.length > 0 && (
                    <Card>
                      <div className="p-6">
                        <h3 className="mb-4 flex items-center space-x-2 font-semibold text-slate-900">
                          <TrendingUp className="h-5 w-5 text-amber-600" />
                          <span>Areas to Improve</span>
                        </h3>
                        <ul className="space-y-2">
                          {screeningReport.concerns.map((concern: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2 text-sm">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-600" />
                              <span className="text-slate-700">{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Interview Suggestions */}
                {screeningReport.suggestions && screeningReport.suggestions.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h3 className="mb-4 font-semibold text-slate-900">
                        Tips for Your Interview
                      </h3>
                      <ul className="space-y-2">
                        {screeningReport.suggestions.map((suggestion: string, i: number) => (
                          <li key={i} className="flex items-start space-x-2 text-sm">
                            <Sparkles className="mt-0.5 h-4 w-4 text-emerald-600" />
                            <span className="text-slate-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Cover Letter */}
            {application.coverLetter && (
              <Card>
                <div className="p-6">
                  <h3 className="mb-4 flex items-center space-x-2 font-semibold text-slate-900">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <span>Your Cover Letter</span>
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {application.coverLetter}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Timeline */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-slate-900">
                  Application Timeline
                </h3>
                <div className="mt-4 space-y-4">
                  <TimelineItem
                    label="Applied"
                    date={formatDate(application.appliedAt)}
                    completed
                  />
                  <TimelineItem
                    label="Screening"
                    date={
                      application.status !== ApplicationStatus.SUBMITTED
                        ? "Completed"
                        : "Pending"
                    }
                    completed={application.status !== ApplicationStatus.SUBMITTED}
                  />
                  <TimelineItem
                    label="Shortlisted"
                    date={
                      application.status === ApplicationStatus.SHORTLISTED ||
                      application.status === ApplicationStatus.INTERVIEW_INVITED ||
                      application.status === ApplicationStatus.INTERVIEW_SCHEDULED ||
                      application.status === ApplicationStatus.INTERVIEW_COMPLETED
                        ? "Yes"
                        : "Pending"
                    }
                    completed={
                      application.status === ApplicationStatus.SHORTLISTED ||
                      application.status === ApplicationStatus.INTERVIEW_INVITED ||
                      application.status === ApplicationStatus.INTERVIEW_SCHEDULED ||
                      application.status === ApplicationStatus.INTERVIEW_COMPLETED
                    }
                  />
                  <TimelineItem
                    label="Interview"
                    date={
                      application.status === ApplicationStatus.INTERVIEW_SCHEDULED
                        ? "Scheduled"
                        : application.status === ApplicationStatus.INTERVIEW_COMPLETED
                          ? "Completed"
                          : "Pending"
                    }
                    completed={
                      application.status === ApplicationStatus.INTERVIEW_COMPLETED
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Resume */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-slate-900">Your Resume</h3>
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block"
                >
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    View Resume
                  </Button>
                </a>
              </div>
            </Card>

            {/* Next Steps */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-slate-900">Next Steps</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {application.status === ApplicationStatus.SUBMITTED && (
                    <p className="text-slate-600">
                      Your application is submitted. You'll be notified once
                      screening begins.
                    </p>
                  )}
                  {application.status === ApplicationStatus.SCREENING_IN_PROGRESS && (
                    <p className="text-slate-600">
                      AI is analyzing your resume. This usually takes a few moments.
                    </p>
                  )}
                  {application.status === ApplicationStatus.SCREENING_COMPLETED && (
                    <p className="text-slate-600">
                      Screening complete! The hiring team is evaluating your results.
                    </p>
                  )}
                  {application.status === ApplicationStatus.SHORTLISTED && (
                    <p className="text-slate-600">
                      Congratulations! You've been shortlisted. Expect an interview invitation soon.
                    </p>
                  )}
                  {application.status === ApplicationStatus.INTERVIEW_INVITED && (
                    <p className="text-emerald-600 font-medium">
                      You've been invited for an AI interview! Check the invitation or start when ready.
                    </p>
                  )}
                  {application.status === ApplicationStatus.INTERVIEW_SCHEDULED && (
                    <p className="text-slate-600">
                      Interview scheduled! Prepare well and test your microphone and camera before starting.
                    </p>
                  )}
                  {application.status === ApplicationStatus.INTERVIEW_COMPLETED && (
                    <p className="text-slate-600">
                      Interview completed. Your scorecards and transcripts have been generated.
                    </p>
                  )}
                  {application.status === ApplicationStatus.REJECTED && (
                    <p className="text-slate-600">
                      This application wasn't selected for further rounds. Keep practicing and applying!
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Timeline Item Component
function TimelineItem({
  label,
  date,
  completed,
}: {
  label: string;
  date: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
          completed ? "bg-emerald-600" : "bg-slate-200"
        }`}
      >
        {completed && <CheckCircle className="h-4 w-4 text-white" />}
      </div>
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            completed ? "text-slate-900" : "text-slate-500"
          }`}
        >
          {label}
        </p>
        <p className="text-xs text-slate-500">{date}</p>
      </div>
    </div>
  );
}

// Score Bar Component
function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-emerald-600">{score}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
