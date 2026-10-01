import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export const recruiterKeys = {
  all: ["recruiters"] as const,
  dashboard: () => [...recruiterKeys.all, "dashboard"] as const,
  profile: () => [...recruiterKeys.all, "profile"] as const,
};

export function useRecruiterDashboard() {
  return useQuery({
    queryKey: recruiterKeys.dashboard(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        activeJobs: number;
        totalApplications: number;
        totalInterviews: number;
        availableCredits: number;
        recentApplications: any[];
      }>("/recruiters/dashboard");
      return data;
    },
  });
}

export function useRecruiterProfile() {
  return useQuery({
    queryKey: recruiterKeys.profile(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/recruiters/profile");
      return data;
    },
  });
}

export function useUpdateRecruiterProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.put<any>("/recruiters/profile", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recruiterKeys.profile() });
      toast.success("Recruiter profile updated!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
}
