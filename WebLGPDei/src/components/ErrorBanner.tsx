"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

type Props = {
  message: string;
  inline?: boolean;
};

export function ErrorBanner({ message, inline = false }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-red-500/25 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 shadow-lg",
        inline ? "relative w-full" : "absolute top-4 right-4 z-50 max-w-xl",
      )}
    >
      <WarningCircleIcon
        className="mt-0.5 shrink-0 text-red-500"
        size={16}
        weight="fill"
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}
