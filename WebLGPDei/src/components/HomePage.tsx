"use client";

import { Loader2, Menu } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { GuestConsentGate } from "@/components/consent/GuestConsentGate";
import { ErrorBanner } from "@/components/ErrorBanner";
import { GuestSessionBanner } from "@/components/GuestSessionBanner";
import { SessionSidebar } from "@/components/session/SessionSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { useDocuments } from "@/hooks/useDocuments";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useSessions } from "@/hooks/useSessions";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const {
    sessions,
    activeSessionId,
    sessionDetail,
    loading,
    loadSession,
    createSession,
    deleteSession,
    renameSession,
    ensureActiveSession,
    resetAfterSignOut,
    reloadAfterSignIn,
  } = useSessions(user !== null);

  const { sending, streamingContent, displayMessages, sendMessage, sendAssessmentRequest } =
    useChat(sessionDetail, loadSession);

  const {
    uploading,
    allDocuments,
    loadingAll,
    uploadDocument,
    loadAllDocuments,
    deleteDocument,
  } = useDocuments(
    sessionDetail,
    loadSession,
  );

  const { handleError, isLimited, getMessage } = useRateLimit();

  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bootstrappedRef = useRef(false);
  const prevUserRef = useRef<typeof user | undefined>(undefined);

  const messagesLimited = isLimited("messages");
  const uploadsLimited = isLimited("uploads");
  const sessionsLimited = isLimited("sessions");
  const currentSessionEmpty = (sessionDetail?.messages.length ?? 0) === 0;
  const messageLimitMessage = getMessage("messages");
  const uploadLimitMessage = getMessage("uploads");

  useEffect(() => {
    if (authLoading || bootstrappedRef.current) return;
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
  }, [authLoading, ensureActiveSession, handleError]);

  useEffect(() => {
    if (authLoading) return;

    const previousUser = prevUserRef.current;
    prevUserRef.current = user;

    if (previousUser === undefined) return;

    const signedOut = previousUser !== null && user === null;
    const signedIn = previousUser === null && user !== null;

    if (!signedOut && !signedIn) return;

    void (async () => {
      setBootstrapping(true);
      setError(null);
      try {
        if (signedOut) {
          resetAfterSignOut();
        } else {
          await reloadAfterSignIn();
        }
      } catch (err) {
        const limitMessage = handleError(err, "sessions");
        setError(
          limitMessage ?? getApiErrorMessage(err, "Falha ao carregar sessões"),
        );
      } finally {
        setBootstrapping(false);
      }
    })();
  }, [
    authLoading,
    handleError,
    reloadAfterSignIn,
    resetAfterSignOut,
    user,
  ]);

  const handleSend = useCallback(
    async (content: string, files: File[] = []) => {
      if (isLimited("messages")) return;
      setError(null);
      try {
        for (const file of files) {
          if (isLimited("uploads")) return;
          await uploadDocument(file);
        }
        if (files.length > 0) {
          void loadAllDocuments();
        }
        await sendMessage(content, files.map((file) => file.name));
      } catch (err) {
        const limitMessage = handleError(err, files.length > 0 ? "uploads" : "messages");
        setError(
          limitMessage ??
            getApiErrorMessage(
              err,
              files.length > 0
                ? "Falha ao enviar documento"
                : "Falha ao enviar mensagem",
            ),
        );
      }
    },
    [handleError, isLimited, loadAllDocuments, sendMessage, uploadDocument],
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

  const handleDeleteDocument = useCallback(
    async (docId: string, sessionId: string) => {
      setError(null);
      try {
        await deleteDocument(docId, sessionId);
      } catch (err) {
        setError(getApiErrorMessage(err, "Falha ao excluir arquivo"));
      }
    },
    [deleteDocument],
  );

  const handleLoadDocuments = useCallback(() => {
    void loadAllDocuments().catch((err) => {
      setError(getApiErrorMessage(err, "Falha ao carregar arquivos"));
    });
  }, [loadAllDocuments]);

  const handleCreateSession = useCallback(async () => {
    if (isLimited("sessions")) return;
    if (currentSessionEmpty) return;
    setError(null);
    try {
      await createSession();
    } catch (err) {
      const limitMessage = handleError(err, "sessions");
      setError(
        limitMessage ?? getApiErrorMessage(err, "Falha ao criar sessão"),
      );
    }
  }, [createSession, currentSessionEmpty, handleError, isLimited]);

  const handleGuestConsent = useCallback(async () => {
    setError(null);
    try {
      await createSession({ consent: true });
    } catch (err) {
      const limitMessage = handleError(err, "sessions");
      setError(
        limitMessage ?? getApiErrorMessage(err, "Falha ao criar sessão"),
      );
    }
  }, [createSession, handleError]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      setError(null);
      try {
        await deleteSession(sessionId);
        void loadAllDocuments();
      } catch (err) {
        setError(getApiErrorMessage(err, "Falha ao excluir sessão"));
      }
    },
    [deleteSession, loadAllDocuments],
  );

  const handleRenameSession = useCallback(
    async (sessionId: string, title: string) => {
      setError(null);
      try {
        await renameSession(sessionId, title);
      } catch (err) {
        setError(getApiErrorMessage(err, "Falha ao renomear sessão"));
        throw err;
      }
    },
    [renameSession],
  );

  if (bootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Fechar menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={(id) => {
            setError(null);
            void loadSession(id).catch((err) => {
              setError(getApiErrorMessage(err, "Falha ao carregar sessão"));
            });
            setSidebarOpen(false);
          }}
          onCreate={() => void handleCreateSession()}
          onDelete={handleDeleteSession}
          onRename={(id, title) => handleRenameSession(id, title)}
          createDisabled={sessionsLimited || currentSessionEmpty}
          documents={allDocuments}
          documentsLoading={loadingAll}
          onLoadDocuments={handleLoadDocuments}
          onDeleteDocument={handleDeleteDocument}
          onError={setError}
          onCloseMobile={() => setSidebarOpen(false)}
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:relative md:z-auto",
            sidebarOpen ? "flex" : "hidden md:flex",
          )}
        />

        <main className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex items-center border-b border-[var(--border)] px-3 py-2 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="ml-2 text-sm font-medium">LGPD<span className="text-primary">ei</span></span>
          </div>

          {error && <ErrorBanner message={error} />}

          {!user && sessionDetail && <GuestSessionBanner />}

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessionDetail ? (
            <ChatPanel
              sessionId={sessionDetail.session.id}
              messages={displayMessages}
              streamingContent={streamingContent}
              sending={sending || uploading}
              onSend={handleSend}
              onAssess={handleAssess}
              messagesLimited={messagesLimited}
              uploadsLimited={uploadsLimited}
              messageLimitMessage={messageLimitMessage}
              uploadLimitMessage={uploadLimitMessage}
            />
          ) : !user ? (
            <GuestConsentGate onAccept={handleGuestConsent} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted">
              Nenhuma sessão ativa
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border bg-card px-4 py-1.5 text-center text-xs text-muted md:py-2">
        <span className="md:hidden">
          Não substitui assessoria jurídica ·{" "}
          <Link href="/privacidade" className="underline hover:text-foreground">
            Privacidade
          </Link>{" "}
          ·{" "}
          <Link href="/termos" className="underline hover:text-foreground">
            Termos
          </Link>
        </span>
        <span className="hidden md:inline">
          Ferramenta educativa. Não substitui assessoria jurídica. Mensagens e documentos
          são enviados à Anthropic (EUA) para gerar as respostas. Veja a{" "}
          <Link href="/privacidade" className="underline hover:text-foreground">
            Política de privacidade
          </Link>{" "}
          e os{" "}
          <Link href="/termos" className="underline hover:text-foreground">
            Termos de uso
          </Link>
          .
        </span>
      </footer>
    </div>
  );
}
