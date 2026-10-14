import Link from "next/link";

export function GuestSessionBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-100 md:py-2 md:text-sm"
    >
      <span className="md:hidden">Sessões sem conta expiram em 72 horas. </span>
      <span className="hidden md:inline">Sessões sem conta são apagadas automaticamente após 72 horas. </span>
      <Link href="/auth" className="font-medium underline hover:text-white">
        <span className="md:hidden">Entrar</span>
        <span className="hidden md:inline">Entre para mantê-las até você excluí-las</span>
      </Link>
      <span className="hidden md:inline">.</span>
    </div>
  );
}
