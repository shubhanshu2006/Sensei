"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Menu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCandidatePracticeCredits } from "@/lib/api/queries/candidates";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: creditsData } = useCandidatePracticeCredits();
  const total = creditsData?.practiceCredits ?? 2;
  const used = creditsData?.practiceCreditsUsed ?? 0;
  const available = Math.max(0, total - used);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left: Mobile menu button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            onClick={onMenuClick}
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: Practice Credits Pill + User Avatar */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick Credit Capsule */}
          <Link
            href="/candidate/credits"
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-pink-500/10 to-rose-500/10 border border-orange-500/25 hover:border-orange-500/40 transition-all shadow-xs"
          >
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white flex items-center justify-center shrink-0">
              <Zap className="h-2.5 w-2.5 fill-current" />
            </div>
            <span className="text-xs font-mono font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              {available} {available === 1 ? "Credit" : "Credits"}
            </span>
            <span className="hidden sm:inline text-[10px] font-sans text-slate-500 group-hover:text-slate-700">
              • Top Up
            </span>
          </Link>

          {/* User menu */}
          <div className="pl-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 rounded-full ring-2 ring-orange-500/20 hover:ring-orange-500/40 transition-all",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
