'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { apiClient } from '@/lib/api/client';

export interface UseFingerprintReturn {
  visitorId: string | null;
  isLoading: boolean;
  error: Error | null;
  syncWithBackend: () => Promise<{ isValid: boolean; riskLevel: string } | null>;
}

/**
 * Custom React hook for client-side open-source device fingerprinting.
 *
 * @param autoSync - If true, automatically submits visitorId to /candidates/validate-fingerprint once ready
 */
export function useFingerprint(autoSync = false): UseFingerprintReturn {
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setIsLoading(true);
        const id = await getDeviceFingerprint();
        if (isMounted) {
          setVisitorId(id);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const syncWithBackend = useCallback(async () => {
    try {
      const id = visitorId || (await getDeviceFingerprint());
      if (!id) return null;

      const { data } = await apiClient.post('/candidates/validate-fingerprint', {
        visitorId: id,
      });
      return data?.data || data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 403) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('sensei:device_account_blocked', {
              detail: { message: msg },
            })
          );
        }
      }
      console.warn('[useFingerprint] Device fingerprint validation result:', msg);
      return null;
    }
  }, [visitorId]);

  useEffect(() => {
    if (autoSync && visitorId) {
      syncWithBackend();
    }
  }, [autoSync, visitorId, syncWithBackend]);

  return {
    visitorId,
    isLoading,
    error,
    syncWithBackend,
  };
}
