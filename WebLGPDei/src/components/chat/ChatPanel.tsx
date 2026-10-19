"use client";

import { useEffect, useRef } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageBubble } from "@/components/chat/ChatMessage";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { KnowledgeFreshnessNotice } from "@/components/consent/KnowledgeFreshnessNotice";
import { SensitiveDataNotice } from "@/components/consent/SensitiveDataNotice";
import type { ChatMessage } from "@/types";

const WELCOME_MESSAGE = "Como posso te ajudar a cumprir a LGPD?";

type Props = {
  sessionId: string;
  messages: ChatMessage[];
  streamingContent: string;
  sending: boolean;
  onSend: (content: string, files: File[]) => Promise<void>;
  onAssess: () => Promise<void>;
  messageLimitMessage?: string | null;
  uploadLimitMessage?: string | null;
  messagesLimited?: boolean;
  uploadsLimited?: boolean;
};

export function ChatPanel({
  sessionId,
  messages,
  streamingContent,
  sending,
  onSend,
  onAssess,
  messageLimitMessage,
  uploadLimitMessage,
  messagesLimited,
  uploadsLimited,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0 && !streamingContent && !sending;

  useEffect(() => {
    if (isEmpty) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isEmpty, messages, streamingContent, sending]);

  const chatInput = (
    <>
      <ChatInput
        key={sessionId}
        onSend={onSend}
        onAssess={onAssess}
        sending={sending}
        disabled={messagesLimited}
        disabledMessage={messageLimitMessage}
        uploadDisabled={uploadsLimited}
        uploadDisabledMessage={uploadLimitMessage}
      />
      <SensitiveDataNotice compactOnMobile className="mt-1.5 px-3 text-center md:mt-2 hidden" />
      <KnowledgeFreshnessNotice compactOnMobile className="mt-1.5 md:mt-2 px-3 text-center" />
    </>
  );

  if (isEmpty) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6">
        <p className="mb-6 max-w-2xl text-center text-xl">{WELCOME_MESSAGE}</p>
        <div className="w-full max-w-2xl">{chatInput}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col max-w-3xl mx-auto">
      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <MarkdownContent content={streamingContent} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 pb-2 pt-2 md:p-4">{chatInput}</div>
    </div>
  );
}
