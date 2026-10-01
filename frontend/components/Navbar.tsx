'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', href: '/#home' },
  { id: 'platform', label: 'Platform', href: '/#platform' },
  { id: 'testimonials', label: 'Testimonials', href: '/#testimonials' },
  { id: 'pricing', label: 'Pricing', href: '/#pricing' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { isSignedIn, isLoaded, user } = useUser();
  const pathname = usePathname();

  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const dashboardHref =
    role === 'PLATFORM_ADMIN'
      ? '/admin/dashboard'
      : role === 'CANDIDATE' || role === 'RECRUITER'
        ? '/candidate/dashboard'
        : '/onboarding';

  useEffect(() => {
    const updateActiveSection = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      // Section tracking only applies on the homepage
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      if (path !== '/' && path !== '') return;

      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Bottom of page -> Pricing is active
      if (scrollY + windowHeight >= docHeight - 80) {
        setActiveSection('pricing');
        return;
      }

      // Top of page (Hero) -> Home is active
      if (scrollY < 200) {
        setActiveSection('home');
        return;
      }

      // Check sections from bottom to top using absolute scroll position (35% down viewport)
      const targetScroll = scrollY + windowHeight * 0.35;
      const sections = [
        { id: 'pricing', el: document.getElementById('pricing') },
        { id: 'testimonials', el: document.getElementById('testimonials') || document.getElementById('stories') },
        { id: 'platform', el: document.getElementById('platform') },
        { id: 'home', el: document.getElementById('home') || document.getElementById('overview') },
      ];

      for (const section of sections) {
        if (section.el) {
          const top = section.el.getBoundingClientRect().top + scrollY;
          if (targetScroll >= top - 60) {
            setActiveSection(section.id);
            return;
          }
        }
      }

      setActiveSection('home');
    };

    // Initial check
    updateActiveSection();

    // Check initial hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'home' || hash === 'overview') {
        setActiveSection('home');
      } else if (hash === 'platform') {
        setActiveSection('platform');
      } else if (hash === 'testimonials' || hash === 'stories' || hash === 'reviews') {
        setActiveSection('testimonials');
      } else if (hash === 'pricing') {
        setActiveSection('pricing');
      }
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
      e.preventDefault();
      setActiveSection(id);

      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/#home');
        return;
      }

      const el = document.getElementById(id);
      if (el) {
        const navOffset = 85;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = Math.max(0, elementPosition - navOffset);
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        window.history.pushState(null, '', `#${id}`);
      }
    }
  };

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        {/* Floating Capsule Island Navbar */}
        <nav
          className={`rounded-full py-2 px-5 sm:px-6 flex items-center justify-between border transition-all duration-300 ${
            isScrolled
              ? 'bg-white/95 backdrop-blur-2xl border-slate-200/90 shadow-2xl shadow-slate-900/10'
              : 'bg-white/85 backdrop-blur-xl border-slate-200/80 shadow-xl shadow-slate-900/5'
          }`}
        >
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/#home"
              onClick={(e) => handleNavClick(e, '/#home', 'home')}
              className="flex items-center gap-1.5 group"
            >
              <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight group-hover:text-orange-500 transition-colors">
                Sensei
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse" />
            </Link>
          </div>

          {/* Desktop Navigation Links with Moving Background Pill */}
          <div className="relative hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.id)}
                  className={`relative z-10 font-sans text-sm px-4 py-1.5 rounded-full transition-colors duration-200 select-none ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-950 font-medium hover:bg-slate-100/60'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 shadow-md shadow-orange-500/25 -z-10"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
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
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleNavClick(e, item.href, item.id);
                    }}
                    className={`font-sans text-sm px-4 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-sm'
                        : 'font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100/70'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-sans text-sm font-medium text-slate-700 hover:text-slate-950 px-4 py-2.5 hover:bg-slate-100/70 rounded-xl"
              >
                About Sensei
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
