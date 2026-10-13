"use client";

import {
  DownloadSimpleIcon,
  PencilSimpleIcon,
  SignOutIcon,
  TrashIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { ProfileDialog } from "@/components/account/ProfileDialog";
import { getApiErrorMessage, type AuthUser, useAuth } from "@/hooks/useAuth";
import { downloadAccountData } from "@/lib/account";
import { cn } from "@/lib/utils";

type Props = {
  user: AuthUser;
  onError: (message: string) => void;
};

const menuItemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800/25";

export function UserMenu({ user, onError }: Props) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function runAction(action: () => void) {
    setOpen(false);
    action();
  }

  async function handleDownload() {
    try {
      await downloadAccountData();
    } catch (err) {
      onError(getApiErrorMessage(err, "Falha ao baixar seus dados"));
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-left transition-colors hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800"
      >
        <UserCircleIcon size={20} className="shrink-0 text-muted" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <ChevronUp
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(() => setProfileOpen(true))}
            className={menuItemClass}
          >
            <PencilSimpleIcon size={16} />
            Editar perfil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(() => void handleDownload())}
            className={menuItemClass}
          >
            <DownloadSimpleIcon size={16} />
            Baixar meus dados
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(() => setDeleteOpen(true))}
            className={cn(menuItemClass, "text-danger")}
          >
            <TrashIcon size={16} />
            Excluir conta
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(() => void signOut())}
            className={menuItemClass}
          >
            <SignOutIcon size={16} />
            Sair
          </button>
        </div>
      )}

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
