import Link from "next/link";

export function GuestSessionBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-100"
    >
      Sessões sem conta são apagadas automaticamente após 72 horas.{" "}
      <Link href="/auth" className="font-medium underline hover:text-white">
        Entre para mantê-las até você excluí-las
      </Link>
      .
    </div>
  );
}
