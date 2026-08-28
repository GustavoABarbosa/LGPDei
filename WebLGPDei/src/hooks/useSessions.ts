"use client";

import { useCallback, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { SessionDetail, SessionListItem } from "@/types";

export function useSessions() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionDetailRef = useRef(sessionDetail);
  const activeSessionIdRef = useRef(activeSessionId);
  sessionDetailRef.current = sessionDetail;
  activeSessionIdRef.current = activeSessionId;

  const loadSessions = useCallback(async () => {
    const data = await apiFetch<{ sessions: SessionListItem[] }>("/sessions");
    setSessions(data.sessions);
    return data.sessions;
  }, []);

  const loadSession = useCallback(
    async (sessionId: string, options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      try {
        const detail = await apiFetch<SessionDetail>(`/sessions/${sessionId}`);
        setSessionDetail(detail);
        setActiveSessionId(sessionId);
        return detail;
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [],
  );

  const createSession = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await apiFetch<SessionDetail>("/sessions", {
        method: "POST",
        body: JSON.stringify({ locale: "pt" }),
      });
      setSessionDetail(detail);
      setActiveSessionId(detail.session.id);
      await loadSessions();
      return detail;
    } finally {
      setLoading(false);
    }
  }, [loadSessions]);

  const ensureActiveSession = useCallback(async () => {
    if (sessionDetailRef.current && activeSessionIdRef.current) {
      return sessionDetailRef.current;
    }

    const list = await loadSessions();
    if (list.length > 0) {
      return loadSession(list[0].id);
    }
    return createSession();
  }, [createSession, loadSession, loadSessions]);

  return {
    sessions,
    activeSessionId,
    sessionDetail,
    loading,
    loadSessions,
    loadSession,
    createSession,
    ensureActiveSession,
    setSessionDetail,
  };
}
