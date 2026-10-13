"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Dialog({ open, onClose, title, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-foreground shadow-xl backdrop:bg-black/60"
    >
      {open && (
        <>
          <h2 className="mb-3 text-base font-semibold">{title}</h2>
          {children}
        </>
      )}
    </dialog>
  );
}

export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2">{children}</div>;
}

export const dialogCancelClass =
  "rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800";

export const dialogDangerClass =
  "inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60";

export const dialogPrimaryClass =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60";
