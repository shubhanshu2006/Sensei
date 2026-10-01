import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export interface PracticeJob {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  requiredSkills: string[];
  technologies?: string[];
  estimatedDuration?: number;
  isFeatured: boolean;
  practiceCount: number;
  averageScore?: number;
}

export const practiceKeys = {
  all: ["practice"] as const,
  list: (filters?: any) => [...practiceKeys.all, "list", filters] as const,
  detail: (id: string) => [...practiceKeys.all, "detail", id] as const,
};

export function usePracticeJobs(filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
  isFeatured?: boolean;
}) {
  return useQuery({
    queryKey: practiceKeys.list(filters),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/practice", { params: { limit: 100, ...filters } });
      // Backend returns { data: PracticeJob[], pagination: { total, page, totalPages, ... } }
      const jobs = data?.data || data?.jobs || (Array.isArray(data) ? data : []);
      return {
        jobs: jobs as PracticeJob[],
        total: data?.pagination?.total ?? jobs.length,
        page: data?.pagination?.page ?? 1,
        totalPages: data?.pagination?.totalPages ?? 1,
      };
    },
  });
}

export function usePracticeJob(id: string) {
  return useQuery({
    queryKey: practiceKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeJob>(`/practice/${id}`);
      return (data as any)?.job || data;
    },
    enabled: !!id,
  });
}

export function useStartPractice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      practiceJobId,
      resumeUrl,
    }: {
      practiceJobId: string;
      resumeUrl?: string;
    }) => {
      const response = await apiClient.post<any>(`/practice/${practiceJobId}/start`, { resumeUrl });
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: practiceKeys.all });
      toast.success("Practice session initialized!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start practice session");
    },
  });
}
