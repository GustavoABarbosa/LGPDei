"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useIsClient } from "@/hooks/useIsClient";
import { cn } from "@/lib/utils";

type Side = "top" | "right";

type Props = {
  content: string;
  children: React.ReactNode;
  className?: string;
  /** Preferred placement relative to the trigger. Defaults to top. */
  side?: Side;
};

export function Tooltip({ content, children, className, side = "top" }: Props) {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (side === "right") {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
      return;
    }

    setCoords({
      top: rect.top - 8,
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
  }, [open, side]);

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
            style={{ top: coords.top, left: coords.left }}
            className={cn(
              "pointer-events-none fixed z-[100] w-max max-w-md whitespace-normal break-words rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs text-[var(--foreground)] shadow-lg",
              side === "right"
                ? "-translate-y-1/2"
                : "-translate-x-1/2 -translate-y-full",
            )}
          >
            {content}
            {side === "right" ? (
              <>
                <span
                  aria-hidden
                  className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[var(--border)]"
                />
                <span
                  aria-hidden
                  className="absolute right-full top-1/2 -translate-y-1/2 translate-x-px border-4 border-transparent border-r-[var(--card)]"
                />
              </>
            ) : (
              <>
                <span
                  aria-hidden
                  className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--border)]"
                />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-full -translate-x-1/2 -mt-px border-4 border-transparent border-t-[var(--card)]"
                />
              </>
            )}
          </span>,
          document.body,
        )}
    </>
  );
}
