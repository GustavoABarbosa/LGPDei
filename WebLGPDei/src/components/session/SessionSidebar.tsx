"use client";

import { SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Menu, Plus, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { SessionListItem } from "@/types";

type Props = {
  sessions: SessionListItem[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  createDisabled?: boolean;
  createDisabledMessage?: string | null;
  onOpenMobile?: () => void;
  className?: string;
};

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  createDisabled,
  createDisabledMessage,
  onOpenMobile,
  className,
}: Props) {
  const { user, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]",
        className,
      )}
    >
      <div className="flex justify-center items-center gap-2 border-b border-[var(--border)] p-4">
        <ShieldCheckIcon className="size-7 text-[var(--primary)]" />
        <h1 className="font-semibold">LGPDei</h1>
        {onOpenMobile && (
          <button type="button" className="md:hidden" onClick={onOpenMobile}>
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="p-3">
        {createDisabledMessage && (
          <p
            role="status"
            className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200"
          >
            {createDisabledMessage}
          </p>
        )}
        <button
          type="button"
          onClick={onCreate}
          disabled={createDisabled}
          className="neutral-button justify-center w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Nova sessão
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
              activeSessionId === session.id
                ? "bg-[var(--primary)]/50 text-[var(--primary-foreground)]"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-900",
            )}
          >
            <p className="truncate font-medium">{session.title}</p>
            <p className="truncate text-xs text-muted">
              {new Date(session.updatedAt).toLocaleString("pt-BR")}
            </p>
          </button>
        ))}
      </div>
      
      <div className="border-t border-[var(--border)] p-3">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-900">
              <UserCircleIcon size={20} className="shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <SignOutIcon size={16} />
              Sair
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium mb-2">
                Entre para salvar suas sessões
              </div>
              <div className="text-xs text-muted">
                Entre para salvar suas sessões e retornar sempre que quiser.
              </div>
            </div>
            <div className="flex">
              <Link
                href="/auth"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-center text-sm bg-neutral-800 hover:bg-neutral-700 transition-colors duration-200"
              >
                Entrar
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
