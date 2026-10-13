"use client";

import { SignInIcon, UserPlusIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { ErrorBanner } from "@/components/ErrorBanner";
import { getApiErrorMessage, useAuth } from "@/hooks/useAuth";
import {
  type AuthField,
  hasAuthErrors,
  validateAuthForm,
} from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

const EMPTY_TOUCHED: Record<AuthField, boolean> = {
  name: false,
  email: false,
  password: false,
  confirmPassword: false,
};

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
  const [touched, setTouched] = useState(EMPTY_TOUCHED);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldErrors = useMemo(
    () =>
      validateAuthForm(mode, {
        name,
        email,
        password,
        confirmPassword,
      }),
    [mode, name, email, password, confirmPassword],
  );

  function showError(field: AuthField): string | undefined {
    if (!touched[field] && !submitAttempted) return undefined;
    return fieldErrors[field];
  }

  function markTouched(field: AuthField) {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setSubmitAttempted(false);
    setTouched(EMPTY_TOUCHED);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    if (hasAuthErrors(fieldErrors)) return;

    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(name.trim(), email.trim(), password);
      }
      router.push("/");
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          mode === "login"
            ? "Credenciais inválidas"
            : "Não foi possível criar a conta",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-center gap-2">
          <img
            src="/LGPDeiIcon.svg"
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0"
          />
          <h1 className="text-lg font-semibold">
            LGPD<span className="text-primary">ei</span>
          </h1>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-neutral-800">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-all",
              mode === "login"
                ? "rounded-lg shadow-sm bg-primary text-white"
                : "rounded-l-lg text-muted bg-neutral-800 cursor-pointer",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-all",
              mode === "register"
                ? "rounded-lg shadow-sm bg-primary text-white"
                : "rounded-r-lg text-muted bg-neutral-800 cursor-pointer",
            )}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === "register" && (
            <Field
              label="Nome"
              error={showError("name")}
              input={
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markTouched("name");
                  }}
                  onBlur={() => markTouched("name")}
                  autoComplete="name"
                  aria-invalid={Boolean(showError("name"))}
                  className={fieldClass(showError("name"))}
                />
              }
            />
          )}

          <Field
            label="E-mail"
            error={showError("email")}
            input={
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  markTouched("email");
                }}
                onBlur={() => markTouched("email")}
                autoComplete="email"
                aria-invalid={Boolean(showError("email"))}
                className={fieldClass(showError("email"))}
              />
            }
          />

          <Field
            label="Senha"
            error={showError("password")}
            hint={
              mode === "register"
                ? "Mín. 8 caracteres, com maiúscula, minúscula e símbolo"
                : undefined
            }
            input={
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  markTouched("password");
                  if (mode === "register" && confirmPassword) {
                    markTouched("confirmPassword");
                  }
                }}
                onBlur={() => markTouched("password")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={Boolean(showError("password"))}
                className={fieldClass(showError("password"))}
              />
            }
          />

          {mode === "register" && (
            <Field
              label="Confirmar senha"
              error={showError("confirmPassword")}
              input={
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    markTouched("confirmPassword");
                  }}
                  onBlur={() => markTouched("confirmPassword")}
                  autoComplete="new-password"
                  aria-invalid={Boolean(showError("confirmPassword"))}
                  className={fieldClass(showError("confirmPassword"))}
                />
              }
            />
          )}

          {error && <ErrorBanner message={error} inline />}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-60"
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
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="font-medium text-primary-600 hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Entrar"}
          </button>
        </p>

        <Link href="/" className="mt-4 block text-center text-xs text-muted hover:underline">
          Continuar sem conta
        </Link>
      </div>
    </div>
  );
}

function fieldClass(error?: string) {
  return cn(
    "w-full rounded-lg border bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2",
    error
      ? "border-red-400 focus:ring-red-400/30"
      : "border-[var(--border)] focus:ring-primary-500/30",
  );
}

function Field({
  label,
  error,
  hint,
  input,
}: {
  label: string;
  error?: string;
  hint?: string;
  input: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {input}
      {error ? (
        <span className="block text-xs text-red-400">{error}</span>
      ) : null}
      {hint ? (
        <span className="block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
