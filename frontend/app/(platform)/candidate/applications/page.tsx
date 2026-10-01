"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import {
  useCandidateApplications,
  useWithdrawApplication,
} from "@/lib/api/queries/applications";
import { ApplicationStatus } from "@/types/application.types";
import { getApplicationStatusColor } from "@/lib/utils";
import {
  Search,
  Briefcase,
  Calendar,
  Eye,
  Trash2,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function CandidateApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<string | null>(null);

  // Fetch applications
  const { data, isLoading } = useCandidateApplications({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const withdrawMutation = useWithdrawApplication();
  const applications = data?.applications || [];

  const handleWithdraw = async () => {
    if (!applicationToWithdraw) return;
    await withdrawMutation.mutateAsync(applicationToWithdraw);
    setWithdrawDialogOpen(false);
    setApplicationToWithdraw(null);
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.SHORTLISTED:
        return <CheckCircle className="h-5 w-5 text-emerald-600" />;
      case ApplicationStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-rose-600" />;
      case ApplicationStatus.INTERVIEW_SCHEDULED:
      case ApplicationStatus.INTERVIEW_INVITED:
        return <Calendar className="h-5 w-5 text-amber-600" />;
      case ApplicationStatus.SCREENING_IN_PROGRESS:
      case ApplicationStatus.SCREENING_COMPLETED:
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <Briefcase className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            My Applications
          </h1>
          <p className="mt-1 text-slate-600">
            Track and manage all your job applications
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="p-4">
            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by job title or company..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(value as ApplicationStatus | "")
                }
                options={[
                  { value: "", label: "All Status" },
                  { value: ApplicationStatus.SUBMITTED, label: "Submitted" },
                  { value: ApplicationStatus.SCREENING_IN_PROGRESS, label: "Screening In Progress" },
                  { value: ApplicationStatus.SCREENING_COMPLETED, label: "Screening Completed" },
                  { value: ApplicationStatus.SHORTLISTED, label: "Shortlisted" },
                  { value: ApplicationStatus.INTERVIEW_INVITED, label: "Interview Invited" },
                  { value: ApplicationStatus.INTERVIEW_SCHEDULED, label: "Interview Scheduled" },
                  { value: ApplicationStatus.INTERVIEW_COMPLETED, label: "Interview Completed" },
                  { value: ApplicationStatus.REJECTED, label: "Rejected" },
                  { value: ApplicationStatus.WITHDRAWN, label: "Withdrawn" },
                ]}
                className="w-full md:w-56"
              />

              {/* Clear Filters */}
              {(searchQuery || statusFilter) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Applications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No applications found
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {searchQuery || statusFilter
                  ? "Try adjusting your filters"
                  : "You haven't applied to any jobs yet"}
              </p>
              {!searchQuery && !statusFilter && (
                <Link href="/candidate/jobs">
                  <Button className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Search className="h-4 w-4" />
                    Browse Jobs
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const screening = application.screeningReport;
              const jobTitle = application.job?.title || "Job Application";
              const companyName = application.job?.companyName || "Sensei Partner";

              return (
                <Card
                  key={application.id}
                  className="group transition-all duration-200 hover:shadow-lg"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Left: Job Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Status Icon */}
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-orange-100">
                          {getStatusIcon(application.status)}
                        </div>

                        <div className="flex-1">
                          <Link
                            href={`/candidate/applications/${application.id}`}
                            className="group/link"
                          >
                            <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover/link:text-emerald-600">
                              {jobTitle}
                            </h3>
                          </Link>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {companyName}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>
                                Applied{" "}
                                {application.appliedAt
                                  ? formatDistanceToNow(
                                      new Date(application.appliedAt),
                                      { addSuffix: true },
                                    )
                                  : "recently"}
                              </span>
                            </div>
                          </div>

                          {/* AI Score */}
                          {screening?.overallMatchScore !== undefined && (
                            <div className="mt-4 inline-flex items-center space-x-2 rounded-lg bg-slate-50 px-3 py-2">
                              <TrendingUp
                                className={`h-4 w-4 ${
                                  screening.overallMatchScore >= 80
                                    ? "text-emerald-600"
                                    : screening.overallMatchScore >= 60
                                      ? "text-amber-600"
                                      : "text-rose-600"
                                }`}
                              />
                              <span className="text-sm font-semibold text-slate-700">
                                AI Score: {Math.round(screening.overallMatchScore)}%
                              </span>
                            </div>
                          )}

                          {/* Screening Report Preview */}
                          {screening && (
                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-slate-700">
                                AI Assessment:{" "}
                                <span
                                  className={
                                    screening.decision === "STRONG_MATCH"
                                      ? "text-emerald-600"
                                      : screening.decision === "MODERATE_MATCH"
                                        ? "text-amber-600"
                                        : "text-rose-600"
                                  }
                                >
                                  {screening.decision?.replace(/_/g, " ") || "COMPLETED"}
                                </span>
                              </p>
                              {screening.feedbackSummary && (
                                <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                                  {screening.feedbackSummary}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex flex-col items-end space-y-3 ml-4">
                        <Badge variant={getApplicationStatusColor(application.status)}>
                          {application.status.replace(/_/g, " ")}
                        </Badge>

                        <div className="flex space-x-2">
                          <Link href={`/candidate/applications/${application.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          {(application.status === ApplicationStatus.SUBMITTED ||
                            application.status === ApplicationStatus.SCREENING_IN_PROGRESS) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-rose-600 opacity-0 transition-opacity hover:bg-rose-50 group-hover:opacity-100"
                              onClick={() => {
                                setApplicationToWithdraw(application.id);
                                setWithdrawDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Withdraw
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <div className="p-6">
          <div className="flex items-center space-x-3 text-rose-600">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Withdraw Application</h3>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Are you sure you want to withdraw this application? This action cannot
            be undone.
          </p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setWithdrawDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              Withdraw Application
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
