import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updatedAt, children }: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-relaxed md:p-10">
        <header className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
            <Image src="/LGPDeiIcon.svg" alt="" width={24} height={24} />
            <span>
              LGPD<span className="text-primary">ei</span>
            </span>
          </Link>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-xs text-muted">Última atualização: {updatedAt}</p>
        </header>
        {children}
        <footer className="border-t border-[var(--border)] pt-4 text-xs text-muted">
          <Link href="/privacidade" className="hover:underline">
            Política de privacidade
          </Link>
          {" · "}
          <Link href="/termos" className="hover:underline">
            Termos de uso
          </Link>
          {" · "}
          <Link href="/" className="hover:underline">
            Voltar ao LGPDei
          </Link>
        </footer>
      </article>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
