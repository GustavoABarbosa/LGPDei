import { FileText, X } from "lucide-react";

import { Tooltip } from "@/components/Tooltip";
import { cn } from "@/lib/utils";

export type DocumentAttachmentItem = {
  id: string;
  fileName: string;
};

type ChipProps = {
  fileName: string;
  onRemove?: () => void;
};

export function DocumentAttachmentChip({ fileName, onRemove }: ChipProps) {
  return (
    <Tooltip content={fileName}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] py-1 text-xs",
          onRemove ? "ps-2 pe-1 max-w-48" : "max-w-sm ps-2 pe-3",
        )}
      >
        <FileText className="size-3.5 shrink-0" />
        <p className="truncate">{fileName}</p>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            aria-label={`Remover ${fileName}`}
          >
            <X className="size-3" />
          </button>
        )}
      </span>
    </Tooltip>
  );
}

type ListProps = {
  items: DocumentAttachmentItem[];
  onRemove?: (id: string) => void;
  className?: string;
};

export function DocumentAttachmentList({ items, onRemove, className }: ListProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <DocumentAttachmentChip
          key={item.id}
          fileName={item.fileName}
          onRemove={onRemove ? () => onRemove(item.id) : undefined}
        />
      ))}
    </div>
  );
}
