import type { Metadata } from "next";

import { AuthProvider } from "@/hooks/useAuth";

import "./globals.css";

export const metadata: Metadata = {
  title: "LGPDei — Conformidade LGPD",
  description:
    "Assistente educativo para identificar gaps de conformidade com a LGPD em qualquer contexto de trabalho.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
