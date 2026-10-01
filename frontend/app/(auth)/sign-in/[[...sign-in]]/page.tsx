'use client';

import { useState, useEffect } from 'react';
import { SignIn } from '@clerk/nextjs';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { apiClient } from '@/lib/api/client';
import { ShieldCheck, Lock } from 'lucide-react';
import { maskEmail } from '@/lib/utils';

export default function SignInPage() {
  const [boundEmail, setBoundEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkLock() {
      // 1. Check local storage
      const localEmail = localStorage.getItem('sensei_bound_account_email');
      if (localEmail && isMounted) {
        setBoundEmail(maskEmail(localEmail));
        return;
      }

      // 2. Check backend device binding
      try {
        const fp = await getDeviceFingerprint();
        if (!isMounted || !fp) return;

        const { data } = await apiClient.post('/auth/check-device', { visitorId: fp });
        const res = data?.data || data;
        if (res?.isRegistered && res?.maskedEmail && isMounted) {
          setBoundEmail(res.maskedEmail);
        }
      } catch {
        // Silently continue
      }
    }

    checkLock();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-slate-900 mb-2">
            Welcome back to Sensei<span className="text-orange-500">•</span>
          </h1>
          <p className="text-slate-600 text-sm">
            Sign in to continue your interview preparation
          </p>
          {boundEmail && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200/80 rounded-full text-xs text-orange-950 font-medium">
              <Lock className="h-3 w-3 text-orange-500" />
              <span>Device locked to registered account: <strong>{maskEmail(boundEmail)}</strong></span>
            </div>
          )}
        </div>

        <SignIn
          fallbackRedirectUrl="/candidate/dashboard"
          initialValues={boundEmail && !boundEmail.includes('*') ? { emailAddress: boundEmail } : undefined}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-orange-100 rounded-2xl bg-white",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition-all rounded-xl h-11",
              socialButtonsBlockButtonText: "font-medium text-slate-700",
              formButtonPrimary:
                "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 rounded-xl h-11 text-sm font-medium shadow-md shadow-orange-500/20 text-white",
              formFieldInput:
                "rounded-xl border-slate-300 focus:border-orange-500 focus:ring-orange-500 h-11",
              formFieldLabel: "text-slate-700 font-medium",
              footerActionLink:
                "text-orange-600 hover:text-pink-600 font-medium",
              identityPreviewEditButton:
                "text-orange-600 hover:text-pink-600",
              formResendCodeLink: "text-orange-600 hover:text-pink-600",
            },
          }}
        />
      </div>
    </div>
  );
}
