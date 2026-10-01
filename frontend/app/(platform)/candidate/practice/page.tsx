"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { usePracticeJobs, useStartPractice, type PracticeJob } from "@/lib/api/queries/practice";
import { useCandidatePracticeCredits, useCandidateProfile } from "@/lib/api/queries/candidates";
import { ResumeUpload } from "@/components/candidate/ResumeUpload";
import { BuyCreditsDialog } from "@/components/candidate/BuyCreditsDialog";
import {
  Play,
  Zap,
  Clock,
  Sparkles,
  TrendingUp,
  Briefcase,
  Layers,
  Loader2,
  FileText,
  CreditCard,
  Users,
  MessageSquare,
  Terminal,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const CORE_TRACKS = [
  { id: "", label: "All Tracks", icon: Layers, desc: "Explore all roles" },
  { id: "TECH", label: "Technical Roles", icon: Terminal, desc: "Frontend, Backend, System Design" },
  { id: "SALES", label: "Sales & BD", icon: TrendingUp, desc: "Pitching, Discovery & Closing" },
  { id: "HR", label: "HR & People", icon: Users, desc: "STAR Behavioral & Leadership" },
  { id: "COMMUNICATION", label: "Communication", icon: MessageSquare, desc: "Executive Presence & PREP" },
];

const CATEGORIES = [
  { value: "", label: "All Subcategories" },
  { value: "TECH", label: "All Technical Roles" },
  { value: "SALES", label: "Sales & BD Tracks" },
  { value: "HR", label: "HR & People Tracks" },
  { value: "COMMUNICATION", label: "Communication Tracks" },
  { value: "FRONTEND", label: "Frontend Development" },
  { value: "BACKEND", label: "Backend Development" },
  { value: "FULLSTACK", label: "Full Stack Development" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "DEVOPS", label: "DevOps & Cloud" },
  { value: "MOBILE", label: "Mobile Development" },
  { value: "DATA_SCIENCE", label: "Data Science" },
];

const DIFFICULTIES = [
  { value: "", label: "All Difficulties" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
];

export default function PracticePage() {
  const router = useRouter();
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PracticeJob | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const { data: practiceData, isLoading: jobsLoading } = usePracticeJobs({
    category: categoryFilter || undefined,
    difficulty: difficultyFilter || undefined,
  });

  const { data: creditsData, isLoading: creditsLoading } = useCandidatePracticeCredits();
  const { data: profile } = useCandidateProfile();
  const startPracticeMutation = useStartPractice();

  const jobs = practiceData?.jobs || [];
  const activeResumeUrl = resumeUrl || profile?.resumeUrl || "";
  const isNonTechnical = selectedJob
    ? ["SALES", "HR", "COMMUNICATION"].includes(selectedJob.category?.toUpperCase())
    : false;
  const availableCredits = creditsData
    ? creditsData.practiceCredits - creditsData.practiceCreditsUsed
    : 0;

  const handleStartPractice = async () => {
    if (!selectedJob) return;

    if (!isNonTechnical && !activeResumeUrl) {
      toast.error("A resume is required for technical interview personalization. Please upload your resume below.");
      return;
    }

    if (availableCredits <= 0) {
      toast.error("You have 0 practice credits remaining. Choose a pack to continue practicing!");
      setBuyDialogOpen(true);
      return;
    }

    try {
      const response: any = await startPracticeMutation.mutateAsync({
        practiceJobId: selectedJob.id,
        resumeUrl: activeResumeUrl || undefined,
      });

      const token =
        response?.sessionToken ||
        response?.data?.sessionToken ||
        response?.session?.sessionToken ||
        response?.id ||
        response?.data?.id;

      if (!token) {
        toast.error("Failed to retrieve interview session token. Please try again.");
        return;
      }

      setStartDialogOpen(false);
      router.push(`/interview/${token}`);
    } catch {
      // Error handled by mutation toast
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const diff = difficulty?.toUpperCase();
    if (diff === "BEGINNER") {
      return (
        <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          Beginner
        </span>
      );
    }
    if (diff === "INTERMEDIATE") {
      return (
        <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
          Intermediate
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
        Advanced
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const cat = category?.toUpperCase();
    if (cat === "SALES") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-xs font-semibold text-pink-700">
          <TrendingUp className="h-3 w-3" />
          Sales & BD
        </span>
      );
    }
    if (cat === "HR") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
          <Users className="h-3 w-3" />
          HR & People
        </span>
      );
    }
    if (cat === "COMMUNICATION") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-xs font-semibold text-pink-700">
          <MessageSquare className="h-3 w-3" />
          Communication
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold text-orange-700 capitalize">
        <Terminal className="h-3 w-3" />
        {category?.replace(/_/g, " ").toLowerCase()}
      </span>
    );
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-8 pb-12 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 border border-orange-500/20 text-xs font-mono font-semibold text-orange-600">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              <span>Multi-Track Practice Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              AI Practice Blueprints
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Real spoken dialogue with adaptive follow-ups and instant bar-raiser evaluation across Tech, Sales, HR, and Communication.
            </p>
          </div>

          {/* Credits Summary Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center space-x-3 rounded-2xl bg-white border border-slate-200/90 px-4 py-3 shadow-xs">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500 border border-orange-100">
                <Zap className="h-4 w-4 fill-current" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Practice Credits
                </p>
                {creditsLoading ? (
                  <Skeleton className="h-5 w-16 mt-0.5" />
                ) : (
                  <p className="text-base font-bold text-slate-900">
                    {Math.max(0, availableCredits)} Available
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setBuyDialogOpen(true)}
              className="rounded-2xl border-orange-200 text-orange-600 hover:bg-orange-50/80 hover:border-orange-300 py-5 px-4 font-semibold text-xs shadow-xs"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Buy Credits
            </Button>
          </div>
        </div>

        {/* 5 Core Track Switcher Capsules - Clean light aesthetic */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CORE_TRACKS.map((track) => {
            const Icon = track.icon;
            const isSelected = categoryFilter === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setCategoryFilter(track.id)}
                className={`flex flex-col items-start p-4 rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? "border-2 border-orange-500 bg-gradient-to-br from-orange-50/80 via-pink-50/30 to-white text-slate-900 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/10"
                    : "border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 text-slate-700 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {track.label}
                </span>
                <span className="text-[11px] line-clamp-1 mt-0.5 text-slate-500">
                  {track.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subcategory & Difficulty Filters */}
        <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={CATEGORIES}
              placeholder="Filter by subcategory"
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={difficultyFilter}
              onChange={(val) => setDifficultyFilter(val)}
              options={DIFFICULTIES}
              placeholder="Filter by difficulty"
            />
          </div>
        </div>

        {/* Practice Jobs Grid */}
        {jobsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-3xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl p-12 text-center bg-white border border-slate-200/90 shadow-sm space-y-3">
            <Layers className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-900">
              No Practice Tracks Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Try selecting another category pill above or reset the difficulty filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  setStartDialogOpen(true);
                }}
                className="group rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {getCategoryBadge(job.category)}
                    {getDifficultyBadge(job.difficulty)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-600 transition-colors leading-snug">
                    {job.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="pt-0.5 flex items-center gap-1 text-[11px] font-semibold text-orange-600 group-hover:text-pink-600 transition-colors">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Click to view whole job description &rarr;</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.requiredSkills?.slice(0, 4).map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-md bg-orange-50/70 px-2 py-0.5 text-[11px] font-mono font-medium text-orange-700 border border-orange-100"
                      >
                        {skill}
                      </span>
                    ))}
                    {(job.requiredSkills?.length || 0) > 4 && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                        +{(job.requiredSkills?.length || 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{job.estimatedDuration ?? 20} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                      <span>{job.practiceCount ?? 0} practiced</span>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                      setStartDialogOpen(true);
                    }}
                    className="w-full rounded-full py-2.5 font-medium text-xs text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md shadow-orange-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Launch AI Mock Session</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Job Description & Practice Session Launch Dialog */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen} maxWidth="xl">
        {selectedJob && (
          <div className="p-6 sm:p-7 font-sans space-y-6 max-h-[85vh] overflow-y-auto">
            {/* Header & Badges */}
            <div className="space-y-2 pb-2 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-mono font-semibold text-orange-600">
                  <Sparkles className="h-3 w-3 text-orange-500" />
                  <span>AI Practice Blueprint</span>
                </span>
                {selectedJob.category && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {selectedJob.category.replace(/_/g, " ")}
                  </span>
                )}
                {selectedJob.difficulty && (
                  <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                    {selectedJob.difficulty}
                  </span>
                )}
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>~{selectedJob.estimatedDuration ?? 20} mins</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {selectedJob.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Full role blueprint specifications, target competency rubrics, and personalized interview setup.
              </p>
            </div>

            {/* Whole Job Description Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-orange-500" />
                <span>Complete Job Description &amp; Scope</span>
              </h4>
              <div className="rounded-2xl bg-slate-50 p-4 sm:p-5 border border-slate-200/80 leading-relaxed text-sm text-slate-700 whitespace-pre-wrap">
                {selectedJob.description}
              </div>
            </div>

            {/* Target Core Competencies & Skills */}
            {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-orange-500" />
                  <span>Evaluated Technical Skills &amp; Competencies</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.requiredSkills.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-mono font-semibold text-orange-700 border border-orange-200/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Format & Session Parameters */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-50/40 via-white to-pink-50/20 p-4 border border-orange-200/60 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between pb-2 border-b border-orange-100/60 font-semibold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-orange-600" />
                  <span>Simulation Rubric Parameters</span>
                </div>
                <span className="font-mono text-orange-600 font-bold">1 Practice Credit</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">Interview Format:</span>
                  <span className="font-semibold text-slate-800">Spoken Voice (115ms Groq)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Question Count:</span>
                  <span className="font-semibold text-slate-800">4-5 Adaptive Follow-ups</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Feedback:</span>
                  <span className="font-semibold text-slate-800">Instant Bar-Raiser Scorecard</span>
                </div>
              </div>
            </div>

            {/* Resume Upload Context */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-orange-500" />
                  <span>Candidate Resume Context</span>
                </label>
                {isNonTechnical ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Optional (Non-Tech Track)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    Required for Personalization
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isNonTechnical
                  ? "Resume upload is optional for non-technical rounds. Questions focus directly on behavioral communication, sales discovery, and objection scenarios."
                  : "Upload your resume so the AI can calibrate technical architecture and coding questions to your claimed experience."}
              </p>
              <ResumeUpload
                currentResumeUrl={activeResumeUrl}
                currentFileName={profile?.resumeFileName || undefined}
                onUploadSuccess={(url) => setResumeUrl(url)}
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-mono">
                Available Credits: <span className="font-bold text-slate-900">{availableCredits}</span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => setStartDialogOpen(false)}
                  className="rounded-xl flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartPractice}
                  disabled={startPracticeMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-md shadow-orange-500/20 px-6 flex-1 sm:flex-initial"
                >
                  {startPracticeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2 fill-current" />
                  )}
                  {startPracticeMutation.isPending ? "Generating Session..." : "Begin Practice Round"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Buy Credits Dialog */}
      <BuyCreditsDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} />
    </DashboardLayout>
  );
}
