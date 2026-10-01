export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface Payment {
  id: string;
  recruiterId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  creditsAdded: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditPackage {
  id: "10" | "25" | "50" | "100";
  credits: number;
  amountInr: number;
  currency: string;
  label: string;
}

export interface CreateOrderInput {
  creditPackageId: "10" | "25" | "50" | "100";
}

export interface CreateOrderResponse {
  id: string; // internal payment ID (orderId)
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;
}

export interface CreditBalance {
  interviewCredits: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionEndDate?: string | null;
  freeTrialCredits: number;
  freeTrialUsed: boolean;
}
