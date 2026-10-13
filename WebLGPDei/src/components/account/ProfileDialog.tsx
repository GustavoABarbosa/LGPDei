"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import {
  Dialog,
  DialogActions,
  dialogCancelClass,
  dialogPrimaryClass,
} from "@/components/Dialog";
import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage, useAuth, type AuthUser } from "@/hooks/useAuth";
import { validate } from "@/lib/auth-validation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ProfileDialog({ open, onClose }: Props) {
  const { user } = useAuth();

  return (
    <Dialog open={open} onClose={onClose} title="Editar perfil">
      {user && <ProfileForm user={user} onClose={onClose} />}
    </Dialog>
  );
}

function ProfileForm({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError =
      validate(name, "name", "Nome") ?? validate(email, "email", "E-mail");
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o perfil"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          maxLength={80}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/30"
        />
        <span className="block text-xs text-muted">
          Ao trocar o e-mail, você é desconectado dos outros dispositivos.
        </span>
      </label>
      {error && <ErrorBanner message={error} inline />}
      <DialogActions>
        <button type="button" onClick={onClose} className={dialogCancelClass}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className={dialogPrimaryClass}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Salvar
        </button>
      </DialogActions>
    </form>
  );
}
