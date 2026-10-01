import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export const candidateKeys = {
  all: ["candidates"] as const,
  dashboard: () => [...candidateKeys.all, "dashboard"] as const,
  profile: () => [...candidateKeys.all, "profile"] as const,
  credits: () => [...candidateKeys.all, "credits"] as const,
  history: (page?: number) => [...candidateKeys.all, "history", page] as const,
};

export function useCandidateDashboard() {
  return useQuery({
    queryKey: candidateKeys.dashboard(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/candidates/dashboard");
      return data;
    },
  });
}

export function useCandidateProfile() {
  return useQuery({
    queryKey: candidateKeys.profile(),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/candidates/profile");
      return data;
    },
  });
}

export function useUpdateCandidateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: any) => {
      const { data } = await apiClient.put<any>("/candidates/profile", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.profile() });
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });
}

export function useResumeUploadUrl() {
  return useMutation({
    mutationFn: async ({
      fileName,
      contentType,
    }: {
      fileName: string;
      contentType: string;
    }) => {
      const { data } = await apiClient.post<any>("/candidates/resume/upload-url", { fileName, contentType });
      return data?.data || data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate upload URL");
    },
  });
}

export function useDirectResumeUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await apiClient.post<any>(
        "/candidates/resume/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data?.data || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.profile() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload resume");
    },
  });
}

export function useUpdateResumeInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resumeUrl,
      fileName,
    }: {
      resumeUrl: string;
      fileName: string;
    }) => {
      const { data } = await apiClient.put<any>("/candidates/resume", {
        resumeUrl,
        fileName,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.profile() });
      toast.success("Resume updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update resume info");
    },
  });
}

export function useCandidatePracticeCredits() {
  return useQuery({
    queryKey: candidateKeys.credits(),
    queryFn: async () => {
      const { data } = await apiClient.get<{
        practiceCredits: number;
        practiceCreditsUsed: number;
      }>("/candidates/practice-credits");
      return data;
    },
  });
}

export function useCandidateInterviewHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: candidateKeys.history(page),
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/candidates/interview-history", {
        params: { page, limit },
      });
      return data;
    },
  });
}

export interface CandidateCreditPackage {
  id: string;
  credits: number;
  amountInr: number;
  currency: string;
  label: string;
  description: string;
}

export function useCandidateCreditPackages() {
  return useQuery({
    queryKey: ["candidate", "creditPackages"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ packages: CandidateCreditPackage[] }>(
        "/credits/candidate/packages"
      );
      return data?.packages || [];
    },
  });
}

export function useCreateCandidateOrder() {
  return useMutation({
    mutationFn: async ({ packageId }: { packageId: string }) => {
      const response = await apiClient.post<any>("/credits/candidate/order", {
        packageId,
      });
      return response.data?.data || response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create payment order");
    },
  });
}

export function useVerifyCandidatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      packageId: string;
    }) => {
      const response = await apiClient.post<any>("/credits/candidate/verify", payload);
      return response.data?.data || response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.credits() });
      queryClient.invalidateQueries({ queryKey: candidateKeys.dashboard() });
      toast.success(data?.message || "Practice credits added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Payment verification failed");
    },
  });
}

export function usePurchaseCandidateCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId }: { packageId: string }) => {
      const { data } = await apiClient.post<any>("/credits/candidate/purchase", {
        packageId,
      });
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.credits() });
      queryClient.invalidateQueries({ queryKey: candidateKeys.dashboard() });
      toast.success(data?.message || "Practice credits added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to purchase practice credits");
    },
  });
}

export function useValidateFingerprint() {
  return useMutation({
    mutationFn: async ({ visitorId }: { visitorId: string }) => {
      const { data } = await apiClient.post<any>("/candidates/validate-fingerprint", {
        visitorId,
      });
      return data?.data || data;
    },
  });
}

