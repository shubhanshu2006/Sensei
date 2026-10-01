"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useAdminCreditRequests,
  useApproveCreditRequest,
  useRejectCreditRequest,
  CreditPurchaseRequest,
} from "@/lib/api/queries/creditRequests";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Check,
  Copy,
  AlertTriangle,
  User as UserIcon,
  ShieldCheck,
  Filter,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCreditsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Modals state
  const [approvingRequest, setApprovingRequest] = useState<CreditPurchaseRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<CreditPurchaseRequest | null>(null);
  const [rejectNote, setRejectNote] = useState<string>("");

  const { data, isLoading, refetch, isFetching } = useAdminCreditRequests({
    status: statusFilter,
    role: roleFilter,
    search: search.trim() || undefined,
    page,
    limit: 20,
  });

  const approveMutation = useApproveCreditRequest();
  const rejectMutation = useRejectCreditRequest();

  const requests: CreditPurchaseRequest[] = (data?.requests as CreditPurchaseRequest[]) || [];
  const metrics = data?.metrics || {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalApprovedAmount: 0,
    totalApprovedCredits: 0,
  };
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    toast.success("UTR copied!");
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleConfirmApprove = async () => {
    if (!approvingRequest) return;
    try {
      await approveMutation.mutateAsync({ id: approvingRequest.id });
      setApprovingRequest(null);
    } catch {
      // Handled by mutation onError toast
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    try {
      await rejectMutation.mutateAsync({
        id: rejectingRequest.id,
        note: rejectNote.trim() || "Transaction reference could not be verified.",
      });
      setRejectingRequest(null);
      setRejectNote("");
    } catch {
      // Handled by mutation onError toast
    }
  };

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-600" />
              <span>Super Admin Financial Desk</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              UPI Credit Requests & Approvals
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Verify UTR transaction reference numbers and approve interview/practice credits
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-xl border-slate-200 text-xs gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pending Verification Card */}
          <Card className={`p-6 rounded-2xl transition-all ${
            metrics.pendingCount > 0
              ? "border-amber-300 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white ring-2 ring-amber-500/20 shadow-md"
              : "border-slate-200/80 bg-white"
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Pending Approvals
                </p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-9 w-16" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-slate-950 flex items-center gap-2">
                    {metrics.pendingCount}
                    {metrics.pendingCount > 0 && (
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </p>
                )}
                <p className="mt-1 text-xs text-amber-700 font-medium">
                  {metrics.pendingCount > 0 ? "Requires verification" : "All cleared"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>

          {/* Approved Requests */}
          <Card className="p-6 rounded-2xl border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Approved Transactions
                </p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-9 w-16" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {metrics.approvedCount}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Successfully credited
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </Card>

          {/* Credits Allotted */}
          <Card className="p-6 rounded-2xl border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Credits Allotted
                </p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-9 w-20" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-orange-600">
                    {metrics.totalApprovedCredits}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Practice + interview credits
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </Card>

          {/* Total Amount Settled */}
          <Card className="p-6 rounded-2xl border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Revenue Settled
                </p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-9 w-24" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatCurrency(metrics.totalApprovedAmount)}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Verified UPI payments
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4 sm:p-5 rounded-2xl border-slate-200/80 bg-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
              {[
                { id: "PENDING", label: "Pending Verification", count: metrics.pendingCount },
                { id: "APPROVED", label: "Approved", count: metrics.approvedCount },
                { id: "REJECTED", label: "Rejected", count: metrics.rejectedCount },
                { id: "ALL", label: "All Requests", count: null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    statusFilter === tab.id
                      ? "bg-white text-slate-950 font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        tab.id === "PENDING" && tab.count > 0
                          ? "bg-amber-100 text-amber-800 font-bold"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Role Filter & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="ALL">All User Roles</option>
                <option value="CANDIDATE">Candidates Only</option>
                <option value="RECRUITER">Recruiters Only</option>
              </select>

              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search UTR, email, name..."
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Requests List */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <CreditCard className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                No credit requests found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {statusFilter === "PENDING"
                  ? "Great job! There are currently no pending UPI payment requests awaiting review."
                  : "No requests match the selected filters or search keyword."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-slate-500 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-5">Package & Credits</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">UTR / Transaction Ref</th>
                    <th className="py-3.5 px-5">Submitted At</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req: CreditPurchaseRequest) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* User Column */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 text-orange-700 font-bold text-xs uppercase">
                            {req.user?.firstName?.[0] || req.user?.email?.[0] || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {req.user?.name || req.user?.email}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {req.user?.email}
                            </p>
                            <span
                              className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.2 rounded-md ${
                                req.userRole === "RECRUITER"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {req.userRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Package Column */}
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900">
                          {req.packageName}
                        </p>
                        <p className="text-orange-600 font-bold text-[11px] mt-0.5">
                          +{req.credits} {req.userRole === "RECRUITER" ? "Interview" : "Practice"} Credits
                        </p>
                      </td>

                      {/* Amount Column */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-950 text-sm">
                          {formatCurrency(req.amount)}
                        </span>
                      </td>

                      {/* UTR Column */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <span className="font-mono text-xs font-bold text-slate-900 select-all">
                            {req.utrNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUtr(req.utrNumber)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
                            title="Copy UTR"
                          >
                            {copiedUtr === req.utrNumber ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date Column */}
                      <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                        <p>{formatDate(req.createdAt)}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(req.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {req.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                              Approved
                            </span>
                            {req.approvedAt && (
                              <p className="text-[10px] text-slate-400 pl-1">
                                {formatDate(req.approvedAt)}
                              </p>
                            )}
                          </div>
                        )}
                        {req.status === "REJECTED" && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                              Rejected
                            </span>
                            {req.adminNote && (
                              <p className="text-[10px] text-rose-600 max-w-xs truncate pl-1" title={req.adminNote}>
                                {req.adminNote}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {req.status === "PENDING" ? (
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => setApprovingRequest(req)}
                              className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1 shadow-sm"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approve & Credit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectingRequest(req);
                                setRejectNote("");
                              }}
                              className="h-8 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} requests)
              </span>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg h-8 px-3"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Approve Confirmation Modal */}
        <Dialog
          open={!!approvingRequest}
          onOpenChange={(isOpen) => {
            if (!isOpen) setApprovingRequest(null);
          }}
          maxWidth="md"
        >
          {approvingRequest && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">
                    Approve Credit Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify UTR and credit {approvingRequest.credits} credits to the user account
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">User:</span>
                  <span className="font-semibold text-slate-900">{approvingRequest.user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Role:</span>
                  <span className="font-semibold text-slate-900">{approvingRequest.userRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Package:</span>
                  <span className="font-semibold text-slate-900">{approvingRequest.packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credits to Allot:</span>
                  <span className="font-bold text-orange-600">+{approvingRequest.credits} Credits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Received:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(approvingRequest.amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Submitted UTR:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                    {approvingRequest.utrNumber}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Please ensure you have verified the UTR <strong>{approvingRequest.utrNumber}</strong> in your bank / UPI statement for <strong>{formatCurrency(approvingRequest.amount)}</strong>.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setApprovingRequest(null)}
                  disabled={approveMutation.isPending}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmApprove}
                  disabled={approveMutation.isPending}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 px-4"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirm & Allot Credits
                </Button>
              </div>
            </div>
          )}
        </Dialog>

        {/* Reject Confirmation Modal */}
        <Dialog
          open={!!rejectingRequest}
          onOpenChange={(isOpen) => {
            if (!isOpen) setRejectingRequest(null);
          }}
          maxWidth="md"
        >
          {rejectingRequest && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 font-serif">
                    Reject Credit Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reject invalid or unverified UTR payment
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Reason for Rejection (Optional note for user)
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. UTR reference not found in bank statement, amount mismatch..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setRejectingRequest(null)}
                  disabled={rejectMutation.isPending}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReject}
                  disabled={rejectMutation.isPending}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs gap-1.5 px-4"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
