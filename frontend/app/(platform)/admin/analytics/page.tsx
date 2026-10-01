"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Activity,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Analytics & Insights
          </h1>
          <p className="mt-1 text-slate-600">
            Track platform performance and growth metrics
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex space-x-2">
          <Badge className="cursor-pointer">Today</Badge>
          <Badge
            variant="default"
            className="cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            This Week
          </Badge>
          <Badge
            variant="default"
            className="cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            This Month
          </Badge>
          <Badge
            variant="default"
            className="cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            This Year
          </Badge>
        </div>

        {/* Growth Metrics */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-600">
                      User Growth
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    +12.5%
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      +156 this month
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-600">
                      Jobs Posted
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    +8.2%
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      +23 this month
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-600">
                      Applications
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    +15.3%
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      +456 this month
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-medium text-slate-600">
                      Revenue
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    +24.1%
                  </p>
                  <div className="mt-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-emerald-600">
                      ₹32K this month
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Growth Chart */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900">
                User Registration Trend
              </h3>
              <div className="mt-6 flex h-64 items-end justify-between space-x-2">
                {[45, 52, 48, 65, 58, 72, 68, 85, 92, 88, 95, 102].map(
                  (value, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center space-y-2"
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all hover:from-emerald-600 hover:to-emerald-500"
                          style={{ height: `${value}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {
                          [
                            "J",
                            "F",
                            "M",
                            "A",
                            "M",
                            "J",
                            "J",
                            "A",
                            "S",
                            "O",
                            "N",
                            "D",
                          ][i]
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
              <div className="mt-6 flex h-64 items-end justify-between space-x-2">
                {[35, 42, 38, 55, 48, 62, 58, 75, 82, 78, 85, 92].map(
                  (value, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center space-y-2"
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-400 transition-all hover:from-orange-600 hover:to-orange-500"
                          style={{ height: `${value}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {
                          [
                            "J",
                            "F",
                            "M",
                            "A",
                            "M",
                            "J",
                            "J",
                            "A",
                            "S",
                            "O",
                            "N",
                            "D",
                          ][i]
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600">
                Avg. Time to Hire
              </h3>
              <p className="mt-3 text-3xl font-bold text-slate-900">12 days</p>
              <div className="mt-2 flex items-center space-x-2">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600">2 days faster</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600">
                Interview Success Rate
              </h3>
              <p className="mt-3 text-3xl font-bold text-slate-900">68%</p>
              <div className="mt-2 flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600">
                  +5% vs last month
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-slate-600">
                Candidate Satisfaction
              </h3>
              <p className="mt-3 text-3xl font-bold text-slate-900">4.7/5</p>
              <div className="mt-2 flex items-center space-x-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-emerald-600">Excellent</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900">
                Top Recruiting Companies
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Tech Corp", jobs: 42, color: "emerald" },
                  { name: "Startup Inc", jobs: 38, color: "orange" },
                  { name: "Enterprise Co", jobs: 35, color: "amber" },
                  { name: "Innovation Ltd", jobs: 28, color: "rose" },
                ].map((company, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-orange-100 text-sm font-semibold text-emerald-700">
                        {i + 1}
                      </div>
                      <span className="font-medium text-slate-900">
                        {company.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full bg-${company.color}-600`}
                          style={{ width: `${(company.jobs / 42) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {company.jobs}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-slate-900">
                Most In-Demand Skills
              </h3>
              <div className="mt-4 space-y-3">
                {[
                  { skill: "React", demand: 95 },
                  { skill: "Node.js", demand: 88 },
                  { skill: "Python", demand: 82 },
                  { skill: "AWS", demand: 76 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {item.skill}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                          style={{ width: `${item.demand}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {item.demand}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
