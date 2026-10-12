import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kana Dojo — Apprendre les hiragana et katakana",
  description:
    "Maîtrisez les hiragana et les katakana avec la répétition espacée : les caractères ratés reviennent plus souvent, les réussis s'espacent. Statistiques détaillées, séries quotidiennes et suivi de progression.",
  keywords: [
    "hiragana", "katakana", "japonais", "kana", "répétition espacée",
    "SRS", "apprendre le japonais", "quiz", "mnémotechnie",
  ],
  authors: [{ name: "Kana Dojo" }],
  applicationName: "Kana Dojo",
  openGraph: {
    title: "Kana Dojo",
    description: "Hiragana & katakana avec répétition espacée adaptative",
    siteName: "Kana Dojo",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#2c2a26" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
