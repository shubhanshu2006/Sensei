"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  CreditCard,
  Settings,
  GraduationCap,
  FileText,
  BarChart3,
  Shield,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SidebarProps {
  role: "RECRUITER" | "CANDIDATE" | "PLATFORM_ADMIN";
  isOpen?: boolean;
  onClose?: () => void;
}

const recruiterNav: NavItem[] = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { label: "Applications", href: "/recruiter/applications", icon: Users },
  { label: "Interviews", href: "/recruiter/interviews", icon: Calendar },
  { label: "Credits", href: "/recruiter/credits", icon: CreditCard },
  { label: "Settings", href: "/recruiter/settings", icon: Settings },
];

const candidateNav: NavItem[] = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/candidate/jobs", icon: Briefcase },
  { label: "Applications", href: "/candidate/applications", icon: FileText },
  { label: "Practice", href: "/candidate/practice", icon: GraduationCap },
  { label: "Settings", href: "/candidate/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar({ role, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "RECRUITER"
      ? recruiterNav
      : role === "CANDIDATE"
        ? candidateNav
        : adminNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 lg:z-30",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <Link
              href="/"
              className="flex items-center space-x-2 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-semibold text-slate-900">
                Sensei
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                  onClick={onClose}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive
                        ? "text-emerald-600"
                        : "text-slate-400 group-hover:text-slate-600",
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-orange-50 p-4">
              <div className="mb-2 flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">
                  {role === "RECRUITER"
                    ? "Recruiter"
                    : role === "CANDIDATE"
                      ? "Candidate"
                      : "Admin"}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {role === "RECRUITER"
                  ? "Manage your hiring pipeline"
                  : role === "CANDIDATE"
                    ? "Find your dream job"
                    : "Platform administration"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
