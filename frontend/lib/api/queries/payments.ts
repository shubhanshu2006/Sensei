import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type {
  Payment,
  CreditPackage,
  CreateOrderInput,
  CreateOrderResponse,
  VerifyPaymentInput,
  CreditBalance,
} from "@/types/payment.types";
import toast from "react-hot-toast";

// Query Keys
export const paymentKeys = {
  all: ["payments"] as const,
  list: () => [...paymentKeys.all, "list"] as const,
  balance: ["credit-balance"] as const,
  packages: ["credit-packages"] as const,
};

// Get credit packages
export function useCreditPackages() {
  return useQuery({
    queryKey: paymentKeys.packages,
    queryFn: async () => {
      const { data } = await apiClient.get<{ packages: CreditPackage[] } | CreditPackage[]>(
        "/credits/packages",
      );
      return (data as any)?.packages || data;
    },
  });
}

// Get credit balance
export function useCreditBalance() {
  return useQuery({
    queryKey: paymentKeys.balance,
    queryFn: async () => {
      const { data } = await apiClient.get<CreditBalance>(
        "/credits/recruiter/balance",
      );
      return data;
    },
  });
}

// Get payment history
export function usePaymentHistory() {
  return useQuery({
    queryKey: paymentKeys.list(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ payments: Payment[] } | Payment[]>(
        "/payments/history",
      );
      return (data as any)?.payments || data;
    },
  });
}

// Create Razorpay order
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data } = await apiClient.post<CreateOrderResponse>(
        "/payments/orders",
        input,
      );
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create order");
    },
  });
}

// Verify payment
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: VerifyPaymentInput) => {
      const { data } = await apiClient.post<Payment>(
        "/payments/verify",
        input,
      );
      return (data as any)?.payment || data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.balance });
      queryClient.invalidateQueries({ queryKey: paymentKeys.list() });
      toast.success("Payment successful! Credits added to your account.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Payment verification failed");
    },
  });
}
