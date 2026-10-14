"use client";

import { FileText, Loader2, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { DocumentAttachmentList } from "@/components/chat/DocumentAttachmentList";
import { cn } from "@/lib/utils";

const MAX_ROWS = 10;

type PendingFile = {
  id: string;
  fileName: string;
  file: File;
};

type Props = {
  onSend: (content: string, files: File[]) => Promise<void>;
  onAssess: () => Promise<void>;
  sending: boolean;
  disabled?: boolean;
  disabledMessage?: string | null;
  uploadDisabled?: boolean;
  uploadDisabledMessage?: string | null;
};

export function ChatInput({
  onSend,
  sending,
  disabled,
  disabledMessage,
  uploadDisabled,
  uploadDisabledMessage,
}: Props) {
  const [content, setContent] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const style = getComputedStyle(textarea);
    const lineHeight = Number.parseFloat(style.lineHeight) || 20;
    const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const maxHeight = lineHeight * MAX_ROWS + padding;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    setIsMultiline(nextHeight - padding > lineHeight * 1.5);
  }, []);

  useEffect(() => {
    adjustTextarea();
  }, [content, adjustTextarea]);

  function addPendingFile(file: File) {
    setPendingFiles((prev) => [
      ...prev,
      {
        id: `${file.name}-${file.size}-${Date.now()}`,
        fileName: file.name,
        file,
      },
    ]);
  }

  function removePendingFile(id: string) {
    setPendingFiles((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending || disabled) return;

    const fileObjects = pendingFiles.map((item) => item.file);

    setContent("");
    setIsMultiline(false);
    setPendingFiles([]);
    await onSend(trimmed, fileObjects);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    addPendingFile(file);
    e.target.value = "";
  }

  const attachButton = (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={uploadDisabled || sending}
      className="shrink-0 rounded-full p-2 hover-button hover:bg-primary-500"
      aria-label="Anexar documento"
    >
      <FileText className="h-4 w-4" />
    </button>
  );

  const sendButton = (
    <button
      type="submit"
      disabled={disabled || !content.trim() || sending}
      aria-label="Enviar"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full p-2 text-white",
        disabled && !sending
          ? ""
          : disabled || sending || !content.trim()
            ? "cursor-default bg-neutral-400"
            : "bg-primary hover:bg-primary-700 hover-button",
      )}
    >
      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
    </button>
  );

  return (
    <div>
      {(disabledMessage || uploadDisabledMessage) && (
        <p
          role="status"
          className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
        >
          {disabledMessage ?? uploadDisabledMessage}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          "border border-[var(--border)] bg-[var(--background)]",
          isMultiline ? "flex flex-col gap-1 rounded-xl p-2" : "flex items-center gap-1 rounded-full p-1",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {!isMultiline && attachButton}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tire suas dúvidas sobre LGPD"
          rows={1}
          disabled={disabled || sending}
          className={cn(
            "custom-scrollbar w-full resize-none bg-transparent text-sm outline-none",
            isMultiline ? "px-2 py-1.5" : "rounded-xl py-2",
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
        />

        {isMultiline ? (
          <div className="flex items-center justify-between gap-1 px-1">
            {attachButton}
            {pendingFiles.length > 0 && (
              <DocumentAttachmentList
                items={pendingFiles}
                onRemove={removePendingFile}
                className="flex-1"
              />
            )}
            {sendButton}
          </div>
        ) : (
          sendButton
        )}
      </form>
    </div>
  );
}
