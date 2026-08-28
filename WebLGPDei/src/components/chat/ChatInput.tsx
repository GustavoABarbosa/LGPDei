"use client";

import { FileText, Loader2, ArrowUp, ShieldCheckIcon, X } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { SessionDocumentMeta } from "@/types";

type Props = {
  onSend: (content: string) => Promise<void>;
  onAssess: () => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onRemoveDocument: (docId: string) => Promise<void>;
  documents: SessionDocumentMeta[];
  sending: boolean;
  uploading: boolean;
  disabled?: boolean;
  disabledMessage?: string | null;
  uploadDisabled?: boolean;
  uploadDisabledMessage?: string | null;
};

export function ChatInput({
  onSend,
  onAssess,
  onUpload,
  onRemoveDocument,
  documents,
  sending,
  uploading,
  disabled,
  disabledMessage,
  uploadDisabled,
  uploadDisabledMessage,
}: Props) {
  const [content, setContent] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending || disabled) return;
    setContent("");
    await onSend(trimmed);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = "";
  }

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
      {documents.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {documents.map((doc) => (
            <span
              key={doc.id}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs"
            >
              <FileText className="h-3 w-3" />
              {doc.fileName}
              <button
                type="button"
                onClick={() => onRemoveDocument(doc.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-neutral-200"
                aria-label={`Remover ${doc.fileName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex p-1 gap-1 rounded-full items-center border border-[var(--border)] bg-[var(--background)]"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploadDisabled || uploading || sending}
          className="shrink-0 p-2 hover-button rounded-full ms-0.5 hover:bg-emerald-500/50"
          aria-label="Enviar documento"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </button>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva seu trabalho, fluxo de dados ou dúvidas sobre LGPD..."
          rows={1}
          disabled={disabled || sending}
          className="w-full resize-none rounded-xl text-sm outline-none py-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={disabled || !content.trim() || sending}
          aria-label="Enviar"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full p-2 text-white ",
            (disabled && !sending) ? '' :
            (disabled || sending || !content.trim()) ? "cursor-default bg-neutral-400" : "bg-[var(--primary)] hover:bg-emerald-700 hover-button",
          )}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
