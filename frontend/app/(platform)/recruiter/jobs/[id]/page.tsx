"use client";

import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useJob, useUpdateJobStatus } from "@/lib/api/queries/jobs";
import { useJobApplications } from "@/lib/api/queries/applications";
import { JobStatus } from "@/types/job.types";
import { getJobStatusColor, getApplicationStatusColor, getInitials, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  MapPin,
  Briefcase,
  Users,
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function RecruiterJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const { data: job, isLoading: jobLoading } = useJob(jobId);
  const { data: applicationsData, isLoading: appsLoading } = useJobApplications(jobId);
  const updateStatusMutation = useUpdateJobStatus();

  const applications = applicationsData?.applications || [];

  if (jobLoading) {
    return (
      <DashboardLayout role="RECRUITER">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout role="RECRUITER">
        <div className="text-center py-12">
          <p className="text-slate-600">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleStatus = async () => {
    const newStatus = job.status === JobStatus.ACTIVE ? JobStatus.PAUSED : JobStatus.ACTIVE;
    await updateStatusMutation.mutateAsync({ id: job.id, status: newStatus });
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.push("/recruiter/jobs")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="font-serif text-3xl font-bold text-slate-900">
                  {job.title}
                </h1>
                <Badge variant={getJobStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </div>
              <p className="mt-1 text-slate-600">
                Created {job.createdAt ? formatDate(job.createdAt) : "recently"}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleToggleStatus}
                disabled={updateStatusMutation.isPending}
              >
                {job.status === JobStatus.ACTIVE ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause Listing
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Activate Listing
                  </>
                )}
              </Button>
              <Link href={`/recruiter/jobs/${job.id}/edit`}>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Edit className="h-4 w-4" />
                  Edit Job
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Job Details Card */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Job Overview
              </h2>
              <div className="prose max-w-none text-slate-700 whitespace-pre-line">
                {job.description}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills?.map((skill: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Applications List */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Applicants ({applications.length})
                  </h2>
                  <p className="text-sm text-slate-600">
                    Candidates who applied to this role
                  </p>
                </div>
              </div>

              {appsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-600">
                    No applications received yet for this role.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const candidate = app.candidate;
                    const user = candidate?.user;
                    const screening = app.screeningReport;

                    return (
                      <Link
                        key={app.id}
                        href={`/recruiter/applications/${app.id}`}
                        className="block rounded-xl border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={user?.avatar}
                              alt={`${user?.firstName || ""} ${user?.lastName || ""}`}
                              fallback={getInitials(user?.firstName, user?.lastName)}
                            />
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {user?.firstName} {user?.lastName}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {candidate?.currentDesignation || "Applicant"} • Applied{" "}
                                {app.appliedAt
                                  ? formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })
                                  : "recently"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {screening?.overallMatchScore !== undefined && (
                              <div className="flex items-center space-x-1.5 rounded-lg bg-emerald-50 px-2.5 py-1">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-700">
                                  {Math.round(screening.overallMatchScore)}%
                                </span>
                              </div>
                            )}

                            <Badge variant={getApplicationStatusColor(app.status)}>
                              {app.status.replace(/_/g, " ")}
                            </Badge>

                            <Eye className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Settings & Metadata */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Job Info</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    Location
                  </span>
                  <span className="font-medium text-slate-900">{job.location || "Remote"}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    Job Type
                  </span>
                  <span className="font-medium text-slate-900">{job.jobType?.replace(/_/g, " ")}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Experience Level
                  </span>
                  <span className="font-medium text-slate-900">{job.experienceLevel?.replace(/_/g, " ")}</span>
                </div>

                {job.salaryMin !== undefined && job.salaryMax !== undefined && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Salary Range</span>
                    <span className="font-medium text-slate-900">
                      ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                AI Screening Configuration
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span>Screening Mode</span>
                  <Badge variant="outline">{job.screeningMode || "AUTOMATIC"}</Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span>Auto-Invite Threshold</span>
                  <span className="font-semibold text-emerald-600">
                    {job.autoInviteThreshold ?? 75}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span>Interview Questions</span>
                  <span className="font-medium text-slate-900">
                    {job.questionsCount ?? 5} questions
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
