"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminPracticeJobs,
  useCreatePracticeJob,
  useDeletePracticeJob,
  useTogglePracticeJobFeatured,
  useTogglePracticeJobPublished,
  useAdminStats,
} from "@/lib/api/queries/admin";
import { useStartPractice } from "@/lib/api/queries/practice";
import {
  Plus,
  Search,
  GraduationCap,
  Star,
  StarOff,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Users,
  TrendingUp,
  Sparkles,
  X,
  Loader2,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";

const CORE_TRACKS = [
  { value: "TECH", label: "Technical Roles", icon: "💻", description: "Frontend, Backend, System Design" },
  { value: "SALES", label: "Sales & BD", icon: "📈", description: "Pitches, Discovery & Closing" },
  { value: "HR", label: "HR & People", icon: "👥", description: "People Ops, Talent & Relations" },
  { value: "COMMUNICATION", label: "Communication", icon: "🎙️", description: "Storytelling, STAR & Alignment" },
];

const CATEGORIES = [
  { value: "TECH", label: "💻 Technical Roles (General)" },
  { value: "SALES", label: "📈 Sales & Business Development" },
  { value: "HR", label: "👥 HR & People Operations" },
  { value: "COMMUNICATION", label: "🎙️ Communication & Behavioral" },
  { value: "FRONTEND", label: "Frontend Development" },
  { value: "BACKEND", label: "Backend Development" },
  { value: "FULLSTACK", label: "Full Stack Development" },
  { value: "SYSTEM_DESIGN", label: "System Design" },
  { value: "DEVOPS", label: "DevOps & Cloud" },
  { value: "MOBILE", label: "Mobile Development" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "MACHINE_LEARNING", label: "Machine Learning" },
  { value: "PRODUCT_MANAGEMENT", label: "Product Management" },
  { value: "OTHER", label: "Other" },
];

const DIFFICULTIES = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "EXPERT", label: "Expert" },
];

const getCategoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label || value;

const getCategoryBadge = (category: string) => {
  const cat = category?.toUpperCase();
  if (cat === "SALES") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-semibold text-purple-700">
        📈 Sales & BD
      </span>
    );
  }
  if (cat === "HR") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
        👥 HR & People
      </span>
    );
  }
  if (cat === "COMMUNICATION") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-semibold text-sky-700">
        🎙️ Communication
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800 capitalize">
      💻 {category?.replace(/_/g, " ").toLowerCase()}
    </span>
  );
};

const getDifficultyColor = (d: string) => {
  switch (d) {
    case "BEGINNER":
      return "success" as const;
    case "INTERMEDIATE":
      return "warning" as const;
    case "ADVANCED":
      return "destructive" as const;
    case "EXPERT":
      return "destructive" as const;
    default:
      return "default" as const;
  }
};

export default function AdminPracticePage() {
  const router = useRouter();
  const startPracticeMutation = useStartPractice();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableCategory, setSelectedTableCategory] = useState("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleGiveInterview = async (jobId: string) => {
    try {
      const session = await startPracticeMutation.mutateAsync({ practiceJobId: jobId });
      const sessionId = session?.id || session?.sessionId;
      if (sessionId) {
        router.push(`/interview/${sessionId}`);
      }
    } catch {
      // toast shown by mutation
    }
  };

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TECH");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [skillsInput, setSkillsInput] = useState("");
  const [techInput, setTechInput] = useState("");
  const [duration, setDuration] = useState("25");
  const [isFeatured, setIsFeatured] = useState(false);

  const { data: statsData } = useAdminStats();
  const { data: practiceData, isLoading } = useAdminPracticeJobs();
  const createMutation = useCreatePracticeJob();
  const deleteMutation = useDeletePracticeJob();
  const toggleFeaturedMutation = useTogglePracticeJobFeatured();
  const togglePublishedMutation = useTogglePracticeJobPublished();

  const jobs = practiceData?.jobs || [];
  const filteredJobs = jobs.filter((j: any) => {
    const matchesSearch = searchQuery
      ? j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    if (!matchesSearch) return false;
    if (selectedTableCategory === "ALL") return true;
    if (selectedTableCategory === "SALES") return j.category === "SALES";
    if (selectedTableCategory === "HR") return j.category === "HR";
    if (selectedTableCategory === "COMMUNICATION") return j.category === "COMMUNICATION";
    if (selectedTableCategory === "TECH") {
      return !["SALES", "HR", "COMMUNICATION"].includes(j.category);
    }
    return true;
  });

  const publishedCount = jobs.filter((j: any) => j.isPublished).length;
  const featuredCount = jobs.filter((j: any) => j.isFeatured).length;
  const totalPracticed = jobs.reduce(
    (sum: number, j: any) => sum + (j.practiceCount || 0),
    0
  );

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("TECH");
    setDifficulty("INTERMEDIATE");
    setSkillsInput("");
    setTechInput("");
    setDuration("25");
    setIsFeatured(false);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (["SALES", "HR", "COMMUNICATION"].includes(val)) {
      setSkillsInput("");
      setTechInput("");
    }
  };

  const handleCreate = async () => {
    const isNonTechnical = ["SALES", "HR", "COMMUNICATION"].includes(category);
    const requiredSkills = isNonTechnical
      ? []
      : skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const technologies = isNonTechnical
      ? []
      : techInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    if (!title || title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (!description || description.length < 50) {
      toast.error("Description must be at least 50 characters");
      return;
    }
    if (description.length > 2000) {
      toast.error("Description must not exceed 2000 characters");
      return;
    }
    if (!isNonTechnical && requiredSkills.length === 0) {
      toast.error("At least one required skill is needed for technical tracks");
      return;
    }
    if (!isNonTechnical && requiredSkills.length > 50) {
      toast.error("At most 50 required skills are allowed");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title,
        description,
        category,
        difficulty,
        requiredSkills: isNonTechnical ? [] : requiredSkills,
        technologies: !isNonTechnical && technologies.length > 0 ? technologies : undefined,
        estimatedDuration: parseInt(duration) || 25,
        isFeatured,
      });
      setCreateDialogOpen(false);
      resetForm();
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    const targetJob = jobs.find((j: any) => j.id === deleteTargetId);
    if (targetJob && (targetJob.practiceCount || 0) > 0) {
      toast.error(
        `Cannot delete "${targetJob.title}" because it has already been practiced (${targetJob.practiceCount} time(s)). Deletion is only allowed for job descriptions with 0 practices.`
      );
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      return;
    }
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              Practice Tracks
            </h1>
            <p className="mt-1 text-slate-600">
              Create and manage AI mock interview practice tracks for candidates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/candidate/practice">
              <Button
                variant="outline"
                className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 font-medium"
              >
                <Play className="h-4 w-4 fill-orange-500 text-orange-500" />
                Give Interview (Catalog)
              </Button>
            </Link>
            <Button
              onClick={() => {
                resetForm();
                setCreateDialogOpen(true);
              }}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Track
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Tracks
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {practiceData?.total || statsData?.totalPracticeJobs || jobs.length}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Published
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-emerald-600">
                      {publishedCount}
                    </p>
                    {jobs.length - publishedCount > 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        ({jobs.length - publishedCount} hidden)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Eye className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Featured</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    {featuredCount}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Star className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Practiced
                  </p>
                  <p className="mt-1 text-2xl font-bold text-purple-600">
                    {totalPracticed}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Category Filter */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Tracks", count: jobs.length },
              {
                id: "TECH",
                label: "💻 Technical",
                count: jobs.filter((j: any) => !["SALES", "HR", "COMMUNICATION"].includes(j.category)).length,
              },
              {
                id: "SALES",
                label: "📈 Sales & BD",
                count: jobs.filter((j: any) => j.category === "SALES").length,
              },
              {
                id: "HR",
                label: "👥 HR & People",
                count: jobs.filter((j: any) => j.category === "HR").length,
              },
              {
                id: "COMMUNICATION",
                label: "🎙️ Communication",
                count: jobs.filter((j: any) => j.category === "COMMUNICATION").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTableCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedTableCategory === tab.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search tracks by title or category..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Tracks Table */}
        <Card>
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {searchQuery
                  ? "No tracks match your search"
                  : "No practice tracks yet"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {searchQuery
                  ? "Try adjusting your search query"
                  : 'Click "Create Track" or run `npm run seed-practice` in the backend to add tracks.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Track
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Category
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Difficulty
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Duration
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Practiced
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((job: any) => (
                    <tr
                      key={job.id}
                      className="transition-colors hover:bg-slate-50/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[250px]">
                              {job.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {job.isFeatured && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  Featured
                                </span>
                              )}
                              <span className="text-xs text-slate-500">
                                {(job.requiredSkills || []).length > 0 ? (
                                  <>
                                    {(job.requiredSkills || []).slice(0, 3).join(", ")}
                                    {(job.requiredSkills || []).length > 3 && "..."}
                                  </>
                                ) : job.category === "SALES" ? (
                                  "Pitches, Discovery & Closing"
                                ) : job.category === "HR" ? (
                                  "People Ops, Culture & STAR"
                                ) : job.category === "COMMUNICATION" ? (
                                  "Storytelling & Executive Presence"
                                ) : (
                                  "General Assessment"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getCategoryBadge(job.category)}
                      </td>
                      <td className="p-4">
                        <Badge variant={getDifficultyColor(job.difficulty)}>
                          {job.difficulty}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.estimatedDuration || 20} min</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.practiceCount || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {job.isPublished ? (
                          <Badge variant="success" className="gap-1">
                            <Eye className="h-3 w-3" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 border-amber-200 font-medium">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                          </Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            className="gap-1.5 text-xs bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-xs"
                            onClick={() => handleGiveInterview(job.id)}
                            disabled={startPracticeMutation.isPending}
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Give Interview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() =>
                              toggleFeaturedMutation.mutate(job.id)
                            }
                            disabled={toggleFeaturedMutation.isPending}
                          >
                            {job.isFeatured ? (
                              <>
                                <StarOff className="h-3.5 w-3.5" />
                                Unfeature
                              </>
                            ) : (
                              <>
                                <Star className="h-3.5 w-3.5" />
                                Feature
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-1 text-xs ${
                              job.isPublished
                                ? "text-slate-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium"
                            }`}
                            onClick={() => togglePublishedMutation.mutate(job.id)}
                            disabled={togglePublishedMutation.isPending}
                            title={
                              job.isPublished
                                ? "Hide this track from candidate dashboard practice tracks"
                                : "Show this track in candidate dashboard practice tracks"
                            }
                          >
                            {job.isPublished ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                Unhide
                              </>
                            )}
                          </Button>
                          {(job.practiceCount || 0) > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="gap-1 text-xs text-slate-400 cursor-not-allowed hover:bg-transparent opacity-60"
                              title={`Cannot delete: "${job.title}" has been practiced ${job.practiceCount} time(s). Use "Hide" to remove it from candidate dashboard while keeping scorecards intact.`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                setDeleteTargetId(job.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Create Track Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center space-x-2 text-emerald-600">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-slate-900">
              Create Practice Track
            </h3>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Create a new AI mock interview track for candidates to practice
          </p>

          <div className="mt-6 space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Track Title *
              </label>
              <Input
                placeholder="e.g. Senior React Developer Interview"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                {title.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description *
              </label>
              <Textarea
                placeholder="Describe what this practice track covers — topics, architecture, skills tested, target audience, etc. (50-2000 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={5}
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className={description.length < 50 ? "text-amber-600 font-medium" : "text-emerald-600"}>
                  {description.length < 50
                    ? `${50 - description.length} more characters needed (min 50)`
                    : "Minimum met"}
                </span>
                <span className={description.length > 2000 ? "text-rose-600 font-bold" : "text-slate-500"}>
                  {description.length}/2000 characters
                </span>
              </div>
            </div>

            {/* Track Category Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Track Category * (Select primary interview track)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                {CORE_TRACKS.map((t) => {
                  const isSelected =
                    (t.value === "TECH" && !["SALES", "HR", "COMMUNICATION"].includes(category)) ||
                    category === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => handleCategoryChange(t.value)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xl mb-1">{t.icon}</span>
                      <span className="text-xs font-bold text-slate-900">{t.label}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{t.description}</span>
                    </button>
                  );
                })}
              </div>

              {/* Category Dropdown & Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Category Specialization *
                  </label>
                  <Select
                    value={category}
                    onChange={(val) => handleCategoryChange(val)}
                    options={CATEGORIES}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Difficulty *
                  </label>
                  <Select
                    value={difficulty}
                    onChange={(val) => setDifficulty(val)}
                    options={DIFFICULTIES}
                  />
                </div>
              </div>

              {/* Category Rubric Hint */}
              <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600">
                {category === "SALES" ? (
                  <p>
                    <strong className="text-purple-700">📈 Sales Evaluation Rubric:</strong> Pitch & Value Proposition, Objection Handling, Discovery & Active Listening, Closing & Deal Control.
                  </p>
                ) : category === "HR" ? (
                  <p>
                    <strong className="text-amber-700">👥 HR Evaluation Rubric:</strong> People Strategy & Compliance, Behavioral & STAR Method, Conflict Resolution & Empathy, Ethics & Culture Alignment.
                  </p>
                ) : category === "COMMUNICATION" ? (
                  <p>
                    <strong className="text-sky-700">🎙️ Communication Evaluation Rubric:</strong> Structure & Brevity (PREP), Articulation & Clarity, Active Listening & Adaptability, Executive Presence & Tone.
                  </p>
                ) : (
                  <p>
                    <strong className="text-emerald-700">💻 Technical Evaluation Rubric:</strong> Technical Knowledge, Problem Solving, Communication, Culture & Confidence.
                  </p>
                )}
              </div>
            </div>

            {/* Technical Skills & Technologies (only for technical roles) */}
            {!["SALES", "HR", "COMMUNICATION"].includes(category) && (
              <>
                {/* Required Skills */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Required Skills * (comma-separated)
                  </label>
                  <Input
                    placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                  />
                  {skillsInput && (
                    <>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {skillsInput
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((skill, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).length} skills added
                        </span>
                        <span
                          className={
                            skillsInput.split(",").map((s) => s.trim()).filter(Boolean).length > 50
                              ? "text-rose-600 font-bold"
                              : "text-slate-400"
                          }
                        >
                          max 50
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Technologies */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Technologies (comma-separated, optional)
                  </label>
                  <Input
                    placeholder="e.g. Webpack, Vite, Jest, Docker"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Duration & Featured */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Featured Track
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3 border-t border-slate-200 pt-5">
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Track
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Delete Practice Track?
          </h3>
          {(() => {
            const target = jobs.find((j: any) => j.id === deleteTargetId);
            const count = target?.practiceCount || 0;
            if (count > 0) {
              return (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <p className="font-semibold">Cannot Delete This Job Description</p>
                  <p className="mt-1 text-xs text-amber-700">
                    &quot;{target?.title}&quot; has already been practiced {count} time(s). Deletion is prohibited to preserve candidate interview history and performance scorecards. Use the <strong>Hide</strong> button in the table actions to hide it from candidate practice tracks instead.
                  </p>
                </div>
              );
            }
            return (
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{target?.title || "this practice track"}</span>? This track has 0 practices. This action is permanent and cannot be undone.
              </p>
            );
          })()}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTargetId(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={
                deleteMutation.isPending ||
                Boolean(jobs.find((j: any) => j.id === deleteTargetId && (j.practiceCount || 0) > 0))
              }
              className="gap-2 bg-rose-600 hover:bg-rose-700"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
