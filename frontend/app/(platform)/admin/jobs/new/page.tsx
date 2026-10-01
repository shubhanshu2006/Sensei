"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateJob } from "@/lib/api/queries/jobs";
import {
  JobStatus,
  JobType,
  WorkMode,
  ExperienceLevel,
  ScreeningMode,
} from "@/types/job.types";
import { ArrowLeft, ArrowRight, Save, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Form validation schema
const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  location: z.string().min(2, "Location is required"),
  jobType: z.nativeEnum(JobType),
  workMode: z.nativeEnum(WorkMode),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  requiredSkills: z.array(z.string()).min(1, "Add at least one skill"),
  salaryMin: z
    .preprocess((v) => (v === "" || v === null || Number.isNaN(v) ? undefined : Number(v)), z.number().optional()),
  salaryMax: z
    .preprocess((v) => (v === "" || v === null || Number.isNaN(v) ? undefined : Number(v)), z.number().optional()),
  screeningMode: z.nativeEnum(ScreeningMode),
  autoInviteThreshold: z.number().min(0).max(100).optional(),
  questionsCount: z.number().min(3).max(15),
  status: z.nativeEnum(JobStatus),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function AdminCreateJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState("");
  const createJobMutation = useCreateJob();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      location: "",
      jobType: JobType.FULL_TIME,
      workMode: WorkMode.REMOTE,
      experienceLevel: ExperienceLevel.MID_LEVEL,
      requiredSkills: [],
      screeningMode: ScreeningMode.AUTOMATIC,
      autoInviteThreshold: 75,
      questionsCount: 5,
      status: JobStatus.DRAFT,
    },
  });

  const requiredSkills = watch("requiredSkills");
  const screeningMode = watch("screeningMode");
  const autoInviteThreshold = watch("autoInviteThreshold");
  const descriptionValue = watch("description") || "";

  const addSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setValue("requiredSkills", [...requiredSkills, skillInput.trim()], { shouldValidate: true });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setValue(
      "requiredSkills",
      requiredSkills.filter((s) => s !== skill),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      const salaryString =
        data.salaryMin && data.salaryMax
          ? `₹${data.salaryMin.toLocaleString()} - ₹${data.salaryMax.toLocaleString()}`
          : data.salaryMin
          ? `₹${data.salaryMin.toLocaleString()}+`
          : undefined;

      const payload: any = {
        title: data.title,
        description: data.description,
        location: data.location,
        jobType: data.jobType,
        experienceLevel:
          data.experienceLevel === "INTERNSHIP" ? "ENTRY_LEVEL" : data.experienceLevel,
        requiredSkills: data.requiredSkills,
        salary: salaryString,
        screeningConfig: {
          resume: true,
          github: true,
          portfolio: true,
        },
        screeningMode: data.screeningMode,
        autoInviteThreshold: data.autoInviteThreshold ?? 75,
      };

      await createJobMutation.mutateAsync(payload);
      toast.success("Job created successfully!");
      router.push("/admin/jobs");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create job");
    }
  };

  const onValidationError = (formErrors: any) => {
    console.error("Form validation errors:", formErrors);
    const keys = Object.keys(formErrors);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const message = formErrors[firstKey]?.message || "Validation failed";
      toast.error(`${firstKey}: ${message}`);

      if (["title", "description", "location", "jobType", "workMode", "experienceLevel"].includes(firstKey)) {
        setStep(1);
      } else if (["requiredSkills", "salaryMin", "salaryMax"].includes(firstKey)) {
        setStep(2);
      } else {
        setStep(3);
      }
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(["title", "description", "location", "jobType", "workMode", "experienceLevel"]);
      if (!valid) {
        toast.error("Please fill in all required fields in Basic Information");
        return;
      }
    } else if (step === 2) {
      const valid = await trigger(["requiredSkills", "salaryMin", "salaryMax"]);
      if (!valid) {
        toast.error("Please add at least one required skill");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleSaveDraft = () => {
    setValue("status", JobStatus.DRAFT);
    handleSubmit(onSubmit, onValidationError)();
  };

  const handlePublish = () => {
    setValue("status", JobStatus.ACTIVE);
    handleSubmit(onSubmit, onValidationError)();
  };

  const totalSteps = 3;

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="mx-auto max-w-3xl space-y-6">
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
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Create Job as Admin
          </h1>
          <p className="mt-1 text-slate-600">
            Post an official platform job opening
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  s <= step
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {s}
              </div>
              {s < totalSteps && (
                <div
                  className={`mx-2 h-1 flex-1 rounded transition-colors ${
                    s < step ? "bg-emerald-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <div className="p-6">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Basic Information
                  </h2>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Job Title *
                    </label>
                    <Input
                      {...register("title")}
                      placeholder="e.g. Senior Frontend Developer"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-rose-600">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Description *
                    </label>
                    <Textarea
                      {...register("description")}
                      rows={6}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.description ? (
                        <p className="text-sm text-rose-600">{errors.description.message}</p>
                      ) : (
                        <p className="text-xs text-slate-500">Minimum 50 characters required</p>
                      )}
                      <span className={`text-xs ${descriptionValue.length < 50 ? 'text-amber-600 font-medium' : 'text-emerald-600'}`}>
                        {descriptionValue.length}/50 min
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Location *
                      </label>
                      <Input
                        {...register("location")}
                        placeholder="e.g. San Francisco, CA"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-rose-600">
                          {errors.location.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Work Mode *
                      </label>
                      <select
                        {...register("workMode")}
                        className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                        className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                        className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value={ExperienceLevel.INTERNSHIP}>
                          Internship
                        </option>
                        <option value={ExperienceLevel.ENTRY_LEVEL}>
                          Entry Level
                        </option>
                        <option value={ExperienceLevel.MID_LEVEL}>
                          Mid Level
                        </option>
                        <option value={ExperienceLevel.SENIOR_LEVEL}>
                          Senior Level
                        </option>
                        <option value={ExperienceLevel.LEAD}>Lead</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Requirements */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Requirements
                  </h2>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Required Skills *
                    </label>
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
                        placeholder="e.g. React, TypeScript"
                      />
                      <Button type="button" onClick={addSkill}>
                        Add
                      </Button>
                    </div>
                    {errors.requiredSkills && (
                      <p className="mt-1 text-sm text-rose-600">
                        {errors.requiredSkills.message}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center space-x-2 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Minimum Salary (₹)
                      </label>
                      <Input
                        type="number"
                        {...register("salaryMin", { valueAsNumber: true })}
                        placeholder="e.g. 1200000"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Maximum Salary (₹)
                      </label>
                      <Input
                        type="number"
                        {...register("salaryMax", { valueAsNumber: true })}
                        placeholder="e.g. 1800000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: AI Screening */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-xl font-semibold text-slate-900">
                      AI Screening Configuration
                    </h2>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-orange-50 p-4">
                    <p className="text-sm text-slate-700">
                      Configure how AI will screen candidates and automatically
                      invite top performers to interviews
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Screening Mode *
                    </label>
                    <select
                      {...register("screeningMode")}
                      className="flex h-11 w-full items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value={ScreeningMode.AUTOMATIC}>
                        Automatic - AI screens and auto-invites top candidates
                      </option>
                      <option value={ScreeningMode.ASSISTED}>
                        Assisted - AI screens, you review before inviting
                      </option>
                    </select>
                    <p className="mt-2 text-sm text-slate-600">
                      {screeningMode === ScreeningMode.AUTOMATIC
                        ? "Top candidates will automatically receive interview invitations"
                        : "You'll review AI recommendations before sending invitations"}
                    </p>
                  </div>

                  {screeningMode === ScreeningMode.AUTOMATIC && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Auto-Invite Threshold: {autoInviteThreshold}%
                      </label>
                      <input
                        type="range"
                        {...register("autoInviteThreshold", {
                          valueAsNumber: true,
                        })}
                        min="0"
                        max="100"
                        step="5"
                        className="w-full"
                      />
                      <div className="mt-2 flex justify-between text-xs text-slate-600">
                        <span>Low Match (0%)</span>
                        <span>High Match (100%)</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Candidates scoring {autoInviteThreshold}% or above will
                        automatically receive interview invitations
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Number of Interview Questions *
                    </label>
                    <Input
                      type="number"
                      {...register("questionsCount", { valueAsNumber: true })}
                      min="3"
                      max="15"
                      placeholder="5"
                    />
                    <p className="mt-2 text-sm text-slate-600">
                      AI will ask 3-15 questions during interviews (recommended:
                      5-7)
                    </p>
                    {errors.questionsCount && (
                      <p className="mt-1 text-sm text-rose-600">
                        {errors.questionsCount.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="border-t border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep(step - 1)}
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex space-x-3">
                  {step < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="gap-2"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={createJobMutation.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Save Draft
                      </Button>
                      <Button
                        type="button"
                        onClick={handlePublish}
                        disabled={createJobMutation.isPending}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {createJobMutation.isPending ? "Publishing..." : "Publish Job"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
