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
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminPracticeJobs,
  useCreatePracticeJob,
  useDeletePracticeJob,
  useTogglePracticeJobFeatured,
  useAdminStats,
} from "@/lib/api/queries/admin";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTableCategory, setSelectedTableCategory] = useState("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

  const handleCreate = async () => {
    const requiredSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const technologies = techInput
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
    if (requiredSkills.length === 0) {
      toast.error("At least one required skill is needed");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title,
        description,
        category,
        difficulty,
        requiredSkills,
        technologies: technologies.length > 0 ? technologies : undefined,
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
                    {statsData?.totalPracticeJobs ?? jobs.length}
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
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {publishedCount}
                  </p>
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
                                {(job.requiredSkills || []).slice(0, 3).join(", ")}
                                {(job.requiredSkills || []).length > 3 && "..."}
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
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-1">
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
                            className="gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              setDeleteTargetId(job.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
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
                placeholder="Describe what this practice track covers — topics, skills tested, target audience, etc. (min 50 chars)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="mt-1 text-xs text-slate-500">
                {description.length}/1000 characters (min 50)
              </p>
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
                      onClick={() => setCategory(t.value)}
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
                    onChange={(val) => setCategory(val)}
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
          <p className="mt-2 text-sm text-slate-600">
            This action is permanent and cannot be undone. All associated data
            will be lost.
          </p>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
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
