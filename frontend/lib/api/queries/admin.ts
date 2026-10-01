import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: (filters?: any) => [...adminKeys.all, "users", filters] as const,
  practiceJobs: (filters?: any) => [...adminKeys.all, "practice-jobs", filters] as const,
};

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
      }>("/admin/practice-jobs", { params: filters });
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
      requiredSkills: string[];
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

