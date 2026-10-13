"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogActions,
  dialogCancelClass,
  dialogDangerClass,
} from "@/components/Dialog";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-muted">{description}</p>
      <DialogActions>
        <button type="button" onClick={onClose} className={dialogCancelClass}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={busy}
          className={dialogDangerClass}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {confirmLabel}
        </button>
      </DialogActions>
    </Dialog>
  );
}
