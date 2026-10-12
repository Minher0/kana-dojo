import type { Metadata, Viewport } from "next";
import { Barlow, Zen_Kaku_Gothic_New } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import "./globals.css";

/* Barlow : grotesque de signalisation (voies rapides californiennes) */
const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

/* Zen Kaku Gothic New : gothique japonais de signalétique urbaine */
const zen = Zen_Kaku_Gothic_New({
  variable: "--font-zen",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kana Dojo — Apprendre les hiragana et katakana",
  description:
    "Maîtrisez les hiragana et les katakana avec la répétition espacée : les caractères ratés reviennent plus souvent, les réussis s'espacent. Statistiques détaillées, séries quotidiennes et suivi de progression.",
  manifest: "/manifest.webmanifest",
  applicationName: "Kana Dojo",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kana Dojo",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    "hiragana", "katakana", "japonais", "kana", "répétition espacée",
    "SRS", "apprendre le japonais", "quiz", "mnémotechnie",
  ],
  authors: [{ name: "Kana Dojo" }],
  openGraph: {
    title: "Kana Dojo",
    description: "Hiragana & katakana avec répétition espacée adaptative",
    siteName: "Kana Dojo",
    type: "website",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f3" },
    { media: "(prefers-color-scheme: dark)", color: "#202325" },
  ],
};

/** Contrat de direction : survit au build de production (grep « KD-TRANSIT »). */
function DirectionContract() {
  return (
    <div
      hidden
      data-contract="KD-TRANSIT-2026"
      dangerouslySetInnerHTML={{
        __html: `<!--
THESIS: Kana Dojo devient un réseau ferroviaire : chaque syllabaire une ligne, chaque kana une station, chaque session un trajet. Refuse le défaut de catégorie (papier washi + serif + vermillon).
OWN-WORLD: panneaux d'émail blanc froid, bandes de ligne vert uguisu (H) et orange Chūō (K), pastilles de station, chiffres tabulaires Barlow, kana en Zen Kaku Gothic 900. Signaux vert/rouge réservés au feedback.
STORY: l'apprenant gère son réseau : il choisit ses lignes, embarque, franchit des stations ; les ratées restent « en interruption » et le train y revient. La progression se lit comme un plan de métro.
FIRST VIEWPORT: barre de guidage (pastille + KANA DOJO), tableau de service à 4 chiffres tabulaires, planificateur de trajet (lignes, sections, longueur, sens), CTA DÉPART en vert ligne.
FORM: signalétique ferroviaire japonaise, direction n°1 sur 7 dérivées (vs manga, arcade, genkō yōshi, budō, distributeurs, taiko).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`,
      }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${barlow.variable} ${zen.variable} antialiased bg-background text-foreground font-sans`}
      >
        <DirectionContract />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PwaProvider>
            {children}
          </PwaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
