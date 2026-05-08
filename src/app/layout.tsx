import type { Metadata } from "next";
import { Newsreader, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site-url";

// Memo template typography (Sprint M2 visual upgrade).
// Newsreader: Adobe's contemporary serif designed for screen reading; the
// "memo" voice we want — confident headlines, comfortable body. Variable
// weight so we don't ship five separate weight files.
const memoSerif = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-memo-serif",
});

// Inter Tight: Inter's compressed display variant. Used for memo eyebrows,
// methodology lists, footnotes, and the soft-action label — the "metadata"
// voice. Tighter than regular Inter, more editorial.
const memoSans = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-memo-sans",
});

// JetBrains Mono: confidence badge brackets and inline numerical anchors.
// Variable would bring 12kb of weight axes for two glyph styles — the
// non-variable 500 weight is enough.
const memoMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["500"],
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
