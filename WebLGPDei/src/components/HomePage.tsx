"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { ErrorBanner } from "@/components/ErrorBanner";
import { SessionSidebar } from "@/components/session/SessionSidebar";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useSessions } from "@/hooks/useSessions";
import { getApiErrorMessage } from "@/lib/api";

export function HomePage() {
  const {
    sessions,
    activeSessionId,
    sessionDetail,
    loading,
    loadSession,
    createSession,
    ensureActiveSession,
  } = useSessions();

  const { sending, streamingContent, displayMessages, sendMessage, sendAssessmentRequest } =
    useChat(sessionDetail, loadSession);

  const { uploading, uploadDocument, deleteDocument } = useDocuments(
    sessionDetail,
    loadSession,
  );

  const { handleError, isLimited, getMessage } = useRateLimit();

  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bootstrappedRef = useRef(false);

  const messagesLimited = isLimited("messages");
  const uploadsLimited = isLimited("uploads");
  const sessionsLimited = isLimited("sessions");
  const messageLimitMessage = getMessage("messages");
  const uploadLimitMessage = getMessage("uploads");
  const sessionLimitMessage = getMessage("sessions");

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    void (async () => {
      try {
        await ensureActiveSession();
      } catch (err) {
        const limitMessage = handleError(err, "sessions");
        setError(
          limitMessage ?? getApiErrorMessage(err, "Falha ao carregar sessões"),
        );
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [ensureActiveSession, handleError]);

  const handleSend = useCallback(
    async (content: string) => {
      if (isLimited("messages")) return;
      setError(null);
      try {
        await sendMessage(content);
      } catch (err) {
        const limitMessage = handleError(err, "messages");
        setError(
          limitMessage ?? getApiErrorMessage(err, "Falha ao enviar mensagem"),
        );
      }
    },
    [handleError, isLimited, sendMessage],
  );

  const handleAssess = useCallback(async () => {
    if (isLimited("messages")) return;
    setError(null);
    try {
      await sendAssessmentRequest();
    } catch (err) {
      const limitMessage = handleError(err, "messages");
      setError(
        limitMessage ?? getApiErrorMessage(err, "Falha ao gerar análise"),
      );
    }
  }, [handleError, isLimited, sendAssessmentRequest]);

  const handleCreateSession = useCallback(async () => {
    if (isLimited("sessions")) return;
    setError(null);
    try {
      await createSession();
    } catch (err) {
      const limitMessage = handleError(err, "sessions");
      setError(
        limitMessage ?? getApiErrorMessage(err, "Falha ao criar sessão"),
      );
    }
  }, [createSession, handleError, isLimited]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (isLimited("uploads")) return;
      setError(null);
      try {
        await uploadDocument(file);
      } catch (err) {
        const limitMessage = handleError(err, "uploads");
        setError(
          limitMessage ??
            getApiErrorMessage(err, "Falha ao enviar documento"),
        );
      }
    },
    [handleError, isLimited, uploadDocument],
  );

  if (bootstrapping || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={(id) => {
            void loadSession(id);
            setSidebarOpen(false);
          }}
          onCreate={() => void handleCreateSession()}
          createDisabled={sessionsLimited}
          createDisabledMessage={sessionLimitMessage}
          className={sidebarOpen ? "flex" : "hidden md:flex"}
        />

        <main className="relative flex min-h-0 flex-1 flex-col">
          {error && <ErrorBanner message={error} />}

          {sessionDetail ? (
            <ChatPanel
              messages={displayMessages}
              documents={sessionDetail.documents}
              streamingContent={streamingContent}
              sending={sending}
              uploading={uploading}
              onSend={handleSend}
              onAssess={handleAssess}
              onUpload={handleUpload}
              onRemoveDocument={deleteDocument}
              messagesLimited={messagesLimited}
              uploadsLimited={uploadsLimited}
              messageLimitMessage={messageLimitMessage}
              uploadLimitMessage={uploadLimitMessage}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted">
              Nenhuma sessão ativa
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border bg-card px-4 py-2 text-center text-xs text-muted">
        Ferramenta educativa. Não substitui assessoria jurídica. Dados enviados à API
        Anthropic conforme política de privacidade.
      </footer>
    </div>
  );
}
