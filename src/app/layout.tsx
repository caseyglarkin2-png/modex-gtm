import type { Metadata } from "next";
import { Fraunces, Mona_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site-url";

// Memo template typography (Sprint M8 redesign — "Private Memorandum").
// Fraunces: variable serif with optical-size (9-144), SOFT, and WONK axes.
// Used for everything serif: H1 at opsz 130, H2 at opsz 60, body at opsz 14.
// Drop caps lift opsz to 144 with WONK enabled for the genuinely
// publication-grade look.
const memoSerif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-memo-serif",
});

// Mona Sans: GitHub's variable sans with a width axis. Used for metadata,
// eyebrow labels, contents rail — the "operator memo, not magazine" voice.
// The wdth axis lets us tighten composition-table dt labels without
// shipping a second face.
const memoSans = Mona_Sans({
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
  variable: "--font-memo-sans",
});

// JetBrains Mono: confidence pips, footnote brackets, document numbers,
// classification chrome. The technical scaffolding around the prose.
const memoMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-memo-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "YardFlow by FreightRoll — RevOps OS",
    template: "%s — YardFlow by FreightRoll RevOps OS",
  },
  description: "YardFlow by FreightRoll RevOps OS",
  openGraph: {
    title: "YardFlow by FreightRoll — RevOps OS",
    description: "YardFlow by FreightRoll RevOps OS",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "YardFlow proposal-grade microsites for operator outreach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YardFlow by FreightRoll — RevOps OS",
    description: "YardFlow by FreightRoll RevOps OS",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${memoSerif.variable} ${memoSans.variable} ${memoMono.variable}`}
    >
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
