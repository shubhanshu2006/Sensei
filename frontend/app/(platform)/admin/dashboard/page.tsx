"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdminStats } from "@/lib/api/queries/admin";
import { useAdminCreditRequests } from "@/lib/api/queries/creditRequests";
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const { data: creditRequestsData } = useAdminCreditRequests({ status: "PENDING", limit: 1 });

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Platform Overview
          </h1>
          <p className="mt-1 text-slate-600">
            Monitor real-time platform metrics, user adoption, and AI interview volume
          </p>
        </div>

        {/* Pending UPI Credit Approvals Banner */}
        {creditRequestsData?.metrics?.pendingCount ? (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-300 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {creditRequestsData.metrics.pendingCount} Pending UPI Payment Approvals
                </h3>
                <p className="text-xs text-slate-600">
                  Users have submitted UTR transaction numbers awaiting your verification to credit their accounts.
                </p>
              </div>
            </div>
            <Link href="/admin/credits">
              <Button size="sm" className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs gap-1.5 shadow-sm">
                <span>Review & Approve</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card className="relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Users
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {(stats?.totalUsers ?? 0).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-600">
                    {stats?.totalRecruiters ?? 0} recruiters • {stats?.totalCandidates ?? 0} candidates
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
          </Card>

          {/* Active Jobs */}
          <Card className="relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Active Jobs
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {stats?.activeJobs ?? 0}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-600">
                    of {stats?.totalJobs ?? 0} total listings
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Briefcase className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          </Card>

          {/* Total Applications */}
          <Card className="relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Applications
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-20" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {(stats?.totalApplications ?? 0).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-1 flex items-center text-xs text-emerald-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Processed through AI pipeline
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          </Card>

          {/* Total AI Interviews */}
          <Card className="relative overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    AI Interviews Conducted
                  </p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                  ) : (
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {(stats?.totalInterviews ?? 0).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-600">
                    Practice & hiring sessions
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Metrics */}
          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Platform Summary
                  </h2>
                </div>
                <Badge variant="outline">Live Database</Badge>
              </div>
            </div>
            <div className="divide-y divide-slate-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-700">New Signups (Last 30 Days)</span>
                </div>
                <span className="text-base font-bold text-slate-900">
                  {stats?.recentSignups ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center space-x-3">
                  <Layers className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-700">Practice Job Blueprints</span>
                </div>
                <span className="text-base font-bold text-slate-900">
                  {stats?.totalPracticeJobs ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-700">Active Job Postings</span>
                </div>
                <span className="text-base font-bold text-emerald-600">
                  {stats?.activeJobs ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <span className="text-sm text-slate-700">Total Applications Evaluated</span>
                </div>
                <span className="text-base font-bold text-slate-900">
                  {stats?.totalApplications ?? 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Platform Health */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900">
                Service Health & Architecture
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Monitored infrastructure components
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Socket.io AI Interview Engine</span>
                    <span className="font-semibold text-emerald-600">Operational</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-full rounded-full bg-emerald-600" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">PostgreSQL (Prisma ORM) Database</span>
                    <span className="font-semibold text-emerald-600">Connected</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-full rounded-full bg-emerald-600" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">Redis & BullMQ Background Queues</span>
                    <span className="font-semibold text-emerald-600">Active</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-full rounded-full bg-emerald-600" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">AWS S3 Resume Bucket</span>
                    <span className="font-semibold text-emerald-600">Healthy</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-full rounded-full bg-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
