import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import { MainContent } from "@/components/main-content";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { CommandSearch } from "@/components/command-search";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Modex RevOps OS",
  description: "YardFlow / FreightRoll MODEX 2026 RevOps Operating System",
  openGraph: {
    title: "Modex RevOps OS",
    description: "MODEX 2026 RevOps Operating System — YardFlow / FreightRoll",
    type: "website",
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
        <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider>
          <Sidebar />
          <CommandSearch />
          <MainContent>
            {children}
          </MainContent>
          <Toaster position="bottom-right" />
          <KeyboardShortcuts />
          </SidebarProvider>
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
