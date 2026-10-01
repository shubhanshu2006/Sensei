'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk, SignOutButton } from '@clerk/nextjs';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { apiClient } from '@/lib/api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, Lock, LogOut, Loader2 } from 'lucide-react';
import { maskEmail } from '@/lib/utils';

export function DeviceAccountGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [blockedDetails, setBlockedDetails] = useState<{
    boundAccount?: string;
    message?: string;
  }>({});

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      if (typeof signOut === 'function') {
        await signOut();
      }
    } catch (err) {
      console.warn('Sign out caught error:', err);
    } finally {
      // Force navigation to /sign-in so cookies and session are reloaded cleanly
      window.location.href = '/sign-in';
    }
  };

  useEffect(() => {
    // 1. Listen for 403 device block events from apiClient
    const handleBlockedEvent = (e: any) => {
      const msg = e.detail?.message;
      setIsBlocked(true);
      setBlockedDetails((prev) => ({
        ...prev,
        message: msg || 'Multiple accounts or account switching is not permitted on this device.',
      }));
    };

    window.addEventListener('sensei:device_account_blocked', handleBlockedEvent);
    return () => {
      window.removeEventListener('sensei:device_account_blocked', handleBlockedEvent);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Platform admins are exempt
    const role = (user.publicMetadata as { role?: string })?.role;
    if (role === 'PLATFORM_ADMIN') return;

    const currentEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (!currentEmail) return;

    let isMounted = true;

    async function verifyDeviceLock() {
      try {
        if (!currentEmail) return;
        const fp = await getDeviceFingerprint();
        if (!isMounted || !fp) return;

        // Check local storage lock first
        const localBound = localStorage.getItem('sensei_bound_account_email')?.toLowerCase();
        if (localBound && localBound !== currentEmail) {
          setIsBlocked(true);
          const masked = maskEmail(localBound);
          setBlockedDetails({
            boundAccount: masked,
            message: `This device is already locked to ${masked}. Account switching is not permitted.`,
          });
          return;
        }

        // Verify with backend
        const { data } = await apiClient.post('/auth/check-device', { visitorId: fp });
        const res = data?.data || data;

        if (res?.isRegistered) {
          // If registered to a different account
          if (res.maskedEmail && !currentEmail.startsWith(res.maskedEmail.split('*')[0])) {
            setIsBlocked(true);
            setBlockedDetails({
              boundAccount: res.maskedEmail,
              message: res.message || 'This device is bound to an existing account. Account switching is blocked.',
            });
            return;
          }
        }

        // Safe: Bind this device locally to the current user
        localStorage.setItem('sensei_bound_account_email', currentEmail);
      } catch (err) {
        console.warn('[DeviceAccountGuard] Check error:', err);
      }
    }

    verifyDeviceLock();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, user]);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4">
        <div className="w-full max-w-md">
          <Card className="border border-orange-200/80 shadow-2xl shadow-orange-500/20 bg-white rounded-2xl overflow-hidden">
            <div className="h-2.5 w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 text-orange-600 border border-orange-200 shadow-sm">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-2">
                <Lock className="h-3.5 w-3.5" />
                <span>Account Switching Prohibited</span>
              </div>
              <CardTitle className="text-2xl font-serif font-bold text-slate-900">
                Device Lock Active
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-2 leading-relaxed">
                {blockedDetails.message ||
                  'This device is already associated with an existing Sensei account. Creating multiple accounts or switching accounts on the same device is strictly prohibited.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-8 px-6 space-y-5">
              {blockedDetails.boundAccount && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium">Device Registered To</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 tracking-wide">
                    {maskEmail(blockedDetails.boundAccount)}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full h-12 cursor-pointer bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:via-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-sm md:text-base disabled:opacity-75 disabled:pointer-events-none"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out &amp; Return to Original Account</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-400">
                Need help with your account? Contact{' '}
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

  return <>{children}</>;
}
