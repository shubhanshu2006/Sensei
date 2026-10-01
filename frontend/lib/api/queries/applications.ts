import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type {
  Application,
  ApplicationFilters,
  ApplicationStatus,
} from "@/types/application.types";
import toast from "react-hot-toast";

// Query Keys
export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (filters: ApplicationFilters) =>
    [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
  recruiter: ["recruiter-applications"] as const,
  candidate: ["candidate-applications"] as const,
};

// Get recruiter's applications
export function useRecruiterApplications(filters?: ApplicationFilters) {
  return useQuery({
    queryKey: [...applicationKeys.recruiter, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        data?: Application[];
        applications?: Application[];
        pagination?: any;
        total?: number;
      }>("/recruiters/applications", { params: filters });
      return {
        applications: data?.applications || data?.data || [],
        total: data?.total || data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        totalPages: data?.pagination?.totalPages || 1,
      };
    },
  });
}

// Get applications for a specific job (recruiter)
export function useJobApplications(jobId: string, filters?: ApplicationFilters) {
  return useQuery({
    queryKey: ["job-applications", jobId, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        data?: Application[];
        applications?: Application[];
        pagination?: any;
        total?: number;
      }>(`/jobs/${jobId}/applications`, { params: filters });
      return {
        applications: data?.applications || data?.data || [],
        total: data?.total || data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        totalPages: data?.pagination?.totalPages || 1,
      };
    },
    enabled: !!jobId,
  });
}

// Get candidate's applications
export function useCandidateApplications(filters?: ApplicationFilters) {
  return useQuery({
    queryKey: [...applicationKeys.candidate, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        applications: Application[];
        total: number;
        page: number;
        totalPages: number;
      }>("/applications", { params: filters });
      return data;
    },
  });
}

// Get single application
export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Application>(
        `/applications/${id}`,
      );
      return (data as any)?.application || data;
    },
    enabled: !!id,
  });
}

// Update application status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ApplicationStatus;
    }) => {
      const { data } = await apiClient.patch<Application>(
        `/recruiters/applications/${id}/status`,
        { status },
      );
      return (data as any)?.application || data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: applicationKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: applicationKeys.recruiter });
      toast.success("Application status updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
}

// Apply for job (candidate)
export function useApplyForJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      resumeUrl,
      coverLetter,
      githubUrl,
      portfolioUrl,
    }: {
      jobId: string;
      resumeUrl: string;
      coverLetter?: string;
      githubUrl?: string;
      portfolioUrl?: string;
    }) => {
      const { data } = await apiClient.post<Application>(`/jobs/${jobId}/apply`, {
        resumeUrl,
        coverLetter,
        githubUrl,
        portfolioUrl,
      });
      return (data as any)?.application || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.candidate });
      toast.success("Application submitted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit application");
    },
  });
}

// Withdraw application (candidate)
export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/applications/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.candidate });
      toast.success("Application withdrawn successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to withdraw application",
      );
    },
  });
}
