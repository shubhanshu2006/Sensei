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
  useRecruiterJobs,
  useDeleteJob,
  useUpdateJobStatus,
} from "@/lib/api/queries/jobs";
import { JobStatus, ExperienceLevel } from "@/types/job.types";
import { getJobStatusColor } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Pause,
  Play,
  X,
  MapPin,
  Briefcase,
  Users,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function RecruiterJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Fetch jobs
  const { data, isLoading } = useRecruiterJobs({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const deleteJobMutation = useDeleteJob();
  const updateStatusMutation = useUpdateJobStatus();

  const jobs = data?.jobs || [];

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    await deleteJobMutation.mutateAsync(jobToDelete);
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const handleToggleStatus = async (id: string, currentStatus: JobStatus) => {
    const newStatus = currentStatus === JobStatus.ACTIVE ? JobStatus.PAUSED : JobStatus.ACTIVE;
    await updateStatusMutation.mutateAsync({ id, status: newStatus });
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              My Jobs
            </h1>
            <p className="mt-1 text-slate-600">
              Manage your job postings and track applications
            </p>
          </div>
          <Link href="/recruiter/jobs/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Job
            </Button>
          </Link>
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
                  placeholder="Search jobs..."
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
                  { value: "DRAFT", label: "Draft" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "PAUSED", label: "Paused" },
                  { value: "CLOSED", label: "Closed" },
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
          </div>
        </Card>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
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
                {searchQuery || statusFilter
                  ? "Try adjusting your filters"
                  : "Get started by creating your first job posting"}
              </p>
              {!searchQuery && !statusFilter && (
                <Link href="/recruiter/jobs/new">
                  <Button className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Job
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="mb-4 flex items-start justify-between">
                    <Badge variant={getJobStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleToggleStatus(job.id, job.status)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {job.status === "ACTIVE" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Link href={`/recruiter/jobs/${job.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 opacity-0 transition-opacity hover:bg-rose-50 group-hover:opacity-100"
                        onClick={() => {
                          setJobToDelete(job.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Job Info */}
                  <Link href={`/recruiter/jobs/${job.id}`}>
                    <h3 className="mb-2 font-semibold text-slate-900 transition-colors group-hover:text-emerald-600">
                      {job.title}
                    </h3>
                  </Link>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      <span className="capitalize">
                        {job.experienceLevel.toLowerCase().replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>{job.applicationsCount || 0} applications</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.requiredSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        +{job.requiredSkills.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Posted {formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                {/* Gradient accent */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${
                    job.status === "ACTIVE"
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                      : job.status === "PAUSED"
                        ? "bg-gradient-to-r from-amber-400 to-amber-600"
                        : "bg-gradient-to-r from-slate-400 to-slate-600"
                  }`}
                />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">Delete Job</h3>
          <p className="mt-2 text-sm text-slate-600">
            Are you sure you want to delete this job? This action cannot be undone
            and all applications will be lost.
          </p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setJobToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteJob}
              disabled={deleteJobMutation.isPending}
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
