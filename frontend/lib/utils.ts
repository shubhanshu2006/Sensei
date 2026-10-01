import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApplicationStatus } from "@/types/application.types";
import type { JobStatus } from "@/types/job.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = "INR",
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get initials from name
export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "U";
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

// Truncate text
export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

// Get application status badge variant
export function getApplicationStatusColor(
  status: ApplicationStatus,
): "default" | "success" | "warning" | "danger" | "info" {
  const statusMap: Record<
    ApplicationStatus,
    "default" | "success" | "warning" | "danger" | "info"
  > = {
    SUBMITTED: "info",
    SCREENING_IN_PROGRESS: "warning",
    SCREENING_COMPLETED: "default",
    SHORTLISTED: "success",
    REJECTED: "danger",
    INTERVIEW_INVITED: "warning",
    INTERVIEW_SCHEDULED: "info",
    INTERVIEW_COMPLETED: "success",
    WITHDRAWN: "default",
  };
  return statusMap[status] || "default";
}

// Get job status badge variant
export function getJobStatusColor(
  status: JobStatus,
): "default" | "success" | "warning" | "danger" {
  const statusMap: Record<JobStatus, "default" | "success" | "warning" | "danger"> = {
    DRAFT: "default",
    ACTIVE: "success",
    PAUSED: "warning",
    CLOSED: "danger",
  };
  return statusMap[status] || "default";
}

// Get score color classes
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-50";
  if (score >= 60) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

// Get status color classes
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Application statuses
    SUBMITTED: "bg-slate-100 text-slate-800",
    SCREENING_IN_PROGRESS: "bg-amber-100 text-amber-800",
    SCREENING_COMPLETED: "bg-emerald-100 text-emerald-800",
    SHORTLISTED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-rose-800",
    INTERVIEW_INVITED: "bg-amber-100 text-amber-800",
    INTERVIEW_SCHEDULED: "bg-orange-100 text-orange-800",
    INTERVIEW_COMPLETED: "bg-emerald-100 text-emerald-800",
    WITHDRAWN: "bg-gray-100 text-gray-800",

    // Job statuses
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-emerald-100 text-emerald-800",
    PAUSED: "bg-amber-100 text-amber-800",
    CLOSED: "bg-rose-100 text-rose-800",

    // Interview statuses
    SCHEDULED: "bg-slate-100 text-slate-800",
    IN_PROGRESS: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    ABANDONED: "bg-rose-100 text-rose-800",
    CANCELLED: "bg-rose-100 text-rose-800",
    NO_SHOW: "bg-rose-100 text-rose-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
}

export function maskEmail(email?: string | null): string {
  if (!email || typeof email !== "string") return "";
  if (!email.includes("@")) return email;
  if (email.includes("*")) return email; // Already masked

  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  if (name.length <= 1) {
    return `${name}***@${domain}`;
  } else if (name.length === 2) {
    return `${name[0]}***@${domain}`;
  } else {
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }
}
