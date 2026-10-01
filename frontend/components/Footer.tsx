import Link from "next/link";
import Image from "next/image";
import { Heart, Sparkles, Shield, Mail, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 text-slate-600 pt-20 pb-12 px-6 sm:px-8 lg:px-12 border-t border-slate-200/90 relative overflow-hidden">
      {/* Top ambient glow line in Orange & Pink */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 via-pink-500/50 to-transparent" />

      {/* Subtle background glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-orange-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Brand & Mission (Spans 4 columns) */}
          <div className="md:col-span-4 space-y-5">
            <Link href="/" className="inline-block group py-1">
              <Image
                src="/Logo.png"
                alt="Sensei"
                width={140}
                height={42}
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            <p className="font-sans text-sm text-slate-600 leading-relaxed max-w-sm">
              The AI-powered technical mock interview and bar-raiser simulation platform. Built to empower candidates with safe, realistic practice.
            </p>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-600 space-y-1.5 shadow-xs">
              <p>
                <strong className="text-slate-800">Legal Entity:</strong> Sensei (Operated by Shubhanshu Singh)
              </p>
              <p>
                <strong className="text-slate-800">Category:</strong> Educational Technology (EdTech) / SaaS
              </p>
              <p className="text-slate-500">
                100% Digital Delivery • Secured Cloud Infrastructure
              </p>
            </div>
          </div>

          {/* Product links (Spans 2 columns) */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
              Platform
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <Link href="/#platform" className="hover:text-orange-600 transition-colors">
                  Platform Showcase
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-orange-600 transition-colors">
                  Pricing &amp; Packs
                </Link>
              </li>
              <li>
                <Link href="/candidate/practice" className="hover:text-orange-600 transition-colors inline-flex items-center gap-1">
                  Practice Tracks <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support (Spans 3 columns) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
              Company &amp; Support
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <Link href="/about" className="hover:text-pink-600 transition-colors">
                  About Sensei
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-pink-600 transition-colors">
                  Contact Support Desk
                </Link>
              </li>
              <li>
                <a
                  href="mailto:shubhanshus450@gmail.com"
                  className="hover:text-pink-600 transition-colors inline-flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <Mail className="h-3.5 w-3.5 text-pink-500" />
                  shubhanshus450@gmail.com
                </a>
              </li>
              <li className="text-xs text-slate-500 pt-1">
                Support Hours: Mon – Sat, 9 AM – 6 PM IST
              </li>
            </ul>
          </div>

          {/* Legal Policies (Spans 3 columns) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-900">
              Policies &amp; Legal
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <Link href="/terms" className="hover:text-rose-600 transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-rose-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-rose-600 transition-colors">
                  Cancellation &amp; Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-rose-600 transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Banner with Personal Signature */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-sans text-slate-600">
            <p>© {currentYear} Sensei. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-300">•</span>
            {/* The user requested signature line */}
            <p className="flex items-center gap-1.5 font-medium text-slate-700">
              Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse" /> by <span className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent font-semibold">Shubhanshu Singh</span>
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/Shubhanshu__10"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-950 hover:border-orange-500/50 hover:shadow-xs transition-all hover:scale-105"
              aria-label="Twitter / X"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/shubhanshu-singh-684131333/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-950 hover:border-pink-500/50 hover:shadow-xs transition-all hover:scale-105"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://github.com/shubhanshu2006/Sensei"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-950 hover:border-orange-500/50 hover:shadow-xs transition-all hover:scale-105"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      
    </footer>
    
  );
}
