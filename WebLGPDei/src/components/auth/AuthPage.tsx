"use client";

import { ShieldCheckIcon, SignInIcon, UserPlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage, useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("tab") === "register" ? "register" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register" && password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(name, email, password);
      }
      router.push("/");
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          mode === "login" ? "Credenciais inválidas" : "Não foi possível criar a conta",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheckIcon className="text-[var(--primary)]" size={28} weight="fill" />
          <div>
            <h1 className="text-lg font-semibold">LGPDei</h1>
            <p className="text-xs text-muted">Conformidade LGPD</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl p-1 bg-neutral-900">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === "login"
                ? "shadow-sm bg-neutral-800 text-white"
                : "text-muted",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === "register"
                ? "shadow-sm bg-neutral-800 text-white"
                : "text-muted",
            )}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} inline />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Nome</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>

          {mode === "register" && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Confirmar senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {mode === "login" ? (
              <>
                <SignInIcon size={18} />
                Entrar
              </>
            ) : (
              <>
                <UserPlusIcon size={18} />
                Criar conta
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-medium text-emerald-700 hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Entrar"}
          </button>
        </p>

        <Link
          href="/"
          className="mt-4 block text-center text-xs text-muted hover:underline"
        >
          Continuar sem conta
        </Link>
      </div>
    </div>
  );
}
