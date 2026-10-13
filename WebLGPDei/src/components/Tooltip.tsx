"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Props = {
  content: string;
  children: React.ReactNode;
  className?: string;
};

export function Tooltip({ content, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  }

  function show() {
    updatePosition();
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? tooltipId : undefined}
      >
        {children}
      </span>

      {mounted &&
        open &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{ top: coords.top - 8, left: coords.left }}
            className="pointer-events-none fixed z-[100] w-max max-w-md -translate-x-1/2 -translate-y-full whitespace-normal break-words rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] shadow-lg"
          >
            {content}
            <span
              aria-hidden
              className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--border)]"
            />
            <span
              aria-hidden
              className="absolute left-1/2 top-full -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--card)]"
            />
          </span>,
          document.body,
        )}
    </>
  );
}
