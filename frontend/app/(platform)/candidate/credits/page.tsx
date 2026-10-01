"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCandidatePracticeCredits,
  useCandidateCreditPackages,
  useCreateCandidateOrder,
  useVerifyCandidatePayment,
  CandidateCreditPackage,
} from "@/lib/api/queries/candidates";
import { formatCurrency } from "@/lib/utils";
import {
  Zap,
  CheckCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { QrPaymentDialog } from "@/components/credits/QrPaymentDialog";
import { useMyCreditRequests } from "@/lib/api/queries/creditRequests";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DEFAULT_PACKAGES: CandidateCreditPackage[] = [
  {
    id: "cand_5",
    credits: 5,
    amountInr: 25,
    currency: "INR",
    label: "Sprint Pack",
    description: "5 Full AI Practice Interviews (₹5/interview) — ideal for focused preparation",
  },
  {
    id: "cand_10",
    credits: 10,
    amountInr: 45,
    currency: "INR",
    label: "Pro Pack",
    description: "10 Full AI Practice Interviews with detailed competency breakdown & speech analytics (₹4.5/interview)",
  },
  {
    id: "cand_25",
    credits: 25,
    amountInr: 100,
    currency: "INR",
    label: "Placement Pack",
    description: "25 Full AI Practice Interviews across technical, behavioral, and system design tracks (₹4/interview)",
  },
];

export default function CandidateCreditsPage() {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [selectedQrPackage, setSelectedQrPackage] = useState<CandidateCreditPackage | null>(null);
  const { data: creditsData, isLoading: creditsLoading } = useCandidatePracticeCredits();
  const { data: packagesData, isLoading: packagesLoading } = useCandidateCreditPackages();
  const { data: myRequests, isLoading: requestsLoading } = useMyCreditRequests();
  const createOrderMutation = useCreateCandidateOrder();
  const verifyPaymentMutation = useVerifyCandidatePayment();

  const packages = packagesData && packagesData.length > 0 ? packagesData : DEFAULT_PACKAGES;

  const totalCredits = creditsData?.practiceCredits ?? 2;
  const creditsUsed = creditsData?.practiceCreditsUsed ?? 0;
  const availableCredits = Math.max(0, totalCredits - creditsUsed);

  // Default flow: open UPI QR payment dialog
  const handleBuy = (pkg: CandidateCreditPackage) => {
    setSelectedQrPackage(pkg);
  };

  // Preserved Razorpay flow
  const handleRazorpayBuy = async (pkg: CandidateCreditPackage) => {
    setPurchasingId(pkg.id);
    try {
      // 1. Create Razorpay order on backend
      const order = await createOrderMutation.mutateAsync({
        packageId: pkg.id,
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
        description: `${pkg.label} (${pkg.credits} Practice Interviews)`,
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
              packageId: pkg.id,
            });
          } catch (verifyError: any) {
            toast.error(verifyError.message || "Payment verification failed");
          } finally {
            setPurchasingId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPurchasingId(null);
          },
        },
        theme: {
          color: "#f97316",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      setPurchasingId(null);
    }
  };

  return (
    <DashboardLayout role="CANDIDATE">
      <div className="space-y-8 max-w-6xl pb-12 font-sans">
        {/* Header Banner - Clean luminous styling */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-orange-50/20 to-pink-50/15 p-8 sm:p-10 border border-slate-200/90 text-slate-900 shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-semibold text-orange-600 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                <span>Transparent AI Practice Packs</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Practice Credits & Plans
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Every candidate starts with complimentary credits. Top up on-demand to keep sharpening your responses, body language, and voice pacing with live AI feedback.
              </p>
            </div>
            <Link href="/candidate/practice" className="shrink-0">
              <Button className="h-11 px-5 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-md shadow-orange-500/20 transition-all gap-2">
                <GraduationCap className="h-4 w-4" />
                Explore Practice Tracks
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Credit Telemetry Bento */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Card className="p-6 rounded-2xl border-orange-200/80 bg-gradient-to-br from-orange-500/5 via-pink-500/5 to-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                  Available Credits
                </p>
                {creditsLoading ? (
                  <Skeleton className="mt-2 h-9 w-20" />
                ) : (
                  <p className="mt-2 text-4xl font-bold text-slate-950">
                    {availableCredits}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Ready for live mock interviews
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/20">
                <Zap className="h-6 w-6 fill-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Allocated
                </p>
                {creditsLoading ? (
                  <Skeleton className="mt-2 h-9 w-20" />
                ) : (
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {totalCredits}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Welcome credits + pack refills
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/60">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Completed Sessions
                </p>
                {creditsLoading ? (
                  <Skeleton className="mt-2 h-9 w-20" />
                ) : (
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {creditsUsed}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Full evaluations saved in history
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 border border-pink-100">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Pricing Packages Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Choose a Practice Credit Pack
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Transparent pricing per interview session. No subscriptions, credits never expire.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packagesLoading ? (
              <>
                <Skeleton className="h-80 rounded-3xl" />
                <Skeleton className="h-80 rounded-3xl" />
                <Skeleton className="h-80 rounded-3xl" />
              </>
            ) : (
              packages.map((pkg) => {
                const isPopular = pkg.id === "cand_10";
                const isBestValue = pkg.id === "cand_50";
                const isPurchasing = purchasingId === pkg.id;
                const unitPrice = (pkg.amountInr / pkg.credits).toFixed(1).replace(/\.0$/, "");

                return (
                  <Card
                    key={pkg.id}
                    className={`relative flex flex-col justify-between p-7 rounded-3xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                      isPopular
                        ? "border-2 border-orange-500 shadow-md shadow-orange-500/10 ring-4 ring-orange-500/10 bg-gradient-to-b from-orange-500/[0.03] to-white"
                        : isBestValue
                        ? "border-2 border-pink-500 shadow-md shadow-pink-500/10 ring-4 ring-pink-500/10 bg-gradient-to-b from-pink-500/[0.03] to-white"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md shadow-orange-500/25">
                        Most Popular
                      </div>
                    )}
                    {isBestValue && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md shadow-pink-500/25">
                        Best Value
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">
                          {pkg.label}
                        </h3>
                        <Badge
                          variant={isPopular ? "brand" : "secondary"}
                          className="font-mono text-xs"
                        >
                          {pkg.credits} {pkg.credits === 1 ? "Session" : "Sessions"}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 min-h-[32px] leading-relaxed">
                        {pkg.description}
                      </p>

                      <div className="mt-6 pb-6 border-b border-slate-100 flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-950">
                          {formatCurrency(pkg.amountInr)}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          (₹{unitPrice} / session)
                        </span>
                      </div>

                      <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-600">
                        <li className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-slate-900">
                            {pkg.credits} Full AI Mock Interviews
                          </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                          <span>Real-time dynamic voice dialogue</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                          <span>Adaptive role tracks (Tech, Sales, HR, etc.)</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                          <span>Comprehensive bar-raiser scorecard</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-orange-600 shrink-0">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-medium text-slate-800">Credits never expire</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-8 pt-2">
                      <Button
                        onClick={() => handleBuy(pkg)}
                        disabled={isPurchasing || createOrderMutation.isPending || verifyPaymentMutation.isPending}
                        className={`w-full h-11 rounded-xl font-medium transition-all ${
                          isPopular || isBestValue
                            ? "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md shadow-orange-500/20"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        {isPurchasing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isPurchasing ? "Preparing Checkout..." : `Get ${pkg.credits} Credits`}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Feature & Transparency Notice */}
        <Card className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/5 via-pink-500/5 to-transparent border border-orange-200/50 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-orange-200/60 text-orange-600">
              <ShieldCheck className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                Fair & Transparent Practice Guarantee
              </h4>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                Credits are strictly consumed upon session completion. In the rare event of browser disruptions or audio disconnection, interview sessions can be recovered or retried without losing credits. Detailed transcripts and evaluation analytics remain saved in your dashboard permanently.
              </p>
            </div>
          </div>
        </Card>

        {/* UPI Credit Requests & UTR Verification Status */}
        <Card className="p-6 sm:p-7 rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                <span>UPI Payment Requests & UTR Status</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track verification progress of your submitted UPI payments
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {myRequests?.length || 0} Total
            </Badge>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
            </div>
          ) : !myRequests || myRequests.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
              <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No UPI requests submitted yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                When you pay via UPI QR and submit a UTR number, it will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {req.packageName}
                      </span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
                        +{req.credits} Credits
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>UTR: <strong className="font-mono text-slate-800">{req.utrNumber}</strong></span>
                      <span>•</span>
                      <span>
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {req.adminNote && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600">Note: {req.adminNote}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-slate-900">
                      {formatCurrency(Number(req.amount))}
                    </span>
                    {req.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Super Admin Approval
                      </span>
                    )}
                    {req.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        Approved & Credited
                      </span>
                    )}
                    {req.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="h-3 w-3 text-rose-600" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Dynamic QR Payment Dialog */}
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
            userRole="CANDIDATE"
            onFallbackToRazorpay={() => {
              const pkg = selectedQrPackage;
              setSelectedQrPackage(null);
              handleRazorpayBuy(pkg);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
