"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left: Mobile menu button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search (desktop) */}
          <div className="hidden lg:flex items-center space-x-2 rounded-xl bg-slate-50 px-4 py-2 w-80">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-xs text-slate-600">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </Button>

          {/* User menu */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
