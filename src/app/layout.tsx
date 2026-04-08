import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Modex RevOps OS",
    template: "%s — Modex RevOps OS",
  },
  description: "YardFlow / FreightRoll MODEX 2026 RevOps Operating System",
  openGraph: {
    title: "Modex RevOps OS",
    description: "MODEX 2026 RevOps Operating System — YardFlow / FreightRoll",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "YardFlow proposal-grade microsites for MODEX 2026 outreach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modex RevOps OS",
    description: "MODEX 2026 RevOps Operating System — YardFlow / FreightRoll",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppShell>{children}</AppShell>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
