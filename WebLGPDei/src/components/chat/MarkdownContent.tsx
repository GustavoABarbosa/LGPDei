import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 text-lg font-semibold leading-snug first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-base font-semibold leading-snug first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-3 text-sm font-semibold leading-snug first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed last:mb-0 [&:not(:first-child)]:mt-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-4 border-[var(--border)]" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-[var(--info)] underline underline-offset-2 hover:opacity-80"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className="mb-3 border-l-2 border-[var(--border)] pl-3 text-muted last:mb-0"
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");

    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-[var(--background)] p-3 text-xs">
          {children}
        </code>
      );
    }

    return (
      <code className="rounded bg-[var(--background)] px-1 py-0.5 text-[0.85em]">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--border)] px-2 py-1 font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-[var(--border)] px-2 py-1">{children}</td>,
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto last:mb-0">{children}</pre>
  ),
};

type Props = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: Props) {
  return (
    <div className={cn("chat-markdown min-w-0 text-sm [overflow-wrap:anywhere]", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
