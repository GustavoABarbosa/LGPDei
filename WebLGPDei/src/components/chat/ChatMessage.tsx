import { ComplianceReport } from "@/components/report/ComplianceReport";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

type Props = {
  message: ChatMessage;
};

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (
    message.messageType === "assessment" &&
    message.assessmentSnapshot
  ) {
    return (
      <div className="flex justify-start">
        <div className="max-w-3xl w-full">
          <ComplianceReport
            snapshot={message.assessmentSnapshot}
            markdownFallback={message.content}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] min-w-[120px] px-4 py-3 text-sm leading-relaxed rounded-2xl",
          isUser
            ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-tr-sm"
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
  );
}
