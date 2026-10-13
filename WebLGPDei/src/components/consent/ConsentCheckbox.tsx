import Link from "next/link";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function ConsentCheckbox({ checked, onChange, error }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2 text-xs text-muted-800">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
        />
        <span>
          Declaro ter 18 anos ou mais e li e aceito os{" "}
          <ConsentLink href="/termos">Termos de uso</ConsentLink> e a{" "}
          <ConsentLink href="/privacidade">Política de privacidade</ConsentLink>,
          inclusive o envio das minhas mensagens e do texto dos documentos à
          Anthropic, nos Estados Unidos, para gerar as respostas (transferência
          internacional de dados).
        </span>
      </label>
      {error ? <span className="block text-xs text-red-400">{error}</span> : null}
    </div>
  );
}

function ConsentLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="font-medium text-primary-600 underline hover:text-primary"
    >
      {children}
    </Link>
  );
}
