'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumeUpload } from '@/components/candidate/ResumeUpload';
import { ShieldAlert, ArrowRight, Sparkles, ShieldCheck, CheckCircle, Lock, LogOut, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { maskEmail } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      if (typeof signOut === 'function') {
        await signOut();
      }
    } catch (err) {
      console.warn('Signout error:', err);
    } finally {
      window.location.href = '/sign-in';
    }
  };

  useEffect(() => {
    const userRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
    if (userRole === 'PLATFORM_ADMIN') {
      router.replace('/admin/dashboard');
    } else if (userRole === 'CANDIDATE' || userRole === 'RECRUITER') {
      router.replace('/candidate/dashboard');
    }
  }, [user, router]);

  // Check device registration on mount to prevent multi-account switching
  useEffect(() => {
    let isMounted = true;
    async function checkDevice() {
      try {
        const visitorId = await getDeviceFingerprint();
        if (!isMounted || !visitorId) return;

        const { data } = await apiClient.post('/auth/check-device', { visitorId });
        const res = data?.data || data;
        if (res?.isRegistered && isMounted) {
          setDeviceBlocked(true);
          setBlockedMessage(res.message);
          setMaskedEmail(res.maskedEmail);
        }
      } catch (err) {
        // Silently allow if check fails
      }
    }

    checkDevice();
    return () => {
      isMounted = false;
    };
  }, []);

  // Candidate form state: resume + target role & experience
  const [candidateData, setCandidateData] = useState({
    currentDesignation: '',
    experience: '',
    resumeUrl: '',
    resumeFileName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Capture open-source browser fingerprint for abuse prevention
      const deviceFingerprint = await getDeviceFingerprint().catch(() => null);

      const payload = {
        role: 'CANDIDATE',
        resumeUrl: candidateData.resumeUrl || null,
        resumeFileName: candidateData.resumeFileName || null,
        currentDesignation: candidateData.currentDesignation.trim() || null,
        experience: candidateData.experience ? parseInt(candidateData.experience) : null,
        deviceFingerprint: deviceFingerprint || null,
      };

      await apiClient.post('/auth/setup', payload);

      toast.success('Profile set up! Your resume is saved and 2 free practice credits are ready.');
      router.push('/candidate/dashboard');
    } catch (error: any) {
      if (error.response?.status === 403) {
        setDeviceBlocked(true);
        setBlockedMessage(
          error.response?.data?.message ||
            'This device is already associated with an existing Sensei account. Multiple accounts or account switching is not permitted.'
        );
      } else {
        toast.error(error.response?.data?.message || 'Failed to complete profile setup');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (deviceBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/30 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border border-orange-200/80 shadow-2xl shadow-orange-500/10 bg-white rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500" />
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4 text-orange-600 border border-orange-200 shadow-sm">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-semibold mb-2">
                <Lock className="h-3 w-3" />
                <span>Device Policy Enforced</span>
              </div>
              <CardTitle className="text-2xl font-serif font-bold text-slate-900">
                Device Already Registered
              </CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-2 leading-relaxed">
                {blockedMessage ||
                  'This device is already linked to an existing Sensei account. Multiple accounts or account switching is strictly prohibited on the same device.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-8 px-6 space-y-5">
              {maskedEmail && (
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-center">
                  <p className="text-xs text-slate-500 font-medium">Original Linked Account</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5 tracking-wide">
                    {maskEmail(maskedEmail)}
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
                    <span>Sign Out &amp; Return to Registered Account</span>
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-400">
                Need assistance? Contact{' '}
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
    <div className="min-h-screen bg-gradient-to-br from-[#fff7f2] via-white to-pink-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 rounded-full mb-4 border border-orange-200/60">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span className="text-xs md:text-sm font-semibold">2 Free AI Practice Interviews Included</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
            Set Up Your Interview Profile
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-lg mx-auto">
            Upload your resume once so our AI can personalize your interview questions and applications automatically.
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border border-slate-200/80 shadow-xl shadow-slate-200/50 bg-white backdrop-blur rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  Quick Profile Setup
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-1">
                  Upload your resume to get practicing with AI right away.
                </CardDescription>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-orange-900 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                <span>Private &amp; Secure</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primary Feature: Resume Upload */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                  <span>Resume / CV</span>
                  <span className="text-xs font-normal text-slate-500">
                    PDF, DOCX up to 5MB
                  </span>
                </label>

                <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-200/80">
                  <ResumeUpload
                    currentResumeUrl={candidateData.resumeUrl}
                    currentFileName={candidateData.resumeFileName}
                    onUploadSuccess={(url, fileName) => {
                      setCandidateData((prev) => ({
                        ...prev,
                        resumeUrl: url,
                        resumeFileName: fileName || prev.resumeFileName,
                      }));
                    }}
                  />
                </div>

                <div className="flex items-start gap-2 pt-1 text-xs text-slate-500">
                  <CheckCircle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                  <span>
                    Stored once and reused automatically for all your mock interviews and job applications.
                  </span>
                </div>
              </div>

              {/* Simplified Quick Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Target or Current Role"
                  value={candidateData.currentDesignation}
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      currentDesignation: e.target.value,
                    })
                  }
                  placeholder="e.g., Full Stack Engineer"
                />

                <Input
                  label="Years of Experience"
                  type="number"
                  min="0"
                  max="50"
                  value={candidateData.experience}
                  onChange={(e) =>
                    setCandidateData({
                      ...candidateData,
                      experience: e.target.value,
                    })
                  }
                  placeholder="e.g., 3"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:opacity-95 text-white font-medium py-3 text-base shadow-lg shadow-orange-500/25 transition-all rounded-xl"
                  isLoading={isSubmitting}
                >
                  Claim 2 Free Credits &amp; Start Practicing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
