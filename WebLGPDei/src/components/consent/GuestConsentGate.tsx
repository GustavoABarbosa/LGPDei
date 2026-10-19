"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { ConsentCheckbox } from "@/components/consent/ConsentCheckbox";
import { KnowledgeFreshnessNotice } from "@/components/consent/KnowledgeFreshnessNotice";
import { SensitiveDataNotice } from "@/components/consent/SensitiveDataNotice";

type Props = {
  onAccept: () => Promise<void>;
};

export function GuestConsentGate({ onAccept }: Props) {
  const [consent, setConsent] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [starting, setStarting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!consent) return;

    setStarting(true);
    try {
      await onAccept();
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6"
      >
        <h2 className="text-lg font-semibold">Antes de começar</h2>
        <p className="text-sm text-muted">
          Sem conta, suas sessões ficam neste navegador e são apagadas
          automaticamente após 72 horas.{" "}
          <Link href="/auth" className="font-medium text-primary-600 hover:underline">
            Entre ou crie uma conta
          </Link>{" "}
          para mantê-las até você excluí-las.
        </p>
        <SensitiveDataNotice className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200" />
        <KnowledgeFreshnessNotice className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
        <ConsentCheckbox
          checked={consent}
          onChange={setConsent}
          error={attempted && !consent ? "É necessário aceitar para continuar" : undefined}
        />
        <button
          type="submit"
          disabled={starting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {starting && <Loader2 className="size-4 animate-spin" />}
          Começar
        </button>
      </form>
    </div>
  );
}
