"use client";

import { useEffect, useRef } from "react";

import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageBubble } from "@/components/chat/ChatMessage";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import type { ChatMessage, SessionDocumentMeta } from "@/types";

const WELCOME_MESSAGE =
  "Como posso te ajudar a ser mais LGPD?";

type Props = {
  messages: ChatMessage[];
  documents: SessionDocumentMeta[];
  streamingContent: string;
  sending: boolean;
  uploading: boolean;
  onSend: (content: string) => Promise<void>;
  onAssess: () => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onRemoveDocument: (docId: string) => Promise<void>;
  messageLimitMessage?: string | null;
  uploadLimitMessage?: string | null;
  messagesLimited?: boolean;
  uploadsLimited?: boolean;
};

export function ChatPanel({
  messages,
  documents,
  streamingContent,
  sending,
  uploading,
  onSend,
  onAssess,
  onUpload,
  onRemoveDocument,
  messageLimitMessage,
  uploadLimitMessage,
  messagesLimited,
  uploadsLimited,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isEmpty =
    messages.length === 0 && !streamingContent && !sending;

  useEffect(() => {
    if (isEmpty) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isEmpty, messages, streamingContent, sending]);

  const chatInput = (
    <ChatInput
      onSend={onSend}
      onAssess={onAssess}
      onUpload={onUpload}
      onRemoveDocument={onRemoveDocument}
      documents={documents}
      sending={sending}
      uploading={uploading}
      disabled={messagesLimited}
      disabledMessage={messageLimitMessage}
      uploadDisabled={uploadsLimited}
      uploadDisabledMessage={uploadLimitMessage}
    />
  );

  if (isEmpty) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6">
        <p className="mb-6 max-w-2xl text-center text-xl">
          {WELCOME_MESSAGE}
        </p>
        <div className="w-full max-w-2xl">{chatInput}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <MarkdownContent content={streamingContent} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>{chatInput}
    </div>
  );
}
