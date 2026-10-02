"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useAdminAnalytics } from "@/lib/api/queries/admin";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  RefreshCw,
} from "lucide-react";

type PeriodType = "today" | "week" | "month" | "year" | "all";

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<PeriodType>("month");
  const { data, isLoading, isFetching, refetch } = useAdminAnalytics(period);

  const periods: { id: PeriodType; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "year", label: "This Year" },
    { id: "all", label: "All Time" },
  ];

  const summary = data?.summary;
  const trends = data?.trends;
  const performance = data?.performance;
  const topCompanies = data?.topCompanies || [];
  const topSkills = data?.topSkills || [];

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-serif text-3xl font-bold text-slate-900">
                Analytics & Insights
              </h1>
              {isFetching && (
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
            <p className="mt-1 text-slate-600 text-sm">
              Live platform performance, revenue growth, and usage metrics
            </p>
          </div>

          {/* Time Period Selector */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-inner">
            {periods.map((p) => {
              const active = period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Growth & KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Users Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                User Registrations
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="h-4 w-4" />
              </div>
            </div>

            {isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {summary?.users.total.toLocaleString() ?? 0}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-semibold">
                    {(summary?.users.growth ?? 0) >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">
                          +{summary?.users.growth}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                        <span className="text-rose-600">
                          {summary?.users.growth}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-500">
                    +{summary?.users.inPeriod.toLocaleString()} in period
                  </span>
                </div>
              </>
            )}
          </Card>

          {/* Jobs Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Jobs Posted
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>

            {isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {summary?.jobs.total.toLocaleString() ?? 0}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-semibold">
                    {(summary?.jobs.growth ?? 0) >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">
                          +{summary?.jobs.growth}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                        <span className="text-rose-600">
                          {summary?.jobs.growth}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-500">
                    +{summary?.jobs.inPeriod.toLocaleString()} in period
                  </span>
                </div>
              </>
            )}
          </Card>

          {/* Applications Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Candidate Applications
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <FileText className="h-4 w-4" />
              </div>
            </div>

            {isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {summary?.applications.total.toLocaleString() ?? 0}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-semibold">
                    {(summary?.applications.growth ?? 0) >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">
                          +{summary?.applications.growth}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                        <span className="text-rose-600">
                          {summary?.applications.growth}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-500">
                    +{summary?.applications.inPeriod.toLocaleString()} in period
                  </span>
                </div>
              </>
            )}
          </Card>

          {/* Revenue Card */}
          <Card className="rounded-2xl border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gross Revenue
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>

            {isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {formatCurrency(summary?.revenue.total ?? 0)}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-semibold">
                    {(summary?.revenue.growth ?? 0) >= 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">
                          +{summary?.revenue.growth}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                        <span className="text-rose-600">
                          {summary?.revenue.growth}%
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-slate-500 font-medium">
                    {formatCurrency(summary?.revenue.inPeriod ?? 0)} in period
                  </span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* 12-Month Trends / Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Registration Trend */}
          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  User Registration Trend
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly new signups across the last 12 months
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                12 Months
              </Badge>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-end justify-between space-x-2 pt-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-full rounded-t-lg" />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex h-64 items-end justify-between space-x-2">
                {trends?.users.map((item, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-1 flex-col items-center space-y-2 h-full justify-end"
                  >
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 z-10 pointer-events-none rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap">
                      <p className="font-semibold">{item.users} signups</p>
                      <p className="text-[10px] text-slate-400">{item.fullMonth}</p>
                    </div>

                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all group-hover:from-emerald-700 group-hover:to-emerald-500"
                        style={{ height: `${item.heightPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Revenue Trend */}
          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Revenue Trend (INR)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly collected subscription & credit payments
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                12 Months
              </Badge>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-end justify-between space-x-2 pt-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-full rounded-t-lg" />
                ))}
              </div>
            ) : (
              <div className="mt-6 flex h-64 items-end justify-between space-x-2">
                {trends?.revenue.map((item, i) => (
                  <div
                    key={i}
                    className="group relative flex flex-1 flex-col items-center space-y-2 h-full justify-end"
                  >
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 z-10 pointer-events-none rounded-lg bg-slate-900 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap">
                      <p className="font-semibold">{formatCurrency(item.revenue)}</p>
                      <p className="text-[10px] text-slate-400">{item.fullMonth}</p>
                    </div>

                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-amber-400 transition-all group-hover:from-orange-600 group-hover:to-amber-500"
                        style={{ height: `${item.heightPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quality & Interview Performance */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avg. Session Duration
              </h3>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-24" />
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {performance?.avgDurationMinutes || 15} mins
                </p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-slate-500">
                  <Activity className="h-3.5 w-3.5 text-blue-600" />
                  <span>Real voice & AI interaction time</span>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Interview Completion Rate
              </h3>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {performance?.interviewSuccessRate ?? 0}%
                </p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-emerald-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    {performance?.completedInterviews ?? 0} of{" "}
                    {performance?.totalInterviews ?? 0} finished
                  </span>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Candidate Evaluation Index
              </h3>
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <>
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {performance?.candidateSatisfaction ?? "5.0/5"}
                </p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-slate-600">
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 py-0"
                  >
                    Avg Score: {performance?.avgOverallScore ?? 0}/100
                  </Badge>
                  <span>Across all scorecards</span>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Top Performers: Companies & Skills */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Recruiting Companies */}
          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Top Recruiting Organizations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ranked by active job postings created
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {topCompanies.length} Listed
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-4 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : topCompanies.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No recruiter organizations found with posted jobs yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {topCompanies.map((company, i) => (
                  <div key={company.id || i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 border border-slate-300/50">
                        {i + 1}
                      </div>
                      <span className="font-medium text-slate-900 text-sm truncate">
                        {company.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="h-2 w-28 sm:w-36 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all duration-500"
                          style={{ width: `${company.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-12 text-right">
                        {company.jobs} {company.jobs === 1 ? "job" : "jobs"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Most In-Demand Skills */}
          <Card className="p-6 rounded-2xl border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  Most In-Demand Skills
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted from live job requirements
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Top Skills
              </Badge>
            </div>

            {isLoading ? (
              <div className="space-y-4 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : topSkills.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No skill requirements recorded across posted jobs yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {topSkills.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 text-sm">
                      {item.skill}
                    </span>
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-28 sm:w-36 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${item.demand}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-10 text-right">
                        {item.demand}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
