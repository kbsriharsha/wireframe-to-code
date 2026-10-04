import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wireframe Studio",
  description: "Sketch interfaces and turn wireframes into design-system-inspired prototypes with Gemini.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
