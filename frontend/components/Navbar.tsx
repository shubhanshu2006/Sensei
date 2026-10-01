'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, UserButton } from '@clerk/nextjs';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, isLoaded, user } = useUser();

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const dashboardHref =
    role === 'PLATFORM_ADMIN'
      ? '/admin/dashboard'
      : role === 'CANDIDATE' || role === 'RECRUITER'
        ? '/candidate/dashboard'
        : '/onboarding';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        {/* Floating Capsule Island Navbar */}
        <nav
          className={`rounded-full py-2.5 px-5 sm:px-6 flex items-center justify-between border transition-all duration-300 ${isScrolled
              ? 'bg-white/95 backdrop-blur-2xl border-slate-200/90 shadow-2xl shadow-slate-900/10'
              : 'bg-white/85 backdrop-blur-xl border-slate-200/80 shadow-xl shadow-slate-900/5'
            }`}
        >
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight group-hover:text-orange-500 transition-colors">
                Sensei
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5">
            <Link
              href="/#platform"
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-sans text-sm font-semibold px-4 py-1.5 rounded-full transition-all shadow-xs shadow-orange-500/25"
            >
              Platform
            </Link>

            <Link
              href="/#testimonials"
              className="font-sans text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors px-3.5 py-1.5 rounded-full hover:bg-slate-100/80"
            >
              Reviews
            </Link>

            <Link
              href="/#pricing"
              className="font-sans text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors px-3.5 py-1.5 rounded-full hover:bg-slate-100/80"
            >
              Pricing
            </Link>

            <Link
              href="/about"
              className="font-sans text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors px-3.5 py-1.5 rounded-full hover:bg-slate-100/80"
            >
              About
            </Link>
          </div>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardHref}
                  className="px-4 py-1.5 bg-slate-950 text-white rounded-full font-sans text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm"
                >
                  Dashboard
                </Link>
                <UserButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="font-sans text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-slate-950 text-white rounded-full font-sans text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-all shadow-md inline-flex items-center gap-1.5 hover:scale-105"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-800"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-800" />
            ) : (
              <Menu className="w-5 h-5 text-slate-800" />
            )}
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-2 p-4 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl text-slate-900">
            <div className="flex flex-col gap-2">
              <Link
                href="/#platform"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-sans text-sm font-semibold text-white px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 shadow-sm"
              >
                Platform
              </Link>

              <Link
                href="/#testimonials"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-sans text-sm font-medium text-slate-700 hover:text-slate-950 px-4 py-2 hover:bg-slate-100/70 rounded-xl"
              >
                Reviews
              </Link>

              <Link
                href="/#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-sans text-sm font-medium text-slate-700 hover:text-slate-950 px-4 py-2 hover:bg-slate-100/70 rounded-xl"
              >
                Pricing
              </Link>

              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-sans text-sm font-medium text-slate-700 hover:text-slate-950 px-4 py-2 hover:bg-slate-100/70 rounded-xl"
              >
                About
              </Link>

              <div className="h-px bg-slate-200/80 my-2" />

              {isLoaded && isSignedIn ? (
                <div className="flex items-center justify-between px-2 pt-1">
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2 px-4 bg-slate-950 text-white rounded-full font-sans text-sm font-semibold"
                  >
                    Go to Dashboard
                  </Link>
                  <UserButton />
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-sans text-sm text-center text-slate-700 hover:text-slate-950 py-2 hover:bg-slate-100/70 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 bg-slate-950 text-white rounded-full font-sans text-sm font-semibold text-center hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
