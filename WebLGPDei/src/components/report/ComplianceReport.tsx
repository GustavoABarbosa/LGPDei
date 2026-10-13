import { cn } from "@/lib/utils";
import type { AssessmentSnapshot, Finding } from "@/types";

const severityStyles: Record<Finding["severity"], string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

const riskStyles: Record<AssessmentSnapshot["overall_risk"], string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-primary-600 text-white",
};

type Props = {
  snapshot: AssessmentSnapshot;
  markdownFallback?: string;
};

export function ComplianceReport({ snapshot, markdownFallback }: Props) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">Análise LGPD</span>
        <span
          className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", riskStyles[snapshot.overall_risk])}
        >
          Risco: {snapshot.overall_risk}
        </span>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
          Score: {snapshot.compliance_score}/100
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed">{snapshot.summary}</p>

      {snapshot.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-primary-700">Pontos positivos</h4>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {snapshot.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {snapshot.findings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Achados</h4>
          {snapshot.findings.map((finding) => (
            <div
              key={`${finding.title}-${finding.legal_reference}`}
              className="rounded-lg border border-[var(--border)] p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-semibold uppercase",
                    severityStyles[finding.severity],
                  )}
                >
                  {finding.severity}
                </span>
                <span className="text-sm font-medium">{finding.title}</span>
              </div>
              <p className="mb-2 text-sm text-muted">{finding.description}</p>
              <p className="mb-1 text-xs">
                <strong>Base legal:</strong> {finding.legal_reference}
              </p>
              <p className="mb-1 text-xs">
                <strong>Evidência:</strong> {finding.evidence}
              </p>
              <p className="text-xs">
                <strong>Recomendação:</strong> {finding.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}

      {markdownFallback && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted">Ver resposta completa</summary>
          <pre className="mt-2 whitespace-pre-wrap text-xs">{markdownFallback}</pre>
        </details>
      )}

      <p className="mt-4 border-t border-[var(--border)] pt-3 text-xs italic text-muted">{snapshot.disclaimer}</p>
    </div>
  );
}
