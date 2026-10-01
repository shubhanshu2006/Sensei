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
import { useAdminStats } from "@/lib/api/queries/admin";
import { getJobStatusColor, formatDate } from "@/lib/utils";
import { JobStatus } from "@/types/job.types";
import {
  Search,
  Briefcase,
  MapPin,
  Calendar,
  X,
  Building,
  CheckCircle,
  Eye,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function AdminJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");

  const { data: statsData } = useAdminStats();
  const { data: jobsData, isLoading } = useJobs({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const jobs = jobsData?.jobs || [];

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              Jobs Monitoring
            </h1>
            <p className="mt-1 text-slate-600">
              Monitor, audit, and post jobs across the platform
            </p>
          </div>
          <Link href="/admin/jobs/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Create Job
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Jobs Posted
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {statsData?.totalJobs ?? 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Listings</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {statsData?.activeJobs ?? 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Applications</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {statsData?.totalApplications ?? 0}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Building className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search jobs by title or location..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as JobStatus | "")}
              options={[
                { value: "", label: "All Status" },
                { value: JobStatus.ACTIVE, label: "Active" },
                { value: JobStatus.PAUSED, label: "Paused" },
                { value: JobStatus.DRAFT, label: "Draft" },
                { value: JobStatus.CLOSED, label: "Closed" },
              ]}
              className="w-full md:w-48"
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
        </Card>

        {/* Jobs List */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No jobs found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Job Title
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Status
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Location / Mode
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Experience
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Created
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/70">
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500">
                          {job.jobType?.replace(/_/g, " ")} • {job.requiredSkills?.slice(0, 3).join(", ")}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge variant={getJobStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.location || "Remote"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {job.experienceLevel?.replace(/_/g, " ")}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.createdAt ? formatDate(job.createdAt) : "N/A"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
