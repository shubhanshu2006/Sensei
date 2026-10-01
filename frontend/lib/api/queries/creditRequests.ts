import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import toast from "react-hot-toast";

export interface QrConfig {
  upiId: string;
  upiName: string;
  mode: string;
  isQrActive: boolean;
}

export interface CreditPurchaseRequest {
  id: string;
  userId: string;
  userRole: "CANDIDATE" | "RECRUITER";
  packageId: string;
  packageName: string;
  credits: number;
  amount: number;
  currency: string;
  utrNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    name: string;
    role: string;
  };
}

export interface AdminCreditRequestsResponse {
  requests: CreditPurchaseRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: {
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalApprovedAmount: number;
    totalApprovedCredits: number;
  };
}

export const creditRequestKeys = {
  all: ["creditRequests"] as const,
  qrConfig: () => [...creditRequestKeys.all, "qrConfig"] as const,
  myList: () => [...creditRequestKeys.all, "myList"] as const,
  adminList: (filters?: Record<string, any>) =>
    [...creditRequestKeys.all, "adminList", filters] as const,
};

/**
 * Fetch UPI QR configuration (UPI ID, payee name, mode)
 */
export function useQrPaymentConfig() {
  return useQuery({
    queryKey: creditRequestKeys.qrConfig(),
    queryFn: async () => {
      const { data } = await apiClient.get<QrConfig>("/credits/qr-config");
      return (data as any)?.data || data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Submit a credit purchase request with UPI UTR number
 */
export function useSubmitCreditRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      packageId: string;
      utrNumber: string;
      userRole?: "CANDIDATE" | "RECRUITER";
    }) => {
      const { data } = await apiClient.post<CreditPurchaseRequest>(
        "/credits/request",
        payload,
      );
      return (data as any)?.data || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditRequestKeys.myList() });
      toast.success(
        "Payment submitted for verification! Credits will be allotted upon admin review.",
        { duration: 5000 },
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit credit request. Please check your UTR number.",
      );
    },
  });
}

/**
 * Fetch all credit requests submitted by the logged-in user
 */
export function useMyCreditRequests() {
  return useQuery({
    queryKey: creditRequestKeys.myList(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ requests: CreditPurchaseRequest[] }>(
        "/credits/requests/my",
      );
      return (data as any)?.data?.requests || (data as any)?.requests || [];
    },
  });
}

/**
 * Super Admin: Fetch all credit requests with pagination & filters
 */
export function useAdminCreditRequests(filters: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
} = {}) {
  return useQuery({
    queryKey: creditRequestKeys.adminList(filters),
    queryFn: async (): Promise<AdminCreditRequestsResponse> => {
      const { data } = await apiClient.get<AdminCreditRequestsResponse>(
        "/admin/credits/requests",
        { params: filters },
      );
      return ((data as any)?.data || data) as AdminCreditRequestsResponse;
    },
    refetchInterval: 15000, // auto-refresh every 15s for real-time approvals
  });
}

/**
 * Super Admin: Approve a credit request
 */
export function useApproveCreditRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data } = await apiClient.patch<any>(
        `/admin/credits/requests/${id}/approve`,
      );
      return (data as any)?.data || data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: creditRequestKeys.all });
      toast.success(data?.message || "Credit request approved and credits allotted successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to approve credit request",
      );
    },
  });
}

/**
 * Super Admin: Reject a credit request
 */
export function useRejectCreditRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const { data } = await apiClient.patch<any>(
        `/admin/credits/requests/${id}/reject`,
        { note },
      );
      return (data as any)?.data || data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: creditRequestKeys.all });
      toast.success(data?.message || "Credit request rejected");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to reject credit request",
      );
    },
  });
}
