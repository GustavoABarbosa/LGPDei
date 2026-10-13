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
        "flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-900 p-2",
        inline ? "relative w-full" : "absolute top-4 right-4 z-50 max-w-xl",
      )}
    >
      <div className="p-2 rounded-lg bg-red-500/50">
        <WarningCircleIcon
          className="shrink-0 text-white"
          size={24}
          weight="fill"
          aria-hidden
        />
      </div>
      <span className="text-sm text-white">{message}</span>
    </div>
  );
}
