"use client";

import { useCallback, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { SessionDetail, SessionDocumentMeta } from "@/types";

export function useDocuments(
  sessionDetail: SessionDetail | null,
  loadSession: (id: string, options?: { silent?: boolean }) => Promise<SessionDetail>,
) {
  const [uploading, setUploading] = useState(false);

  const uploadDocument = useCallback(
    async (file: File): Promise<SessionDocumentMeta> => {
      if (!sessionDetail) throw new Error("No active session");

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const data = await apiFetch<{ document: SessionDocumentMeta }>(
          `/sessions/${sessionDetail.session.id}/documents`,
          {
            method: "POST",
            body: formData,
          },
        );

        await loadSession(sessionDetail.session.id, { silent: true });
        return data.document;
      } finally {
        setUploading(false);
      }
    },
    [loadSession, sessionDetail],
  );

  const deleteDocument = useCallback(
    async (docId: string) => {
      if (!sessionDetail) return;

      await apiFetch(`/sessions/${sessionDetail.session.id}/documents/${docId}`, {
        method: "DELETE",
      });
      await loadSession(sessionDetail.session.id, { silent: true });
    },
    [loadSession, sessionDetail],
  );

  return { uploading, uploadDocument, deleteDocument };
}
