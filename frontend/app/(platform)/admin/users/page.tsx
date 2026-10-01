"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers, useUpdateUserStatus, useUpdateUserCredits } from "@/lib/api/queries/admin";
import { getInitials, formatDate } from "@/lib/utils";
import {
  Search,
  X,
  Calendar,
  Briefcase,
  AlertTriangle,
  Ban,
  Trash2,
  CheckCircle,
  Loader2,
  Users,
  Zap,
} from "lucide-react";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pendingStatus, setPendingStatus] = useState<"ACTIVE" | "SUSPENDED" | "DELETED">("ACTIVE");
  const [creditsAmount, setCreditsAmount] = useState<string>("5");
  const [creditsOperation, setCreditsOperation] = useState<"SET" | "ADD">("ADD");

  const { data, isLoading } = useAdminUsers({
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  const updateStatusMutation = useUpdateUserStatus();
  const updateCreditsMutation = useUpdateUserCredits();
  const users = data?.users || [];

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    await updateStatusMutation.mutateAsync({
      userId: selectedUser.id,
      status: pendingStatus,
    });
    setStatusDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser) return;
    const num = parseInt(creditsAmount, 10);
    if (isNaN(num)) return;

    await updateCreditsMutation.mutateAsync({
      userId: selectedUser.id,
      credits: num,
      operation: creditsOperation,
    });
    setCreditsDialogOpen(false);
    setSelectedUser(null);
  };

  const openStatusDialog = (user: any, newStatus: "ACTIVE" | "SUSPENDED" | "DELETED") => {
    setSelectedUser(user);
    setPendingStatus(newStatus);
    setStatusDialogOpen(true);
  };

  const openCreditsDialog = (user: any) => {
    setSelectedUser(user);
    const current = user.candidateProfile
      ? Math.max(0, user.candidateProfile.practiceCredits - user.candidateProfile.practiceCreditsUsed)
      : user.recruiterProfile?.interviewCredits || 0;
    setCreditsAmount("5");
    setCreditsOperation("ADD");
    setCreditsDialogOpen(true);
  };

  return (
    <DashboardLayout role="PLATFORM_ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="mt-1 text-slate-600">
            Manage all platform users, roles, and account statuses
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onChange={(value) => setRoleFilter(value)}
              options={[
                { value: "", label: "All Roles" },
                { value: "RECRUITER", label: "Recruiters" },
                { value: "CANDIDATE", label: "Candidates" },
                { value: "PLATFORM_ADMIN", label: "Platform Admins" },
              ]}
              className="w-full md:w-48"
            />

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={[
                { value: "", label: "All Status" },
                { value: "ACTIVE", label: "Active" },
                { value: "SUSPENDED", label: "Suspended" },
                { value: "DELETED", label: "Deleted" },
              ]}
              className="w-full md:w-48"
            />

            {/* Clear Filters */}
            {(searchQuery || roleFilter || statusFilter) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No users found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try adjusting your search criteria or role filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      User
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Role
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Status
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Registered
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Profile Info
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600">
                      Credits
                    </th>
                    <th className="p-4 text-xs font-semibold uppercase text-slate-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar
                            src={user.avatar}
                            alt={`${user.firstName || ""} ${user.lastName || ""}`}
                            fallback={getInitials(user.firstName, user.lastName)}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.firstName || "Unnamed"} {user.lastName || "User"}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            user.role === "RECRUITER"
                              ? "default"
                              : user.role === "CANDIDATE"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            user.status === "ACTIVE"
                              ? "success"
                              : user.status === "SUSPENDED"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {user.recruiterProfile?.companyName && (
                          <span className="font-medium text-slate-900">
                            {user.recruiterProfile.companyName}
                          </span>
                        )}
                        {user.candidateProfile?.currentDesignation && (
                          <span>{user.candidateProfile.currentDesignation}</span>
                        )}
                        {user.adminProfile?.department && (
                          <span>Dept: {user.adminProfile.department}</span>
                        )}
                        {!user.recruiterProfile && !user.candidateProfile && !user.adminProfile && (
                          <span className="text-slate-400 italic">Profile pending</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {user.candidateProfile ? (
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
                            <span className="font-semibold text-emerald-950">
                              {Math.max(0, user.candidateProfile.practiceCredits - user.candidateProfile.practiceCreditsUsed)}
                            </span>
                            <span className="text-xs text-slate-400">
                              / {user.candidateProfile.practiceCredits}
                            </span>
                          </div>
                        ) : user.recruiterProfile ? (
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-semibold text-slate-900">
                              {user.recruiterProfile.interviewCredits}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1 text-xs"
                            onClick={() => openCreditsDialog(user)}
                          >
                            <Zap className="h-3 w-3 text-emerald-600" />
                            Credits
                          </Button>
                          {user.status === "ACTIVE" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:bg-amber-50 gap-1 text-xs"
                              onClick={() => openStatusDialog(user, "SUSPENDED")}
                            >
                              <Ban className="h-3.5 w-3.5" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50 gap-1 text-xs"
                              onClick={() => openStatusDialog(user, "ACTIVE")}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Activate
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 gap-1 text-xs"
                            onClick={() => openStatusDialog(user, "DELETED")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        {selectedUser && (
          <div className="p-6">
            <div className="flex items-center space-x-3 text-amber-600 mb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold text-slate-900">
                Update Account Status
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to change the status of{" "}
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}) to{" "}
              <Badge className="ml-1" variant={pendingStatus === "ACTIVE" ? "success" : "destructive"}>
                {pendingStatus}
              </Badge>
              ?
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setStatusDialogOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                disabled={updateStatusMutation.isPending}
                className={
                  pendingStatus === "ACTIVE"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Change"
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Manage Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        {selectedUser && (
          <div className="p-6 max-w-md w-full">
            <div className="flex items-center space-x-2 text-emerald-600 mb-2">
              <Zap className="h-5 w-5 fill-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">
                Manage User Credits
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Adjust interview/practice credits for{" "}
              <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}).
            </p>

            <div className="space-y-2 rounded-xl bg-slate-50 p-4 border border-slate-200 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Role:</span>
                <span className="font-semibold text-slate-900">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Practice Credits:</span>
                <span className="font-semibold text-slate-900">
                  {selectedUser.candidateProfile?.practiceCredits ?? selectedUser.recruiterProfile?.interviewCredits ?? 0}
                </span>
              </div>
              {selectedUser.candidateProfile && (
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-emerald-800 font-medium">Available to Use:</span>
                  <span className="font-bold text-emerald-700">
                    {Math.max(0, selectedUser.candidateProfile.practiceCredits - selectedUser.candidateProfile.practiceCreditsUsed)} Credits
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Action Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={creditsOperation === "ADD" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCreditsOperation("ADD")}
                    className={creditsOperation === "ADD" ? "bg-emerald-600 text-white" : ""}
                  >
                    + Add to Current
                  </Button>
                  <Button
                    type="button"
                    variant={creditsOperation === "SET" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setCreditsOperation("SET")}
                    className={creditsOperation === "SET" ? "bg-emerald-600 text-white" : ""}
                  >
                    Set Exact Total
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  {creditsOperation === "ADD" ? "Number of Credits to Add" : "New Total Credits"}
                </label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setCreditsDialogOpen(false)}
                disabled={updateCreditsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCredits}
                disabled={updateCreditsMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {updateCreditsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Save Credits
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </DashboardLayout>
  );
}
