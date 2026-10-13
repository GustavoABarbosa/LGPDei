import type { Metadata } from "next";

import { AuthProvider } from "@/hooks/useAuth";

import "./globals.css";

export const metadata: Metadata = {
  title: "LGPDei — Conformidade LGPD",
  description:
    "Assistente educativo para identificar gaps de conformidade com a LGPD em qualquer contexto de trabalho.",
  icons: {
    icon: [
      { url: "/LGPDeiIcon.svg", type: "image/svg+xml" },
      { url: "/LGPDeiIcon.png", type: "image/png", sizes: "58x58" },
    ],
    apple: [{ url: "/LGPDeiIcon.png", type: "image/png" }],
    shortcut: ["/LGPDeiIcon.svg"],
  },
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
