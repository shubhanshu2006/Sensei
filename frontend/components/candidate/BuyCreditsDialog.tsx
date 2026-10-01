"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCandidateCreditPackages,
  useCreateCandidateOrder,
  useVerifyCandidatePayment,
  useCandidatePracticeCredits,
  CandidateCreditPackage,
} from "@/lib/api/queries/candidates";
import { formatCurrency } from "@/lib/utils";
import { Zap, CheckCircle, Sparkles, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BuyCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_PACKAGES: CandidateCreditPackage[] = [
  {
    id: "cand_5",
    credits: 5,
    amountInr: 25,
    currency: "INR",
    label: "5 Credits",
    description: "5 Full AI Practice Interviews (₹5/interview) — ideal for focused preparation",
  },
  {
    id: "cand_10",
    credits: 10,
    amountInr: 45,
    currency: "INR",
    label: "10 Credits",
    description: "10 Full AI Practice Interviews with detailed bar-raiser scorecards (₹4.5/interview)",
  },
  {
    id: "cand_25",
    credits: 25,
    amountInr: 100,
    currency: "INR",
    label: "25 Credits",
    description: "25 Full AI Practice Interviews across all tracks & difficulty levels (₹4/interview)",
  },
];

import { QrPaymentDialog } from "@/components/credits/QrPaymentDialog";

export function BuyCreditsDialog({ open, onOpenChange }: BuyCreditsDialogProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>("cand_10");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: packagesData, isLoading: packagesLoading } = useCandidateCreditPackages();
  const { data: creditsData } = useCandidatePracticeCredits();
  const createOrderMutation = useCreateCandidateOrder();
  const verifyPaymentMutation = useVerifyCandidatePayment();

  const packages = packagesData && packagesData.length > 0 ? packagesData : DEFAULT_PACKAGES;
  const remaining = creditsData
    ? Math.max(0, creditsData.practiceCredits - creditsData.practiceCreditsUsed)
    : 0;

  const selectedPkg = packages.find((p) => p.id === selectedPackageId) || packages[0];

  // Preserved Razorpay purchase flow
  const handleRazorpayPurchase = async () => {
    if (!selectedPackageId) return;
    const pkg = packages.find((p) => p.id === selectedPackageId);
    if (!pkg) return;

    setIsProcessing(true);
    try {
      // 1. Create Razorpay order on backend
      const order = await createOrderMutation.mutateAsync({
        packageId: selectedPackageId,
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
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount, // in paise
        currency: order.currency || "INR",
        name: "Sensei AI",
        description: `${selectedPkg.label} (${selectedPkg.credits} Practice Interviews)`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: order.user?.name || "",
          email: order.user?.email || "",
        },
        handler: async function (response: any) {
          try {
            await verifyPaymentMutation.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              packageId: selectedPackageId,
            });
            onOpenChange(false);
          } catch (verifyError: any) {
            toast.error(verifyError.message || "Payment verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        theme: {
          color: "#f97316",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate Razorpay checkout");
      setIsProcessing(false);
    }
  };

  const handlePurchase = () => {
    setShowQrDialog(true);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="p-6 sm:p-7 max-w-xl w-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-slate-950">
            Top Up Practice Credits
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
          Each credit unlocks 1 full-length, real-time AI mock interview with adaptive technical follow-ups and an instant bar-raiser scorecard.
        </p>

        {/* Current Balance Capsule */}
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-slate-50 border border-orange-200/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-medium">
            <Zap className="h-4 w-4 text-orange-500 fill-orange-500" />
            <span>Current Available Balance:</span>
          </div>
          <Badge variant="brand" className="font-mono text-xs font-semibold px-2.5 py-0.5">
            {remaining} Credits
          </Badge>
        </div>

        {/* Packages List */}
        <div className="space-y-2.5 mb-6">
          {packagesLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          ) : (
            packages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              const isPopular = pkg.id === "cand_10";
              const isBestValue = pkg.id === "cand_50";
              const unitPrice = (pkg.amountInr / pkg.credits).toFixed(1).replace(/\.0$/, "");

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-orange-500 bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-transparent shadow-md shadow-orange-500/10 ring-2 ring-orange-500/10"
                      : "border-slate-200/80 hover:border-slate-300 bg-white"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      Most Popular
                    </span>
                  )}
                  {isBestValue && (
                    <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                      Best Value
                    </span>
                  )}
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {pkg.label}
                      </span>
                      <span className="text-[11px] font-medium text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-md">
                        {pkg.credits} {pkg.credits === 1 ? "Interview" : "Interviews"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-slate-900">
                      {formatCurrency(pkg.amountInr)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ₹{unitPrice}/session
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Guarantee Note */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
          <ShieldCheck className="h-4 w-4 text-orange-600 shrink-0" />
          <span>Credits never expire. Comprehensive speech & content scorecard included.</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || createOrderMutation.isPending || verifyPaymentMutation.isPending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isProcessing || createOrderMutation.isPending || verifyPaymentMutation.isPending}
            className="rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-md shadow-orange-500/20 gap-2 px-6"
          >
            {isProcessing || createOrderMutation.isPending || verifyPaymentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Proceed to Payment
          </Button>
        </div>
      </div>
    </Dialog>

    <QrPaymentDialog
      open={showQrDialog}
      onOpenChange={(isOpen) => {
        setShowQrDialog(isOpen);
        if (!isOpen) onOpenChange(false);
      }}
      packageId={selectedPkg.id}
      packageName={selectedPkg.label}
      credits={selectedPkg.credits}
      amountInr={selectedPkg.amountInr}
      userRole="CANDIDATE"
      onFallbackToRazorpay={handleRazorpayPurchase}
    />
    </>
  );
}
