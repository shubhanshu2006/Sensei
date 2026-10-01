"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useApplication,
  useUpdateApplicationStatus,
} from "@/lib/api/queries/applications";
import { useScheduleInterview } from "@/lib/api/queries/interviews";
import { useTriggerScreening } from "@/lib/api/queries/screening";
import { ApplicationStatus } from "@/types/application.types";
import { getApplicationStatusColor, getInitials, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function ApplicationDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const applicationId = routeParams.id as string;

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const { data: application, isLoading } = useApplication(applicationId);
  const updateStatusMutation = useUpdateApplicationStatus();
  const scheduleInterviewMutation = useScheduleInterview();
  const triggerScreeningMutation = useTriggerScreening();

  if (isLoading) {
    return (
      <DashboardLayout role="RECRUITER">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout role="RECRUITER">
        <div className="text-center py-12">
          <p className="text-slate-600">Application not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleUpdateStatus = async (status: ApplicationStatus) => {
    await updateStatusMutation.mutateAsync({ id: applicationId, status });
  };

  const handleScheduleInterview = async () => {
    if (!scheduledDate || !scheduledTime) return;
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    await scheduleInterviewMutation.mutateAsync({
      applicationId,
      scheduledAt: scheduledAt.toISOString(),
      message: inviteMessage || undefined,
    });
    setScheduleDialogOpen(false);
  };

  const handleTriggerScreening = async () => {
    await triggerScreeningMutation.mutateAsync(applicationId);
  };

  const candidate = application.candidate;
  const user = candidate?.user;
  const screeningReport = application.screeningReport;

  return (
    <DashboardLayout role="RECRUITER">
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
                Review candidate profile and AI screening results
              </p>
            </div>
            <Badge variant={getApplicationStatusColor(application.status)} className="text-sm">
              {application.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Candidate Info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Candidate Card */}
            <Card>
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    src={user?.avatar}
                    alt={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Candidate"}
                    fallback={getInitials(
                      user?.firstName,
                      user?.lastName,
                    )}
                    size="xl"
                  />
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">
                    {user?.firstName || "Unknown"} {user?.lastName || "Candidate"}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {candidate?.currentDesignation || candidate?.currentCompany || "Job Seeker"}
                  </p>
                </div>

                <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                  {user?.email && (
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <a
                        href={`mailto:${user.email}`}
                        className="hover:text-emerald-600 truncate"
                      >
                        {user.email}
                      </a>
                    </div>
                  )}
                  {candidate?.location && (
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{candidate.location}</span>
                    </div>
                  )}
                  {candidate?.experience !== undefined && (
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span>{candidate.experience} years experience</span>
                    </div>
                  )}
                  {application.appliedAt && (
                    <div className="flex items-center space-x-3 text-sm text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Applied {formatDate(application.appliedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Resume Download */}
                {application.resumeUrl && (
                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Download Resume
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="mb-4 font-semibold text-slate-900">Quick Actions</h3>
                <div className="space-y-2">
                  {/* Trigger screening if SUBMITTED */}
                  {application.status === ApplicationStatus.SUBMITTED && (
                    <Button
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleTriggerScreening}
                      disabled={triggerScreeningMutation.isPending}
                    >
                      {triggerScreeningMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Run AI Screening
                    </Button>
                  )}

                  {/* Actions for Screening Completed or Shortlisted */}
                  {(application.status === ApplicationStatus.SCREENING_COMPLETED ||
                    application.status === ApplicationStatus.SHORTLISTED) && (
                    <>
                      <Button
                        className="w-full gap-2"
                        onClick={() => setScheduleDialogOpen(true)}
                        disabled={scheduleInterviewMutation.isPending}
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule Interview
                      </Button>
                      {application.status !== ApplicationStatus.SHORTLISTED && (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => handleUpdateStatus(ApplicationStatus.SHORTLISTED)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Shortlist Candidate
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => handleUpdateStatus(ApplicationStatus.REJECTED)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}

                  {application.status === ApplicationStatus.INTERVIEW_INVITED && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      Interview invitation has been sent to candidate.
                    </p>
                  )}

                  {application.status === ApplicationStatus.INTERVIEW_SCHEDULED && (
                    <p className="text-xs text-emerald-600 font-medium text-center py-2">
                      Interview is scheduled.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Screening Results */}
          <div className="space-y-6 lg:col-span-2">
            {/* AI Screening Score */}
            {screeningReport?.overallMatchScore !== undefined && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        AI Screening Match
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600">
                        {Math.round(screeningReport.overallMatchScore)}%
                      </div>
                      <p className="text-sm text-slate-600">Overall Match Score</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Screening Report */}
            {screeningReport ? (
              <>
                {/* Recommendation */}
                <Card>
                  <div className="p-6">
                    <h3 className="mb-4 font-semibold text-slate-900">
                      AI Screening Assessment
                    </h3>
                    <div
                      className={`rounded-xl p-4 ${
                        screeningReport.decision === "STRONG_MATCH"
                          ? "bg-emerald-50 border border-emerald-200"
                          : screeningReport.decision === "MODERATE_MATCH"
                            ? "bg-amber-50 border border-amber-200"
                            : "bg-rose-50 border border-rose-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {screeningReport.decision === "STRONG_MATCH" && (
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        )}
                        {screeningReport.decision === "MODERATE_MATCH" && (
                          <Clock className="h-6 w-6 text-amber-600" />
                        )}
                        {(screeningReport.decision === "WEAK_MATCH" ||
                          screeningReport.decision === "NOT_SUITABLE") && (
                          <XCircle className="h-6 w-6 text-rose-600" />
                        )}
                        <span
                          className={`text-lg font-semibold ${
                            screeningReport.decision === "STRONG_MATCH"
                              ? "text-emerald-700"
                              : screeningReport.decision === "MODERATE_MATCH"
                                ? "text-amber-700"
                                : "text-rose-700"
                          }`}
                        >
                          {screeningReport.decision?.replace(/_/g, " ") || "SCREENING COMPLETED"}
                        </span>
                      </div>
                      {screeningReport.feedbackSummary && (
                        <p className="mt-3 text-sm text-slate-700">
                          {screeningReport.feedbackSummary}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Score Breakdown */}
                {(screeningReport.skillsScore !== undefined ||
                  screeningReport.experienceScore !== undefined) && (
                  <Card>
                    <div className="p-6">
                      <h3 className="mb-4 font-semibold text-slate-900">
                        Score Breakdown
                      </h3>
                      <div className="space-y-4">
                        {screeningReport.skillsScore !== undefined && (
                          <ScoreBar
                            label="Skills Match"
                            score={Math.round(screeningReport.skillsScore)}
                          />
                        )}
                        {screeningReport.experienceScore !== undefined && (
                          <ScoreBar
                            label="Experience Match"
                            score={Math.round(screeningReport.experienceScore)}
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* Strengths & Concerns */}
                {((screeningReport.strengths && screeningReport.strengths.length > 0) ||
                  (screeningReport.concerns && screeningReport.concerns.length > 0)) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {screeningReport.strengths && screeningReport.strengths.length > 0 && (
                      <Card>
                        <div className="p-6">
                          <h3 className="mb-4 flex items-center space-x-2 font-semibold text-slate-900">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <span>Strengths</span>
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
                            <XCircle className="h-5 w-5 text-amber-600" />
                            <span>Concerns</span>
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
                )}

                {/* Suggestions */}
                {screeningReport.suggestions && screeningReport.suggestions.length > 0 && (
                  <Card>
                    <div className="p-6">
                      <h3 className="mb-4 font-semibold text-slate-900">
                        Interview Focus Areas
                      </h3>
                      <ul className="space-y-2">
                        {screeningReport.suggestions.map((suggestion: string, i: number) => (
                          <li key={i} className="flex items-start space-x-2 text-sm">
                            <TrendingUp className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-slate-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <div className="p-12 text-center">
                  <Sparkles className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    No AI Screening Report Available Yet
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Trigger AI screening to automatically analyze the candidate resume against the job description.
                  </p>
                </div>
              </Card>
            )}

            {/* Cover Letter */}
            {application.coverLetter && (
              <Card>
                <div className="p-6">
                  <h3 className="mb-4 flex items-center space-x-2 font-semibold text-slate-900">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <span>Cover Letter</span>
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">
                    {application.coverLetter}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Interview Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Schedule AI Interview
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Set the date and time to invite {user?.firstName || "the candidate"} for an automated AI technical interview.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date *
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Time *
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Message (Optional)
              </label>
              <Textarea
                rows={4}
                placeholder="Add instructions or a note for the candidate..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="ghost" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleInterview}
              disabled={!scheduledDate || !scheduledTime || scheduleInterviewMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {scheduleInterviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Send AI Interview Invitation
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
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
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}
