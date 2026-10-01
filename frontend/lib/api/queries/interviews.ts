import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export const interviewKeys = {
  all: ["interviews"] as const,
  session: (id: string) => [...interviewKeys.all, "session", id] as const,
  results: (id: string) => [...interviewKeys.all, "results", id] as const,
  recruiterResults: (id: string) => [...interviewKeys.all, "recruiter-results", id] as const,
};

export function useInterviewSession(sessionId: string) {
  return useQuery({
    queryKey: interviewKeys.session(sessionId),
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/interviews/${sessionId}`);
      return (data as any)?.session || data;
    },
    enabled: !!sessionId,
  });
}

export function useInterviewResults(sessionId: string) {
  return useQuery({
    queryKey: interviewKeys.results(sessionId),
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/interviews/${sessionId}/results`);
      return (data as any)?.session || (data as any)?.data || data;
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const session = query.state.data;
      // Auto-poll every 3s if evaluation is running or scorecard is not yet created
      if (!session || !session.scorecard || session.isEvaluating) {
        return 3000;
      }
      return false;
    },
  });
}

export function useRecruiterInterviewResults(sessionId: string) {
  return useQuery({
    queryKey: interviewKeys.recruiterResults(sessionId),
    queryFn: async () => {
      const { data } = await apiClient.get<any>(`/interviews/${sessionId}/recruiter-results`);
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      scheduledAt,
      message,
    }: {
      applicationId: string;
      scheduledAt: Date | string;
      message?: string;
    }) => {
      const { data } = await apiClient.post<any>("/recruiters/interviews/schedule", {
        applicationId,
        scheduledAt: typeof scheduledAt === "string" ? scheduledAt : scheduledAt.toISOString(),
        message,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["recruiters"] });
      toast.success("Interview scheduled successfully! Invitation sent to candidate.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to schedule interview");
    },
  });
}
