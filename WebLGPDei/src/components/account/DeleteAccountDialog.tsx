"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  Dialog,
  DialogActions,
  dialogCancelClass,
  dialogDangerClass,
} from "@/components/Dialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage, useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DeleteAccountDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="Excluir conta">
      <DeleteAccountForm onClose={onClose} />
    </Dialog>
  );
}

function DeleteAccountForm({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError("Informe sua senha");
      return;
    }

    setError(null);
    setDeleting(true);
    try {
      await deleteAccount(password);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível excluir a conta"));
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <p className="text-sm text-muted">
        Sua conta, todas as sessões, mensagens, relatórios e documentos serão
        apagados permanentemente. Isso também revoga seu consentimento. Se
        quiser uma cópia, use &quot;Baixar meus dados&quot; antes.
      </p>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Confirme sua senha</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400/30"
        />
      </label>
      {error && <ErrorBanner message={error} inline />}
      <DialogActions>
        <button type="button" onClick={onClose} className={dialogCancelClass}>
          Cancelar
        </button>
        <button type="submit" disabled={deleting} className={dialogDangerClass}>
          {deleting && <Loader2 className="size-4 animate-spin" />}
          Excluir definitivamente
        </button>
      </DialogActions>
    </form>
  );
}
