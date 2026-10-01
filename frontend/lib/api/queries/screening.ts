import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { ScreeningReport } from "@/types/application.types";
import toast from "react-hot-toast";

export const screeningKeys = {
  all: ["screening"] as const,
  report: (applicationId: string) => [...screeningKeys.all, "report", applicationId] as const,
};

export function useScreeningReport(applicationId: string) {
  return useQuery({
    queryKey: screeningKeys.report(applicationId),
    queryFn: async () => {
      const { data } = await apiClient.get<ScreeningReport>(
        `/screening/${applicationId}/report`,
      );
      return (data as any)?.report || data;
    },
    enabled: !!applicationId,
  });
}

export function useTriggerScreening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { data } = await apiClient.post<any>(
        `/screening/${applicationId}/trigger`,
      );
      return data;
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({
        queryKey: screeningKeys.report(applicationId),
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("AI screening started! Results will be ready shortly.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to trigger AI screening");
    },
  });
}
