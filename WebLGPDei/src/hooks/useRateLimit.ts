"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  formatRateLimitMessage,
  isRateLimitError,
  type RateLimitScope,
} from "@/lib/api";

type RateLimitState = Partial<Record<RateLimitScope, number>>;

const DEFAULT_RETRY_SECONDS = 3600;

export function useRateLimit() {
  const [limits, setLimits] = useState<RateLimitState>({});
  const limitsRef = useRef<RateLimitState>({});

  const syncLimits = useCallback((next: RateLimitState) => {
    limitsRef.current = next;
    setLimits(next);
  }, []);

  const applyRateLimit = useCallback(
    (scope: RateLimitScope, retryAfterSeconds?: number) => {
      const seconds = retryAfterSeconds ?? DEFAULT_RETRY_SECONDS;
      syncLimits({
        ...limitsRef.current,
        [scope]: Date.now() + seconds * 1000,
      });
      return formatRateLimitMessage(seconds);
    },
    [syncLimits],
  );

  const handleError = useCallback(
    (error: unknown, scope: RateLimitScope): string | null => {
      if (!isRateLimitError(error)) return null;
      return applyRateLimit(scope, error.retryAfterSeconds);
    },
    [applyRateLimit],
  );

  const isLimited = useCallback((scope: RateLimitScope) => {
    const until = limitsRef.current[scope];
    return until != null && until > Date.now();
  }, []);

  const getMessage = useCallback((scope: RateLimitScope) => {
    const until = limitsRef.current[scope];
    if (!until || until <= Date.now()) return null;
    const retryAfterSeconds = Math.ceil((until - Date.now()) / 1000);
    return formatRateLimitMessage(retryAfterSeconds);
  }, []);

  useEffect(() => {
    const active = Object.entries(limits).filter(
      ([, until]) => until != null && until > Date.now(),
    );
    if (active.length === 0) return;

    const nextExpiry = Math.min(
      ...(active.map(([, until]) => until) as number[]),
    );
    const timeout = setTimeout(() => {
      const now = Date.now();
      const next = { ...limitsRef.current };
      for (const [scope, until] of Object.entries(next)) {
        if (until && until <= now) {
          delete next[scope as RateLimitScope];
        }
      }
      syncLimits(next);
    }, nextExpiry - Date.now() + 100);

    return () => clearTimeout(timeout);
  }, [limits, syncLimits]);

  return { handleError, isLimited, getMessage };
}
