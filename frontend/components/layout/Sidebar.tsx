"use client";

import Link from "next/link";
import Image from "next/image";
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
  Sparkles,
  Zap,
  BarChart3,
  ArrowUpRight,
  Award,
  Play,
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
];

const candidateNav: NavItem[] = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "Practice Tracks", href: "/candidate/practice", icon: GraduationCap },
  { label: "Scorecards", href: "/candidate/scorecards", icon: Award },
  { label: "Buy Credits", href: "/candidate/credits", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Give Interview", href: "/candidate/practice", icon: Play },
  { label: "Practice Tracks", href: "/admin/practice", icon: GraduationCap },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Credit Approvals", href: "/admin/credits", icon: CreditCard },
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
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Clean, crisp, luminous light aesthetic */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 transform border-r border-slate-200/80 bg-white text-slate-700 transition-transform duration-300 lg:translate-x-0 lg:z-30 flex flex-col justify-between shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
            <Link
              href="/"
              className="flex items-center group transition-opacity py-1"
            >
              <Image
                src="/Logo.png"
                alt="Sensei"
                width={115}
                height={34}
                priority
                className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/80 text-orange-600">
              {role === "PLATFORM_ADMIN" ? "Admin" : "Studio"}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-6">
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
              Platform Menu
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white font-semibold shadow-md shadow-orange-500/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  )}
                  onClick={onClose}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-400 group-hover:text-orange-600",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="rounded-full bg-pink-100 border border-pink-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-pink-700">
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Telemetry & Quick Action Card */}
          <div className="border-t border-slate-100 p-4">
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 via-white to-orange-50/20 p-4 border border-slate-200/80 shadow-sm overflow-hidden group">
              {/* Subtle ambient glow in Orange/Pink */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-pink-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-900 font-sans">
                      {role === "PLATFORM_ADMIN"
                        ? "Platform Administrator"
                        : "Voice AI Engine"}
                    </span>
                  </div>
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                </div>

                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  {role === "PLATFORM_ADMIN"
                    ? "Full system oversight, blueprints & telemetry active."
                    : "115ms Groq Whisper voice model calibrated."}
                </p>

                {role === "CANDIDATE" && (
                  <Link
                    href="/candidate/credits"
                    className="inline-flex items-center justify-between w-full pt-1 text-xs font-semibold text-orange-600 hover:text-pink-600 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 fill-current" /> Get Practice Credits
                    </span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
