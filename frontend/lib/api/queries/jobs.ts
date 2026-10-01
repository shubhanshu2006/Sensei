import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type {
  Job,
  CreateJobInput,
  UpdateJobInput,
  JobFilters,
  JobStatus,
} from "@/types/job.types";
import toast from "react-hot-toast";

// Query Keys
export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

// Get all jobs (with filters)
export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: jobKeys.list(filters || {}),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/jobs", { params: filters });
      const list = data?.jobs || data?.data || (Array.isArray(data) ? data : []);
      return {
        jobs: list as Job[],
        total: data?.pagination?.total ?? data?.total ?? list.length,
        page: data?.pagination?.page ?? data?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? data?.totalPages ?? 1,
      };
    },
  });
}

// Get single job
export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Job>(`/jobs/${id}`);
      return (data as any)?.job || data;
    },
    enabled: !!id,
  });
}

// Get recruiter's jobs
export function useRecruiterJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ["recruiter-jobs", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/jobs/my", { params: filters });
      const list = data?.jobs || data?.data || (Array.isArray(data) ? data : []);
      return {
        jobs: list as Job[],
        total: data?.pagination?.total ?? data?.total ?? list.length,
        page: data?.pagination?.page ?? data?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? data?.totalPages ?? 1,
      };
    },
  });
}

// Create job
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const { data } = await apiClient.post<Job>("/jobs", input);
      return (data as any)?.job || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      toast.success("Job created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create job");
    },
  });
}

// Update job
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateJobInput) => {
      const { data } = await apiClient.put<Job>(`/jobs/${id}`, input);
      return (data as any)?.job || data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      toast.success("Job updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update job");
    },
  });
}

// Update job status
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobStatus }) => {
      const { data } = await apiClient.patch<Job>(
        `/jobs/${id}/status`,
        { status },
      );
      return (data as any)?.job || data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      toast.success("Job status updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
}

// Delete job
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/jobs/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      toast.success("Job deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete job");
    },
  });
}
