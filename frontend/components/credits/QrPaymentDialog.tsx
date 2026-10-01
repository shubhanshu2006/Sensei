"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  useQrPaymentConfig,
  useSubmitCreditRequest,
} from "@/lib/api/queries/creditRequests";
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import toast from "react-hot-toast";

interface QrPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  packageName: string;
  credits: number;
  amountInr: number;
  userRole: "CANDIDATE" | "RECRUITER";
  onSuccess?: () => void;
  onFallbackToRazorpay?: () => void;
}

export function QrPaymentDialog({
  open,
  onOpenChange,
  packageId,
  packageName,
  credits,
  amountInr,
  userRole,
  onSuccess,
  onFallbackToRazorpay,
}: QrPaymentDialogProps) {
  const [utrNumber, setUtrNumber] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submittedUtr, setSubmittedUtr] = useState<string | null>(null);

  const { data: qrConfig, isLoading: configLoading } = useQrPaymentConfig();
  const submitRequestMutation = useSubmitCreditRequest();

  const upiId = qrConfig?.upiId || "sensei@upi";
  const payeeName = qrConfig?.upiName || "Sensei AI";

  // Build standard UPI Payment Intent URL
  const note = `Sensei ${credits} Credits (${packageId})`;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName,
  )}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(note)}`;

  // Reliable dynamic QR Code generator URL
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiUrl,
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      toast.error("Please enter the 12-digit UTR / UPI transaction reference number.");
      return;
    }

    if (cleanUtr.length < 6) {
      toast.error("UTR number seems too short. Please verify your receipt.");
      return;
    }

    try {
      await submitRequestMutation.mutateAsync({
        packageId,
        utrNumber: cleanUtr,
        userRole,
      });

      setSubmittedUtr(cleanUtr);
      if (onSuccess) onSuccess();
    } catch {
      // Handled by mutation onError toast
    }
  };

  const handleResetAndClose = () => {
    setUtrNumber("");
    setSubmittedUtr(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleResetAndClose} maxWidth="xl">
      <div className="p-6 sm:p-7 max-w-xl w-full">
        {submittedUtr ? (
          // Success Screen
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-md shadow-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900 font-serif">
                Payment Request Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                Thank you! Your UTR number has been received and queued for review.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-left space-y-2 text-xs text-slate-700">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Selected Package:</span>
                <span className="font-semibold text-slate-900">{packageName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Credits to Allot:</span>
                <span className="font-semibold text-orange-600">
                  +{credits} {userRole === "RECRUITER" ? "Interview" : "Practice"} Credits
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(amountInr)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Submitted UTR / Ref:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {submittedUtr}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-orange-50 border border-orange-200/60 p-3 text-xs text-orange-800 text-left flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <span>
                <strong>Verification Process:</strong> The Super Admin will verify the UTR with our bank ledger and approve the credits directly into your account balance shortly.
              </span>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleResetAndClose}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium"
              >
                Done & Return to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          // QR Payment Form
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-700 mb-2">
                  <Sparkles className="h-3 w-3 text-orange-500" />
                  <span>Instant UPI Settlement</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-slate-950">
                  Pay with UPI QR Code
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app
                </p>
              </div>

              {/* Package Summary Badge */}
              <div className="text-right shrink-0 bg-gradient-to-br from-orange-50 to-pink-50/40 border border-orange-200/60 rounded-2xl px-3.5 py-2">
                <div className="text-[11px] font-medium text-slate-500">Amount Due</div>
                <div className="text-xl font-bold text-slate-950">{formatCurrency(amountInr)}</div>
                <div className="text-[10px] font-semibold text-orange-600">
                  +{credits} {userRole === "RECRUITER" ? "Interview" : "Practice"} Credits
                </div>
              </div>
            </div>

            {/* QR Code & UPI Details Layout */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5 items-center">
              {/* QR Container */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-orange-300 bg-gradient-to-b from-orange-50/50 to-white shadow-sm">
                <div className="relative overflow-hidden rounded-xl bg-white p-2 border border-slate-200 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeImageUrl}
                    alt="UPI Payment QR Code"
                    width={180}
                    height={180}
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="bg-slate-900/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-full shadow">
                      Scan to Pay ₹{amountInr}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <a
                    href={upiUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 underline sm:hidden"
                  >
                    <Smartphone className="h-3 w-3" />
                    Tap to open UPI App
                  </a>
                </div>
              </div>

              {/* UPI ID & Steps */}
              <div className="space-y-3">
                {/* Copy UPI Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Payee VPA / UPI ID:</span>
                    <span className="text-slate-400 font-normal">Verified</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 select-all truncate">
                      {upiId}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUpi}
                      className="h-7 px-2.5 text-[11px] rounded-lg border-slate-300 hover:bg-white shrink-0 gap-1"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Payee Name: <strong className="text-slate-700">{payeeName}</strong>
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 mt-0.5">
                      1
                    </span>
                    <span>Scan QR or pay <strong>₹{amountInr}</strong> to the UPI ID.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 mt-0.5">
                      2
                    </span>
                    <span>
                      Copy the <strong>12-digit UTR / UPI Ref ID</strong> from your transaction receipt.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 mt-0.5">
                      3
                    </span>
                    <span>Paste it below and submit for instant admin credit approval.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* UTR Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Enter 12-Digit UTR / UPI Reference Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                    placeholder="e.g. 423819827465"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white font-mono text-sm tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase"
                    maxLength={30}
                  />
                  {utrNumber && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                      {utrNumber.length} chars
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-slate-400" />
                  Found in your GPay / PhonePe / Paytm payment success screen under &quot;UPI Ref No.&quot; or &quot;UTR&quot;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={submitRequestMutation.isPending}
                  className="rounded-xl text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitRequestMutation.isPending || !utrNumber.trim()}
                  className="rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium shadow-md shadow-orange-500/20 px-5 gap-2 text-xs sm:text-sm"
                >
                  {submitRequestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Submit UTR for Approval
                </Button>
              </div>
            </form>

            {/* Trust badge */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Super Admin Settlement • Credits guaranteed upon UTR verification</span>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
