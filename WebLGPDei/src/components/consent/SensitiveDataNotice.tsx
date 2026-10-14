import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Shows a one-line version on small screens. */
  compactOnMobile?: boolean;
};

export function SensitiveDataNotice({ className, compactOnMobile }: Props) {
  return (
    <p className={cn("text-xs text-muted", className)}>
      {compactOnMobile && (
        <span className="md:hidden">
          Não envie dados sensíveis nem dados de terceiros.
        </span>
      )}
      <span className={cn(compactOnMobile && "hidden md:inline")}>
        Não envie dados pessoais sensíveis (saúde, biometria, origem racial ou
        étnica, religião, opinião política, vida sexual etc.) nem dados pessoais
        de terceiros. Descreva seus processos de forma anonimizada.
      </span>
    </p>
  );
}
