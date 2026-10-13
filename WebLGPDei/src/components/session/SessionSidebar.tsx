"use client";

import { SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import {
  ChevronUp,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { SessionListItem, UserDocument } from "@/types";

type SidebarTab = "files" | "sessions";

type SessionMenuPosition = {
  top: number;
  left: number;
  openAbove: boolean;
};

type Props = {
  sessions: SessionListItem[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onRename: (id: string, title: string) => void | Promise<void>;
  createDisabled?: boolean;
  createDisabledMessage?: string | null;
  documents: UserDocument[];
  documentsLoading?: boolean;
  onLoadDocuments: () => void;
  onDeleteDocument: (docId: string, sessionId: string) => void | Promise<void>;
  onCloseMobile?: () => void;
  className?: string;
};

export function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  createDisabled,
  createDisabledMessage,
  documents,
  documentsLoading,
  onLoadDocuments,
  onDeleteDocument,
  onCloseMobile,
  className,
}: Props) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SidebarTab>("sessions");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<SessionMenuPosition | null>(
    null,
  );
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const sessionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!menuSessionId) return;

    function updateMenuPosition() {
      const trigger = sessionMenuTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const menuHeight = 88;
      const openAbove = rect.top >= menuHeight + 8;

      setMenuPosition({
        top: openAbove ? rect.top - 4 : rect.bottom + 4,
        left: rect.right,
        openAbove,
      });
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (sessionMenuRef.current?.contains(target)) return;
      if (sessionMenuTriggerRef.current?.contains(target)) return;
      setMenuSessionId(null);
      setMenuPosition(null);
    }

    updateMenuPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [menuSessionId]);

  useEffect(() => {
    if (activeTab === "files") {
      onLoadDocuments();
    }
  }, [activeTab, onLoadDocuments]);

  useEffect(() => {
    if (!renamingSessionId) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [renamingSessionId]);

  function toggleSessionMenu(
    sessionId: string,
    trigger: HTMLButtonElement,
  ) {
    if (menuSessionId === sessionId) {
      setMenuSessionId(null);
      setMenuPosition(null);
      sessionMenuTriggerRef.current = null;
      return;
    }

    sessionMenuTriggerRef.current = trigger;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = 88;
    const openAbove = rect.top >= menuHeight + 8;

    setMenuPosition({
      top: openAbove ? rect.top - 4 : rect.bottom + 4,
      left: rect.right,
      openAbove,
    });
    setMenuSessionId(sessionId);
  }

  async function handleDeleteDocument(docId: string, sessionId: string) {
    setDeletingDocId(docId);
    try {
      await onDeleteDocument(docId, sessionId);
    } finally {
      setDeletingDocId(null);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    setMenuSessionId(null);
    setMenuPosition(null);
    setDeletingSessionId(sessionId);
    try {
      await onDelete(sessionId);
    } finally {
      setDeletingSessionId(null);
    }
  }

  function startRename(session: SessionListItem) {
    setMenuSessionId(null);
    setMenuPosition(null);
    setRenamingSessionId(session.id);
    setRenameValue(session.title);
  }

  function cancelRename() {
    setRenamingSessionId(null);
    setRenameValue("");
    setRenaming(false);
  }

  async function commitRename() {
    if (!renamingSessionId || renaming) return;

    const title = renameValue.trim();
    if (!title) {
      cancelRename();
      return;
    }

    const session = sessions.find((item) => item.id === renamingSessionId);
    if (session && session.title === title) {
      cancelRename();
      return;
    }

    setRenaming(true);
    try {
      await onRename(renamingSessionId, title);
      cancelRename();
    } catch {
      setRenaming(false);
      renameInputRef.current?.focus();
    }
  }

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]", className)}>
      <div
        className={cn("flex items-center gap-2 border-b border-[var(--border)] p-4", !onCloseMobile && "justify-center")}

      >
        <img
          src="/LGPDeiIcon.svg"
          alt=""
          className="size-9 shrink-0"
        />
        <h1 className="flex-1 font-semibold">LGPD<span className="text-primary">ei</span></h1>
        {onCloseMobile && (
          <button
            type="button"
            className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden"
            onClick={onCloseMobile}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="border-b border-[var(--border)] p-2">
        <div
          role="tablist"
          aria-label="Navegação da barra lateral"
          className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-900"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "files"}
            onClick={() => setActiveTab("files")}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              activeTab === "files"
                ? "bg-[var(--card)] text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            Arquivos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sessions"}
            onClick={() => setActiveTab("sessions")}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              activeTab === "sessions"
                ? "bg-[var(--card)] text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            Sessões
          </button>
        </div>
      </div>

      {activeTab === "sessions" ? (
        <>
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
              className="neutral-button justify-center w-full disabled:cursor-not-allowed! disabled:hover:bg-neutral-900! disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Nova sessão
            </button>
          </div>

          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
            {Array.from({ length: 12 }, (_, index) => {
              const base = sessions[index % Math.max(sessions.length, 1)];
              const session: SessionListItem = base
                ? {
                    ...base,
                    id: `${base.id}__overflow-${index}`,
                    title: `${base.title} (${index + 1})`,
                  }
                : {
                    id: `overflow-placeholder-${index}`,
                    title: `Sessão de teste ${index + 1}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
              const realId = base?.id ?? session.id;
              const isActive = activeSessionId === realId;
              const isDeleting = deletingSessionId === realId;
              const isMenuOpen = menuSessionId === session.id;
              const isRenaming = renamingSessionId === realId;

              return (
                <div
                  key={session.id}
                  className={cn(
                    "group relative flex items-start gap-1 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary/50 text-[var(--primary-foreground)]"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                  )}
                >
                  {isRenaming ? (
                    <form
                      className="min-w-0 flex-1 px-2 py-1.5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void commitRename();
                      }}
                    >
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onBlur={() => void commitRename()}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            cancelRename();
                          }
                        }}
                        disabled={renaming}
                        maxLength={48}
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                        aria-label="Novo nome da sessão"
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => base && onSelect(realId)}
                      className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
                    >
                      <p className="truncate font-medium">{session.title}</p>
                      <p
                        className={cn(
                          "truncate text-xs",
                          isActive ? "text-white" : "text-muted",
                        )}
                      >
                        {new Date(session.updatedAt).toLocaleString("pt-BR")}
                      </p>
                    </button>
                  )}

                  <div className="relative mt-1.5 mr-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(event) =>
                        toggleSessionMenu(session.id, event.currentTarget)
                      }
                      disabled={isDeleting || isRenaming || !base}
                      className={cn(
                        "rounded-md p-1 disabled:opacity-50",
                        isActive
                          ? "text-white/80 hover:bg-white/15 hover:text-white"
                          : "text-muted hover:bg-neutral-200 hover:text-foreground dark:hover:bg-neutral-800",
                      )}
                      aria-label={`Opções de ${session.title}`}
                      aria-expanded={isMenuOpen}
                      aria-haspopup="menu"
                    >
                      {isDeleting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="size-4" />
                      )}
                    </button>

                    {portalReady &&
                      isMenuOpen &&
                      base &&
                      menuPosition &&
                      createPortal(
                        <div
                          ref={sessionMenuRef}
                          role="menu"
                          style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                          }}
                          className={cn(
                            "fixed z-[100] w-36 -translate-x-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg",
                            menuPosition.openAbove && "-translate-y-full",
                          )}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => startRename(base)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Pencil className="size-3.5" />
                            Renomear
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => void handleDeleteSession(realId)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Trash2 className="size-3.5" />
                            Excluir
                          </button>
                        </div>,
                        document.body,
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : documents.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted">
              Nenhum arquivo enviado
            </p>
          ) : (
            <ul className="space-y-1">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="group flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{document.fileName}</p>
                    <p className="truncate text-xs text-muted">{document.sessionTitle}</p>
                    <p className="text-xs text-muted">
                      {new Date(document.uploadedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteDocument(document.id, document.sessionId)}
                    disabled={deletingDocId === document.id}
                    className="shrink-0 rounded-md p-1 text-muted hover:bg-neutral-200 hover:text-danger dark:hover:bg-neutral-800 disabled:opacity-50"
                    aria-label={`Excluir ${document.fileName}`}
                  >
                    {deletingDocId === document.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="border-t border-[var(--border)] p-3">
        {user ? (
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
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
                  userMenuOpen ? "rotate-180" : "",
                )}
              />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    void signOut();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800/25"
                >
                  <SignOutIcon size={16} />
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium mb-2">Entre para salvar suas sessões</div>
              <div className="text-xs text-muted">Entre para salvar suas sessões e retornar sempre que quiser.</div>
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
