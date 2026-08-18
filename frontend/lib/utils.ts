import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(
  amount: number,
  currency: string = "INR",
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "U";
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + "...";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-50";
  if (score >= 60) return "text-amber-600 bg-amber-50";
  return "text-rose-600 bg-rose-50";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Application statuses
    SUBMITTED: "bg-slate-100 text-slate-800",
    SCREENING_IN_PROGRESS: "bg-amber-100 text-amber-800",
    SCREENING_COMPLETED: "bg-purple-100 text-purple-800",
    SHORTLISTED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-rose-100 text-rose-800",
    INTERVIEW_INVITED: "bg-indigo-100 text-indigo-800",
    INTERVIEW_SCHEDULED: "bg-cyan-100 text-cyan-800",
    INTERVIEW_COMPLETED: "bg-teal-100 text-teal-800",
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
    ABANDONED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-rose-100 text-rose-800",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
}
