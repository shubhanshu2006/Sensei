"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreditBalance,
  useCreditPackages,
  usePaymentHistory,
  useCreateOrder,
  useVerifyPayment,
} from "@/lib/api/queries/payments";
import { CreditPackage, Payment } from "@/types/payment.types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import { QrPaymentDialog } from "@/components/credits/QrPaymentDialog";
import { useMyCreditRequests } from "@/lib/api/queries/creditRequests";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CreditsPage() {
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [selectedQrPackage, setSelectedQrPackage] = useState<CreditPackage | null>(null);

  const { data: balance, isLoading: balanceLoading } = useCreditBalance();
  const { data: packagesData, isLoading: packagesLoading } = useCreditPackages();
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentHistory();
  const { data: myRequests, isLoading: requestsLoading } = useMyCreditRequests();
  const createOrderMutation = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();

  const packages: CreditPackage[] = Array.isArray(packagesData)
    ? packagesData
    : (packagesData as any)?.packages || [
        { id: "10", credits: 10, amountInr: 100, currency: "INR", label: "10 Credits Pack" },
        { id: "25", credits: 25, amountInr: 250, currency: "INR", label: "25 Credits Pack" },
        { id: "50", credits: 50, amountInr: 500, currency: "INR", label: "50 Credits Pack" },
        { id: "100", credits: 100, amountInr: 1000, currency: "INR", label: "100 Credits Pack" },
      ];

  const payments: Payment[] = Array.isArray(paymentsData)
    ? paymentsData
    : (paymentsData as any)?.payments || [];

  // Default UPI QR flow
  const handleBuyCredits = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;
    setSelectedQrPackage(pkg);
  };

  // Preserved Razorpay flow
  const handleRazorpayBuyCredits = async (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    setLoadingPackageId(packageId);

    try {
      // 1. Create order on backend
      const order = await createOrderMutation.mutateAsync({
        creditPackageId: pkg.id as "10" | "25" | "50" | "100",
      });

      // 2. Load Razorpay Checkout Script if not loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount * 100, // paise
        currency: order.currency || "INR",
        name: "Sensei AI",
        description: pkg.label,
        order_id: order.razorpayOrderId,
        handler: async function (response: any) {
          // 4. Verify payment with all 4 required fields
          await verifyPaymentMutation.mutateAsync({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: order.id,
          });
        },
        theme: {
          color: "#10b981",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setLoadingPackageId(null);
    }
  };

  return (
    <DashboardLayout role="RECRUITER">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">Credits & Billing</h1>
          <p className="mt-1 text-slate-600">
            Manage your AI interview credits and purchase top-ups
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Available Credits</p>
                {balanceLoading ? (
                  <Skeleton className="mt-2 h-9 w-24" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {balance?.interviewCredits ?? 0}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">For scheduling interviews</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Free Trial Credits</p>
                {balanceLoading ? (
                  <Skeleton className="mt-2 h-9 w-24" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {balance?.freeTrialCredits ?? 0}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {balance?.freeTrialUsed ? "Trial consumed" : "Trial active"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Subscription Plan</p>
                {balanceLoading ? (
                  <Skeleton className="mt-2 h-9 w-24" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {(balance?.subscriptionPlan || "FREE_TRIAL").replace(/_/g, " ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Status: {balance?.subscriptionStatus || "ACTIVE"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Credit Packages Grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Purchase Interview Credits</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packagesLoading ? (
              <>
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </>
            ) : (
              packages.map((pkg) => (
                <Card key={pkg.id} className="p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{pkg.label}</h3>
                    <p className="mt-2 text-3xl font-bold text-emerald-600">
                      {formatCurrency(pkg.amountInr)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ₹{(pkg.amountInr / pkg.credits).toFixed(2)} per AI interview
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>{pkg.credits} Full Voice Interviews</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>AI Candidate Scorecards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span>Automated Email Invites</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleBuyCredits(pkg.id)}
                    disabled={loadingPackageId === pkg.id}
                    className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loadingPackageId === pkg.id ? "Processing..." : `Buy ${pkg.credits} Credits`}
                  </Button>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* UPI Credit Requests & UTR Verification */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                UPI QR Payment Requests & Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status of your submitted UTR numbers for interview credits
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {myRequests?.length || 0} Requests
            </Badge>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : !myRequests || myRequests.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No pending or submitted UPI requests. Click any package above to pay via UPI QR.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRequests.map((req: any) => (
                <div key={req.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">
                        {req.packageName} (+{req.credits} Credits)
                      </p>
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        UTR: {req.utrNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {req.createdAt ? formatDate(req.createdAt) : "Recently"}
                      {req.adminNote ? ` • Note: ${req.adminNote}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 text-sm">
                      {formatCurrency(Number(req.amount))}
                    </p>
                    {req.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Approval
                      </span>
                    )}
                    {req.status === "APPROVED" && (
                      <Badge variant="success">Approved</Badge>
                    )}
                    {req.status === "REJECTED" && (
                      <Badge variant="destructive">Rejected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Razorpay Completed Payment History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h2>
          {paymentsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Clock className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      Added {p.creditsAdded} Credits
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.createdAt ? formatDate(p.createdAt) : "Recently"} • ID: {p.razorpayPaymentId || p.razorpayOrderId || p.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(Number(p.amount))}
                    </p>
                    <Badge variant={p.status === "COMPLETED" ? "success" : "warning"}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* QR Payment Dialog */}
        {selectedQrPackage && (
          <QrPaymentDialog
            open={!!selectedQrPackage}
            onOpenChange={(isOpen) => {
              if (!isOpen) setSelectedQrPackage(null);
            }}
            packageId={selectedQrPackage.id}
            packageName={selectedQrPackage.label}
            credits={selectedQrPackage.credits}
            amountInr={selectedQrPackage.amountInr}
            userRole="RECRUITER"
            onFallbackToRazorpay={() => {
              const pkgId = selectedQrPackage.id;
              setSelectedQrPackage(null);
              handleRazorpayBuyCredits(pkgId);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
