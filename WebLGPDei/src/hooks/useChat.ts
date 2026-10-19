"use client";

import { useCallback, useMemo, useState } from "react";

import { API_BASE, CSRF_HEADER, CSRF_HEADER_VALUE, throwIfNotOk } from "@/lib/api";
import type { ChatMessage, SessionDetail } from "@/types";

function mergeWithPendingMessage(
  serverMessages: ChatMessage[],
  pendingUserMessage: ChatMessage | null,
): ChatMessage[] {
  if (!pendingUserMessage) return serverMessages;

  const last = serverMessages[serverMessages.length - 1];
  if (last?.role === "user" && last.content === pendingUserMessage.content) {
    return serverMessages;
  }

  return [...serverMessages, pendingUserMessage];
}

export function useChat(
  sessionDetail: SessionDetail | null,
  loadSession: (id: string, options?: { silent?: boolean }) => Promise<SessionDetail>,
) {
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<ChatMessage | null>(
    null,
  );

  const displayMessages = useMemo(
    () =>
      mergeWithPendingMessage(sessionDetail?.messages ?? [], pendingUserMessage),
    [pendingUserMessage, sessionDetail?.messages],
  );

  const sendMessage = useCallback(
    async (content: string, attachments: string[] = []) => {
      if (!sessionDetail) return;

      const tempUserMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content,
        messageType: "chat",
        assessmentSnapshot: null,
        attachments,
        createdAt: new Date().toISOString(),
      };

      setPendingUserMessage(tempUserMessage);
      setSending(true);
      setStreamingContent("");

      try {
        const response = await fetch(
          `${API_BASE}/sessions/${sessionDetail.session.id}/messages/stream`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "x-locale": "pt",
              [CSRF_HEADER]: CSRF_HEADER_VALUE,
            },
            body: JSON.stringify({ content, attachments }),
          },
        );

        await throwIfNotOk(response);

        if (!response.body) {
          throw new Error("Failed to stream response");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;

            const parsed = JSON.parse(payload) as {
              content?: string;
              error?: string;
            };

            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              assistantContent += parsed.content;
              setStreamingContent(assistantContent);
            }
          }
        }

        await loadSession(sessionDetail.session.id, { silent: true });
      } finally {
        setPendingUserMessage(null);
        setSending(false);
        setStreamingContent("");
      }
    },
    [loadSession, sessionDetail],
  );

  const sendAssessmentRequest = useCallback(async () => {
    return sendMessage(
      "Por favor, gere uma análise completa de conformidade LGPD com base em tudo que discutimos.",
    );
  }, [sendMessage]);

  return {
    sending,
    streamingContent,
    displayMessages,
    sendMessage,
    sendAssessmentRequest,
  };
}
