import { ComplianceReport } from "@/components/report/ComplianceReport";
import { DocumentAttachmentList } from "@/components/chat/DocumentAttachmentList";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

type Props = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const attachmentItems = (message.attachments ?? []).map((fileName, index) => ({
    id: `${message.id}-attachment-${index}`,
    fileName,
  }));

  if (message.messageType === "assessment" && message.assessmentSnapshot) {
    return (
      <div className="flex justify-start">
        <div className="max-w-3xl w-full">
          <ComplianceReport snapshot={message.assessmentSnapshot} markdownFallback={message.content} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[85%] min-w-[120px] px-4 py-3 text-sm leading-relaxed rounded-xl [overflow-wrap:anywhere]",
            isUser
              ? "bg-primary text-[var(--primary-foreground)] rounded-tr-sm"
              : "border border-[var(--border)] bg-[var(--card)] rounded-tl-sm",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
      </div>

      {isUser && attachmentItems.length > 0 && (
        <DocumentAttachmentList
          items={attachmentItems}
          className="justify-end"
        />
      )}
    </div>
  );
}
