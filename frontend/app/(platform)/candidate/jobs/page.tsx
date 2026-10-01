"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/lib/api/queries/jobs";
import { ExperienceLevel, WorkMode, JobType, JobStatus } from "@/types/job.types";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function CandidateJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceLevelFilter, setExperienceLevelFilter] =
    useState<ExperienceLevel | "">("");
  const [workModeFilter, setWorkModeFilter] = useState<WorkMode | "">("");
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | "">("");

  // Fetch jobs
  const { data, isLoading } = useJobs({
    status: JobStatus.ACTIVE,
    search: searchQuery || undefined,
    experienceLevel: experienceLevelFilter || undefined,
    workMode: workModeFilter || undefined,
    jobType: jobTypeFilter || undefined,
  });

  const jobs = data?.jobs || [];

  const hasFilters = searchQuery || experienceLevelFilter || workModeFilter || jobTypeFilter;

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Find Your Dream Job
          </h1>
          <p className="mt-1 text-slate-600">
            Browse {data?.total || 0} available opportunities
          </p>
        </div>

        {/* Search & Filters */}
        <Card>
          <div className="p-4">
            <div className="flex flex-col space-y-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by job title, company, or skills..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="grid gap-3 md:grid-cols-4">
                <Select
                  value={experienceLevelFilter}
                  onChange={(value) =>
                    setExperienceLevelFilter(value as ExperienceLevel | "")
                  }
                  options={[
                    { value: "", label: "All Experience Levels" },
                    { value: ExperienceLevel.INTERNSHIP, label: "Internship" },
                    { value: ExperienceLevel.ENTRY_LEVEL, label: "Entry Level" },
                    { value: ExperienceLevel.MID_LEVEL, label: "Mid Level" },
                    { value: ExperienceLevel.SENIOR_LEVEL, label: "Senior Level" },
                    { value: ExperienceLevel.LEAD, label: "Lead" },
                  ]}
                />

                <Select
                  value={workModeFilter}
                  onChange={(value) => setWorkModeFilter(value as WorkMode | "")}
                  options={[
                    { value: "", label: "All Work Modes" },
                    { value: WorkMode.REMOTE, label: "Remote" },
                    { value: WorkMode.ONSITE, label: "On-site" },
                    { value: WorkMode.HYBRID, label: "Hybrid" },
                  ]}
                />

                <Select
                  value={jobTypeFilter}
                  onChange={(value) => setJobTypeFilter(value as JobType | "")}
                  options={[
                    { value: "", label: "All Job Types" },
                    { value: JobType.FULL_TIME, label: "Full-time" },
                    { value: JobType.PART_TIME, label: "Part-time" },
                    { value: JobType.CONTRACT, label: "Contract" },
                    { value: JobType.INTERNSHIP, label: "Internship" },
                  ]}
                />

                {hasFilters && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setExperienceLevelFilter("");
                      setWorkModeFilter("");
                      setJobTypeFilter("");
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Jobs List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No jobs found
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {hasFilters
                  ? "Try adjusting your search or filters"
                  : "No active job postings available at the moment"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="group transition-all duration-200 hover:shadow-lg"
              >
                <Link href={`/candidate/jobs/${job.id}`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Company Logo Placeholder */}
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-orange-100">
                          <Building className="h-7 w-7 text-emerald-600" />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 transition-colors group-hover:text-emerald-600">
                            {job.title}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {job.recruiter?.companyName || "Company"}
                          </p>

                          {/* Job Details */}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="h-4 w-4 text-slate-400" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Briefcase className="h-4 w-4 text-slate-400" />
                              <span className="capitalize">
                                {job.experienceLevel
                                  .toLowerCase()
                                  .replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Clock className="h-4 w-4 text-slate-400" />
                              <span className="capitalize">
                                {job.jobType.toLowerCase().replace(/_/g, " ")}
                              </span>
                            </div>
                            {(job.salaryMin || job.salaryMax) && (
                              <div className="flex items-center space-x-1.5">
                                <DollarSign className="h-4 w-4 text-slate-400" />
                                <span>
                                  {job.salaryMin && formatCurrency(job.salaryMin)}
                                  {job.salaryMin && job.salaryMax && " - "}
                                  {job.salaryMax && formatCurrency(job.salaryMax)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {job.requiredSkills.slice(0, 5).map((skill) => (
                              <span
                                key={skill}
                                className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                +{job.requiredSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Badges & Info */}
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          className="capitalize"
                          variant={
                            job.workMode === WorkMode.REMOTE
                              ? "success"
                              : "default"
                          }
                        >
                          {job.workMode.toLowerCase()}
                        </Badge>
                        <p className="text-xs text-slate-500">
                          Posted{" "}
                          {formatDistanceToNow(new Date(job.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Job Description Preview */}
                    <p className="mt-4 text-sm text-slate-600 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-500">
                        {job.applicationsCount || 0} applicants
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        View Details
                        <Briefcase className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
