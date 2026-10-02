import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  analytics: (period?: string) => [...adminKeys.all, "analytics", period] as const,
  users: (filters?: any) => [...adminKeys.all, "users", filters] as const,
  practiceJobs: (filters?: any) => [...adminKeys.all, "practice-jobs", filters] as const,
};

export interface AdminAnalyticsData {
  period: "today" | "week" | "month" | "year" | "all";
  summary: {
    users: { total: number; inPeriod: number; growth: number };
    jobs: { total: number; inPeriod: number; growth: number };
    applications: { total: number; inPeriod: number; growth: number };
    revenue: { total: number; inPeriod: number; growth: number };
  };
  trends: {
    users: Array<{ label: string; fullMonth: string; users: number; heightPercentage: number }>;
    revenue: Array<{ label: string; fullMonth: string; revenue: number; heightPercentage: number }>;
  };
  performance: {
    totalInterviews: number;
    completedInterviews: number;
    interviewSuccessRate: number;
    avgDurationMinutes: number;
    avgOverallScore: number;
    candidateSatisfaction: string;
  };
  topCompanies: Array<{ id: string; name: string; jobs: number; color: string; percentage: number }>;
  topSkills: Array<{ skill: string; count: number; demand: number }>;
}

export function useAdminAnalytics(period: "today" | "week" | "month" | "year" | "all" = "month") {
  return useQuery({
    queryKey: adminKeys.analytics(period),
    queryFn: async () => {
      const { data } = await apiClient.get<AdminAnalyticsData>("/admin/analytics", {
        params: { period },
      });
      return data;
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        totalUsers: number;
        totalRecruiters: number;
        totalCandidates: number;
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        totalInterviews: number;
        totalPracticeJobs: number;
        recentSignups: number;
      }>("/admin/stats");
      return data;
    },
  });
}

export function useAdminUsers(filters?: {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        users: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>("/admin/users", { params: filters });
      return {
        users: data?.users || [],
        total: data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        totalPages: data?.pagination?.totalPages || 1,
      };
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: string;
      status: "ACTIVE" | "SUSPENDED" | "DELETED";
    }) => {
      const { data } = await apiClient.patch<any>(`/admin/users/${userId}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success("User status updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user status");
    },
  });
}

export function useUpdateUserCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      credits,
      operation = "SET",
    }: {
      userId: string;
      credits: number;
      operation?: "SET" | "ADD";
    }) => {
      const { data } = await apiClient.patch<any>(`/admin/users/${userId}/credits`, {
        credits,
        operation,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.success("User credits updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user credits");
    },
  });
}

export function useAdminPracticeJobs(filters?: any) {
  return useQuery({
    queryKey: adminKeys.practiceJobs(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        practiceJobs: any[];
        pagination: {
          total: number;
          page: number;
          totalPages: number;
        };
      }>("/admin/practice-jobs", { params: { limit: 100, ...filters } });
      return {
        jobs: data?.practiceJobs || [],
        total: data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        totalPages: data?.pagination?.totalPages || 1,
      };
    },
  });
}

export function useCreatePracticeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      category: string;
      difficulty: string;
      requiredSkills?: string[];
      technologies?: string[];
      estimatedDuration?: number;
      isFeatured?: boolean;
    }) => {
      const { data } = await apiClient.post<any>("/practice/admin", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.practiceJobs() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success("Practice track created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create practice track");
    },
  });
}

export function useUpdatePracticeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      title?: string;
      description?: string;
      category?: string;
      difficulty?: string;
      requiredSkills?: string[];
      technologies?: string[];
      estimatedDuration?: number;
      isFeatured?: boolean;
      isPublished?: boolean;
    }) => {
      const { data } = await apiClient.put<any>(`/practice/admin/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.practiceJobs() });
      toast.success("Practice track updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update practice track");
    },
  });
}

export function useDeletePracticeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<any>(`/practice/admin/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.practiceJobs() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      toast.success("Practice track deleted!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete practice track");
    },
  });
}

export function useTogglePracticeJobFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<any>(`/practice/admin/${id}/featured`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.practiceJobs() });
      toast.success("Featured status toggled!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle featured status");
    },
  });
}

export function useTogglePracticeJobPublished() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch<any>(`/practice/admin/${id}/publish`);
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.practiceJobs() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      const isPublished = data?.data?.isPublished ?? data?.isPublished;
      toast.success(
        isPublished
          ? "Practice track published to candidate dashboard"
          : "Practice track hidden from candidate dashboard"
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update track visibility");
    },
  });
}

