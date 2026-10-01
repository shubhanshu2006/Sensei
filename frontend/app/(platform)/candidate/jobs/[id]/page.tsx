"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useJob } from "@/lib/api/queries/jobs";
import { useApplyForJob } from "@/lib/api/queries/applications";
import { useCandidateProfile } from "@/lib/api/queries/candidates";
import { ResumeUpload } from "@/components/candidate/ResumeUpload";
import { WorkMode } from "@/types/job.types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building,
  Calendar,
  CheckCircle,
  Send,
  Sparkles,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string>("");

  const { data: job, isLoading } = useJob(jobId);
  const { data: profile } = useCandidateProfile();
  const applyMutation = useApplyForJob();

  // If candidate profile already has a resume, prefill it
  const activeResumeUrl = resumeUrl || profile?.resumeUrl || "";

  const handleApply = async () => {
    if (!job) return;

    if (!activeResumeUrl) {
      toast.error("Please upload your resume before submitting your application");
      return;
    }

    try {
      await applyMutation.mutateAsync({
        jobId: job.id,
        resumeUrl: activeResumeUrl,
        coverLetter: coverLetter || undefined,
      });

      setApplyDialogOpen(false);
      router.push("/candidate/applications");
    } catch {
      // Error handled by mutation toast
    }
  };

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

  if (!job) {
    return (
      <DashboardLayout role="CANDIDATE">
        <div className="text-center py-12">
          <p className="text-slate-600">Job not found</p>
        </div>
      </DashboardLayout>
    );
  }

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
            Back to Jobs
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Job Header */}
            <Card>
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-orange-100">
                    <Building className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="font-serif text-2xl font-bold text-slate-900">
                          {job.title}
                        </h1>
                        <p className="mt-1 text-slate-600">
                          {job.companyName || "Sensei Partner"}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {job.status}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span>{job.jobType?.replace(/_/g, " ")}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{job.experienceLevel?.replace(/_/g, " ")}</span>
                      </div>
                      {job.salaryMin !== undefined && job.salaryMax !== undefined && (
                        <div className="flex items-center space-x-1.5">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          <span>
                            {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  About the Role
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {job.description}
                </div>
              </div>
            </Card>

            {/* Required Skills */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Required Skills
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.requiredSkills?.map((skill: string) => (
                    <span
                      key={skill}
                      className="flex items-center space-x-2 rounded-lg bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-200"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* AI Screening Info */}
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    AI-Powered Screening
                  </h2>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  This position uses Sensei AI to screen candidate resumes and schedule automated technical voice interviews.
                  {job.screeningMode === "AUTOMATIC" && job.autoInviteThreshold && (
                    <span className="mt-2 block">
                      <strong>Auto-invite enabled:</strong> Candidates scoring{" "}
                      {job.autoInviteThreshold}% or higher automatically receive an invitation for an AI voice interview session.
                    </span>
                  )}
                </p>
                <div className="mt-4 rounded-lg bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-800">
                    <strong>Technical Questions:</strong> {job.questionsCount ?? 5} AI-crafted technical questions tailored to this role
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                  onClick={() => setApplyDialogOpen(true)}
                >
                  <Send className="h-5 w-5" />
                  Apply Now
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Instant AI screening feedback after submission
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Job Details</h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Work Mode</span>
                    <span className="font-medium text-slate-900">{job.workMode}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Location</span>
                    <span className="font-medium text-slate-900">{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span>Posted Date</span>
                    <span className="font-medium text-slate-900">
                      {job.createdAt ? formatDate(job.createdAt) : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Apply to {job.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Upload or confirm your resume for AI screening.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Resume *
              </label>
              <ResumeUpload
                currentResumeUrl={activeResumeUrl}
                currentFileName={profile?.resumeFileName || undefined}
                onUploadSuccess={(url) => setResumeUrl(url)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cover Letter (Optional)
              </label>
              <Textarea
                rows={4}
                placeholder="Highlight relevant projects and skills..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setApplyDialogOpen(false)}
              disabled={applyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={applyMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {applyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit Application
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
