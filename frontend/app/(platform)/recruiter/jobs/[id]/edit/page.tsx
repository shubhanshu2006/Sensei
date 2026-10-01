"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useJob, useUpdateJob } from "@/lib/api/queries/jobs";
import {
  JobStatus,
  JobType,
  WorkMode,
  ExperienceLevel,
  ScreeningMode,
} from "@/types/job.types";
import { ArrowLeft, Save, Sparkles, X, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  location: z.string().min(2, "Location is required"),
  jobType: z.nativeEnum(JobType),
  workMode: z.nativeEnum(WorkMode),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  requiredSkills: z.array(z.string()).min(1, "Add at least one skill"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  screeningMode: z.nativeEnum(ScreeningMode),
  autoInviteThreshold: z.number().min(0).max(100).optional(),
  questionsCount: z.number().min(3).max(15),
  status: z.nativeEnum(JobStatus),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const { data: job, isLoading } = useJob(jobId);
  const updateJobMutation = useUpdateJob();
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: JobType.FULL_TIME,
      workMode: WorkMode.REMOTE,
      experienceLevel: ExperienceLevel.MID_LEVEL,
      requiredSkills: [],
      screeningMode: ScreeningMode.AUTOMATIC,
      autoInviteThreshold: 75,
      questionsCount: 5,
      status: JobStatus.ACTIVE,
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title || "",
        description: job.description || "",
        location: job.location || "",
        jobType: job.jobType as JobType,
        workMode: (job.workMode as WorkMode) || WorkMode.REMOTE,
        experienceLevel: job.experienceLevel as ExperienceLevel,
        requiredSkills: job.requiredSkills || [],
        salaryMin: job.salaryMin || undefined,
        salaryMax: job.salaryMax || undefined,
        screeningMode: (job.screeningMode as ScreeningMode) || ScreeningMode.AUTOMATIC,
        autoInviteThreshold: job.autoInviteThreshold ?? 75,
        questionsCount: job.questionsCount ?? 5,
        status: job.status as JobStatus,
      });
    }
  }, [job, reset]);

  const requiredSkills = watch("requiredSkills") || [];

  const addSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setValue("requiredSkills", [...requiredSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setValue(
      "requiredSkills",
      requiredSkills.filter((s) => s !== skill),
    );
  };

  const onSubmit = async (data: JobFormData) => {
    await updateJobMutation.mutateAsync({
      id: jobId,
      ...data,
    });
    router.push(`/recruiter/jobs/${jobId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="RECRUITER">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="RECRUITER">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Edit Job
          </h1>
          <p className="mt-1 text-slate-600">
            Update job details and screening requirements
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Basic Information
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Job Title *
              </label>
              <Input {...register("title")} placeholder="e.g. Senior Frontend Developer" />
              {errors.title && (
                <p className="mt-1 text-sm text-rose-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description *
              </label>
              <Textarea
                {...register("description")}
                rows={6}
                placeholder="Describe role and responsibilities..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-rose-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location *
                </label>
                <Input {...register("location")} placeholder="e.g. San Francisco, CA" />
                {errors.location && (
                  <p className="mt-1 text-sm text-rose-600">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Work Mode *
                </label>
                <select
                  {...register("workMode")}
                  className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={WorkMode.REMOTE}>Remote</option>
                  <option value={WorkMode.ONSITE}>On-site</option>
                  <option value={WorkMode.HYBRID}>Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Job Type *
                </label>
                <select
                  {...register("jobType")}
                  className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={JobType.FULL_TIME}>Full-time</option>
                  <option value={JobType.PART_TIME}>Part-time</option>
                  <option value={JobType.CONTRACT}>Contract</option>
                  <option value={JobType.INTERNSHIP}>Internship</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Experience Level *
                </label>
                <select
                  {...register("experienceLevel")}
                  className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={ExperienceLevel.INTERNSHIP}>Internship</option>
                  <option value={ExperienceLevel.ENTRY_LEVEL}>Entry Level (0-2 yrs)</option>
                  <option value={ExperienceLevel.MID_LEVEL}>Mid Level (3-5 yrs)</option>
                  <option value={ExperienceLevel.SENIOR_LEVEL}>Senior Level (5-8 yrs)</option>
                  <option value={ExperienceLevel.LEAD}>Lead (8+ yrs)</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Required Skills
            </h2>

            <div>
              <div className="flex space-x-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="e.g. React, TypeScript, Node.js"
                />
                <Button type="button" onClick={addSkill} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-emerald-500 hover:text-emerald-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {errors.requiredSkills && (
                <p className="mt-2 text-sm text-rose-600">
                  {errors.requiredSkills.message}
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                AI Screening Configuration
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Screening Mode
                </label>
                <select
                  {...register("screeningMode")}
                  className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={ScreeningMode.AUTOMATIC}>
                    Automatic (Auto-invite on threshold)
                  </option>
                  <option value={ScreeningMode.ASSISTED}>
                    Assisted (Review before inviting)
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Auto-Invite Score Threshold (%)
                </label>
                <Input
                  type="number"
                  {...register("autoInviteThreshold", { valueAsNumber: true })}
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Number of Technical Questions
                </label>
                <Input
                  type="number"
                  {...register("questionsCount", { valueAsNumber: true })}
                  min={3}
                  max={15}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={JobStatus.ACTIVE}>Active</option>
                  <option value={JobStatus.PAUSED}>Paused</option>
                  <option value={JobStatus.DRAFT}>Draft</option>
                  <option value={JobStatus.CLOSED}>Closed</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateJobMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
