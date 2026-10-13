import { cn } from "@/lib/utils";

export function SensitiveDataNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted", className)}>
      Não envie dados pessoais sensíveis (saúde, biometria, origem racial ou
      étnica, religião, opinião política, vida sexual etc.) nem dados pessoais
      de terceiros. Descreva seus processos de forma anonimizada.
    </p>
  );
}
