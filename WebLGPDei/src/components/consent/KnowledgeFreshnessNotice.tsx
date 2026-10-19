"use client";

import { useEffect, useState } from "react";

import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compactOnMobile?: boolean;
};

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function formatPtDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return isoDate.slice(0, 10);
  return `${day} de ${MONTHS_PT[month - 1]} de ${year}`;
}

export function KnowledgeFreshnessNotice({ className, compactOnMobile }: Props) {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        if (!response.ok) return;
        const data = (await response.json()) as { knowledgeUpdatedAt?: string };
        if (!cancelled && data.knowledgeUpdatedAt) {
          setUpdatedAt(data.knowledgeUpdatedAt);
        }
      } catch {
        // Keep the notice hidden if health is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!updatedAt) return null;

  const stamped = formatPtDate(updatedAt);
  const full = `Base normativa atualizada até ${stamped}. Alterações posteriores a essa data podem não estar refletidas neste assistente.`;
  const compact = `Base atualizada até ${stamped}; mudanças posteriores podem não aparecer aqui.`;

  return (
    <p className={cn("text-xs text-muted", className)}>
      {compactOnMobile && <span className="md:hidden">{compact}</span>}
      <span className={cn(compactOnMobile && "hidden md:inline")}>{full}</span>
    </p>
  );
}
