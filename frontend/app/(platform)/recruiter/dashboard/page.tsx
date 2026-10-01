"use client";

import { useUser } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecruiterDashboard } from "@/lib/api/queries/recruiters";
import {
  Briefcase,
  Users,
  Calendar,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getApplicationStatusColor } from "@/lib/utils";

export default function RecruiterDashboard() {
  const { user } = useUser();

  const { data: dashboard, isLoading } = useRecruiterDashboard();

  const activeJobs = dashboard?.activeJobs ?? 0;
  const totalApplications = dashboard?.totalApplications ?? 0;
  const totalInterviews = dashboard?.totalInterviews ?? 0;
  const availableCredits = dashboard?.availableCredits ?? 0;
  const recentApplications = dashboard?.recentApplications ?? [];

  return (
    <DashboardLayout role="RECRUITER">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="font-serif text-3xl font-bold text-slate-900">
              Welcome back, {user?.firstName || "Recruiter"}!
            </h1>
            <p className="mt-1 text-slate-600">
              Here's what's happening with your hiring pipeline today.
            </p>
          </div>
          <Link href="/recruiter/jobs/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Job
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <StatsCard
                title="Active Jobs"
                value={activeJobs}
                icon={Briefcase}
                iconColor="emerald"
              />
              <StatsCard
                title="Total Applications"
                value={totalApplications}
                icon={Users}
                iconColor="orange"
              />
              <StatsCard
                title="Interviews"
                value={totalInterviews}
                icon={Calendar}
                iconColor="amber"
              />
              <StatsCard
                title="Available Credits"
                value={availableCredits}
                icon={CreditCard}
                iconColor="rose"
              />
            </>
          )}
        </div>

        {/* Recent Applications */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Recent Applications
                </h2>
                <p className="text-sm text-slate-600">
                  Latest candidates who applied to your open roles
                </p>
              </div>
              <Link href="/recruiter/applications">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  No applications yet
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Create a job posting to start receiving applications.
                </p>
                <Link href="/recruiter/jobs/new">
                  <Button className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Job
                  </Button>
                </Link>
              </div>
            ) : (
              recentApplications.map((application: any) => {
                const candidateUser = application.candidate?.user;
                const candidateName = candidateUser
                  ? `${candidateUser.firstName || ""} ${candidateUser.lastName || ""}`.trim() || candidateUser.email
                  : "Candidate";

                const matchScore = application.screeningReport?.overallMatchScore;

                return (
                  <Link
                    key={application.id}
                    href={`/recruiter/applications/${application.id}`}
                    className="block transition-colors hover:bg-slate-50"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-orange-100 flex items-center justify-center font-semibold text-emerald-700">
                            {candidateUser?.avatar ? (
                              <img
                                src={candidateUser.avatar}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{candidateName.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {candidateName}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {application.job?.title || "Job Application"} •{" "}
                              {application.appliedAt
                                ? formatDistanceToNow(new Date(application.appliedAt), {
                                    addSuffix: true,
                                  })
                                : "Recently"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {matchScore !== undefined && matchScore !== null && (
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-600">
                                {matchScore}%
                              </span>
                            </div>
                          )}
                          <Badge variant={getApplicationStatusColor(application.status)}>
                            {(application.status || "").replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
