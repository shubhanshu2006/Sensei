'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { apiClient } from '@/lib/api/client';
import { ShieldAlert, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { maskEmail } from '@/lib/utils';

export default function SignUpPage() {
  const [checkingDevice, setCheckingDevice] = useState(true);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<{ maskedEmail?: string; message?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyDevice() {
      try {
        const visitorId = await getDeviceFingerprint();
        if (!isMounted) return;

        if (visitorId) {
          const { data } = await apiClient.post('/auth/check-device', { visitorId });
          const res = data?.data || data;

          if (res?.isRegistered && isMounted) {
            setDeviceBlocked(true);
            setBlockedInfo({
              maskedEmail: res.maskedEmail,
              message: res.message,
            });
          }
        }
      } catch (err) {
        console.warn('Device verification check error:', err);
      } finally {
        if (isMounted) {
          setCheckingDevice(false);
        }
      }
    }

    verifyDevice();

    return () => {
      isMounted = false;
    };
  }, []);

  if (checkingDevice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/30 px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Verifying device integrity...</p>
        </div>
      </div>
    );
  }

  // If this device already has an account registered, BLOCK new sign-ups and prevent account switching
  if (deviceBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/30 px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border border-orange-200/80 shadow-2xl shadow-orange-500/10 bg-white rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 text-orange-600 border border-orange-200 shadow-sm">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-semibold mb-2">
                <Lock className="h-3 w-3" />
                <span>Single Account Policy</span>
              </div>
              <CardTitle className="text-2xl font-serif font-bold text-slate-900">
                Device Already Registered
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-2 leading-relaxed">
                This device is already associated with an existing Sensei account. To prevent abuse and protect trial fairness, creating multiple accounts or account switching is not permitted on the same device.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-8 px-6 space-y-5">
              {blockedInfo?.maskedEmail && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-center">
                  <p className="text-xs text-slate-500 font-medium">Linked Account</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 tracking-wide">
                    {maskEmail(blockedInfo.maskedEmail)}
                  </p>
                </div>
              )}

              <Link href="/sign-in" className="block w-full">
                <Button className="w-full h-11 bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2">
                  <span>Sign In to Your Account</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <div className="text-center text-xs text-slate-400">
                If you believe this is in error, please contact{' '}
                <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 underline font-medium">
                  support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-slate-900 mb-2">
            Join Sensei<span className="text-orange-500">•</span>
          </h1>
          <p className="text-slate-600">
            Transform your hiring or interview preparation journey
          </p>
        </div>

        <SignUp
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
