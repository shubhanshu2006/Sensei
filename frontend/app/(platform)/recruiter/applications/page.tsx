"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useRecruiterApplications } from "@/lib/api/queries/applications";
import { ApplicationStatus } from "@/types/application.types";
import { getApplicationStatusColor, getInitials } from "@/lib/utils";
import {
  Search,
  Filter,
  TrendingUp,
  MapPin,
  Briefcase,
  Calendar,
  Eye,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function RecruiterApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");

  // Fetch applications
  const { data, isLoading } = useRecruiterApplications({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const applications = data?.applications || [];

  return (
    <DashboardLayout role="RECRUITER">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Applications
          </h1>
          <p className="mt-1 text-slate-600">
            Review and manage candidate applications
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
                  placeholder="Search by name, job title..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as ApplicationStatus | "")}
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
                  : "Applications will appear here once candidates apply to your jobs"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => {
              const candidate = application.candidate;
              const user = candidate?.user;
              const job = application.job;
              const screening = application.screeningReport;

              return (
                <Card
                  key={application.id}
                  className="group transition-all duration-200 hover:shadow-lg"
                >
                  <Link href={`/recruiter/applications/${application.id}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Left: Candidate Info */}
                        <div className="flex items-start space-x-4">
                          <Avatar
                            src={user?.avatar}
                            alt={`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Candidate"}
                            fallback={getInitials(
                              user?.firstName,
                              user?.lastName,
                            )}
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-emerald-600">
                              {user?.firstName || "Unknown"} {user?.lastName || "Candidate"}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {candidate?.currentDesignation ||
                                candidate?.currentCompany ||
                                "Job Seeker"}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                              {job?.title && (
                                <div className="flex items-center space-x-2">
                                  <Briefcase className="h-4 w-4 text-slate-400" />
                                  <span>{job.title}</span>
                                </div>
                              )}
                              {candidate?.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  <span>{candidate.location}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
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
                          </div>
                        </div>

                        {/* Right: Score & Status */}
                        <div className="flex flex-col items-end space-y-3">
                          <Badge
                            variant={getApplicationStatusColor(application.status)}
                          >
                            {application.status.replace(/_/g, " ")}
                          </Badge>

                          {screening?.overallMatchScore !== undefined && (
                            <div className="flex items-center space-x-2 rounded-lg bg-emerald-50 px-3 py-2">
                              <TrendingUp className="h-5 w-5 text-emerald-600" />
                              <div className="text-right">
                                <div className="text-lg font-bold text-emerald-600">
                                  {Math.round(screening.overallMatchScore)}%
                                </div>
                                <div className="text-xs text-emerald-700">
                                  AI Score
                                </div>
                              </div>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Screening Report Preview */}
                      {screening && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                AI Decision:{" "}
                                <span
                                  className={`${
                                    screening.decision === "STRONG_MATCH"
                                      ? "text-emerald-600"
                                      : screening.decision === "MODERATE_MATCH"
                                        ? "text-amber-600"
                                        : "text-rose-600"
                                  }`}
                                >
                                  {screening.decision?.replace(/_/g, " ") || "COMPLETED"}
                                </span>
                              </p>
                              {screening.feedbackSummary && (
                                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                                  {screening.feedbackSummary}
                                </p>
                              )}
                            </div>
                            {(screening.skillsScore !== undefined || screening.experienceScore !== undefined) && (
                              <div className="ml-4 grid grid-cols-2 gap-3">
                                {screening.skillsScore !== undefined && (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-slate-900">
                                      {Math.round(screening.skillsScore)}%
                                    </div>
                                    <div className="text-xs text-slate-600">
                                      Skills
                                    </div>
                                  </div>
                                )}
                                {screening.experienceScore !== undefined && (
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-slate-900">
                                      {Math.round(screening.experienceScore)}%
                                    </div>
                                    <div className="text-xs text-slate-600">
                                      Experience
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
