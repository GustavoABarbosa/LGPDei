"use client";

import { useCallback, useState } from "react";

import { apiFetch } from "@/lib/api";
import type { SessionDetail, SessionDocumentMeta, UserDocument } from "@/types";

export function useDocuments(
  sessionDetail: SessionDetail | null,
  loadSession: (id: string, options?: { silent?: boolean }) => Promise<SessionDetail>,
) {
  const [uploading, setUploading] = useState(false);
  const [allDocuments, setAllDocuments] = useState<UserDocument[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const loadAllDocuments = useCallback(async () => {
    setLoadingAll(true);
    try {
      const data = await apiFetch<{ documents: UserDocument[] }>("/documents");
      setAllDocuments(data.documents);
      return data.documents;
    } finally {
      setLoadingAll(false);
    }
  }, []);

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
    async (docId: string, sessionId?: string) => {
      const targetSessionId = sessionId ?? sessionDetail?.session.id;
      if (!targetSessionId) return;

      await apiFetch(`/sessions/${targetSessionId}/documents/${docId}`, {
        method: "DELETE",
      });

      setAllDocuments((documents) => documents.filter((document) => document.id !== docId));

      if (sessionDetail?.session.id === targetSessionId) {
        await loadSession(targetSessionId, { silent: true });
      }
    },
    [loadSession, sessionDetail],
  );

  return {
    uploading,
    allDocuments,
    loadingAll,
    uploadDocument,
    loadAllDocuments,
    deleteDocument,
  };
}
