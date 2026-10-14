"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { SessionDetail, SessionListItem } from "@/types";

const DEFAULT_SESSION_TITLES = new Set(["Nova sessão", "New session"]);

function isDefaultSessionTitle(title: string) {
  return DEFAULT_SESSION_TITLES.has(title);
}

function isEmptySession(detail: SessionDetail) {
  return detail.messages.length === 0;
}

/**
 * Guests must consent before their first session is created, so for them an empty session list
 * leaves no active session (the consent gate is shown) instead of creating one automatically.
 */
export function useSessions(signedIn: boolean) {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionDetailRef = useRef(sessionDetail);
  const activeSessionIdRef = useRef(activeSessionId);
  const signedInRef = useRef(signedIn);
  useEffect(() => {
    sessionDetailRef.current = sessionDetail;
    activeSessionIdRef.current = activeSessionId;
    signedInRef.current = signedIn;
  }, [sessionDetail, activeSessionId, signedIn]);

  const loadSessions = useCallback(async () => {
    const data = await apiFetch<{ sessions: SessionListItem[] }>("/sessions");
    setSessions(data.sessions);
    return data.sessions;
  }, []);

  const loadSession = useCallback(
    async (sessionId: string, options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const previousId = activeSessionIdRef.current;
      if (!silent) {
        activeSessionIdRef.current = sessionId;
        setActiveSessionId(sessionId);
        setLoading(true);
      }
      // A later selection supersedes this request; its response must not replace the newer session.
      const isCurrent = () => activeSessionIdRef.current === sessionId;

      let detail: SessionDetail;
      try {
        detail = await apiFetch<SessionDetail>(`/sessions/${sessionId}`);
      } catch (err) {
        if (!silent && isCurrent()) {
          activeSessionIdRef.current = previousId;
          setActiveSessionId(previousId);
          setLoading(false);
        }
        throw err;
      }

      if (!silent && isCurrent()) setLoading(false);
      if (!isCurrent()) return detail;

      setSessionDetail(detail);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                title: detail.session.title,
                updatedAt: detail.session.updatedAt,
              }
            : session,
        ),
      );
      return detail;
    },
    [],
  );

  const createSession = useCallback(async (options?: { consent?: boolean }) => {
    const current = sessionDetailRef.current;
    if (current && isEmptySession(current)) {
      return current;
    }

    setLoading(true);
    try {
      const list = await loadSessions();
      for (const item of list) {
        if (!isDefaultSessionTitle(item.title)) continue;
        if (current && item.id === current.session.id) continue;

        const detail = await apiFetch<SessionDetail>(`/sessions/${item.id}`);
        if (!isEmptySession(detail)) continue;

        setSessionDetail(detail);
        setActiveSessionId(detail.session.id);
        return detail;
      }

      const detail = await apiFetch<SessionDetail>("/sessions", {
        method: "POST",
        body: JSON.stringify({ locale: "pt", consent: options?.consent ?? false }),
      });
      setSessionDetail(detail);
      setActiveSessionId(detail.session.id);
      await loadSessions();
      return detail;
    } finally {
      setLoading(false);
    }
  }, [loadSessions]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await apiFetch(`/sessions/${sessionId}`, { method: "DELETE" });

      const remaining = await loadSessions();
      const wasActive = activeSessionIdRef.current === sessionId;

      if (!wasActive) return;

      if (remaining.length > 0) {
        await loadSession(remaining[0].id);
        return;
      }

      setSessionDetail(null);
      setActiveSessionId(null);
      sessionDetailRef.current = null;
      activeSessionIdRef.current = null;
      if (signedInRef.current) await createSession();
    },
    [createSession, loadSession, loadSessions],
  );

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    const detail = await apiFetch<SessionDetail>(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: detail.session.title,
              updatedAt: detail.session.updatedAt,
            }
          : session,
      ),
    );

    if (activeSessionIdRef.current === sessionId) {
      setSessionDetail(detail);
    }

    return detail;
  }, []);

  const resetSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
    setSessionDetail(null);
  }, []);

  const resetAfterSignOut = useCallback(() => {
    resetSessions();
  }, [resetSessions]);

  const reloadAfterSignIn = useCallback(async () => {
    const list = await loadSessions();
    const currentId = activeSessionIdRef.current;

    if (currentId) {
      try {
        return await loadSession(currentId);
      } catch {
        // Current session may no longer be accessible; fall back to user list.
      }
    }

    if (list.length > 0) {
      return loadSession(list[0].id);
    }

    return createSession();
  }, [createSession, loadSession, loadSessions]);

  const ensureActiveSession = useCallback(async () => {
    if (sessionDetailRef.current && activeSessionIdRef.current) {
      return sessionDetailRef.current;
    }

    const list = await loadSessions();
    if (list.length > 0) {
      return loadSession(list[0].id);
    }
    return signedInRef.current ? createSession() : null;
  }, [createSession, loadSession, loadSessions]);

  return {
    sessions,
    activeSessionId,
    sessionDetail,
    loading,
    loadSessions,
    loadSession,
    createSession,
    deleteSession,
    renameSession,
    ensureActiveSession,
    resetAfterSignOut,
    reloadAfterSignIn,
    setSessionDetail,
  };
}
