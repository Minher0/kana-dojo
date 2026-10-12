"use client";

// ─── UI d'installation : compact (en-tête) et carte (gare) ────────────────────
// Le bouton n'existe que tant que l'app n'est pas installée — c'est le
// contrat demandé. Installé : plus rien, la gare est déjà chez vous.

import { motion } from "framer-motion";
import { DeviceMobile, DownloadSimple, WifiSlash } from "@phosphor-icons/react";
import { usePwa } from "./pwa-provider";
import { sfx } from "@/lib/sfx";

/** Bouton compact d'en-tête : une pastille « INSTALLER » à la couleur de ligne. */
export function InstallChip() {
  const { canInstall, isIOS, installed, promptInstall } = usePwa();
  if (installed || (!canInstall && !isIOS)) return null;

  return (
    <motion.button
      type="button"
      onClick={() => {
        sfx.tap();
        promptInstall();
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 24 }}
      aria-label="Installer l'application Kana Dojo"
      className="flex h-9 items-center gap-1.5 rounded-lg border-2 border-line-h/70 bg-line-h-soft px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-line-h transition-colors hover:border-line-h hover:bg-line-h hover:text-line-h-foreground active:scale-[0.96]"
    >
      <DownloadSimple size={15} weight="bold" aria-hidden />
      <span className="hidden sm:inline">Installer</span>
    </motion.button>
  );
}

/** Carte d'installation de la gare : le téléphone, la promesse, l'acte. */
export function InstallCard() {
  const { canInstall, isIOS, installed, promptInstall } = usePwa();
  if (installed || (!canInstall && !isIOS)) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
      aria-label="Installer l'application"
      className="sign-panel relative overflow-hidden"
    >
      <div className="flex flex-col items-center gap-6 px-6 py-6 sm:flex-row sm:gap-8">
        {/* Maquette : l'écran d'accueil de la rame */}
        <div className="phone-mockup relative shrink-0" aria-hidden>
          <div className="phone-screen">
            <div className="flex h-full flex-col items-center justify-center gap-2.5">
              <span className="flex size-11 items-center justify-center rounded-full bg-line-h">
                <span className="font-kana text-2xl font-black leading-none text-line-h-foreground">あ</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-foreground">
                KANA DOJO
              </span>
              <span className="flex items-center gap-[3px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full ${i < 3 ? "bg-line-h" : "bg-border"}`}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Promesse + acte */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold tracking-tight">
              Kana Dojo dans votre poche
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Installez l&apos;application : icône sur l&apos;écran d&apos;accueil,
              plein écran, et elle roule{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                <WifiSlash size={13} weight="bold" className="inline" aria-hidden />
                même hors connexion
              </span>
              . Votre progression reste sur l&apos;appareil.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.tap();
              promptInstall();
            }}
            className="flex h-11 items-center justify-center gap-2.5 rounded-lg bg-line-h px-6 text-sm font-extrabold uppercase tracking-[0.1em] text-line-h-foreground shadow-sign transition-[filter] duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <DeviceMobile size={18} weight="fill" aria-hidden />
            {isIOS && !canInstall ? "Comment installer" : "Installer l'application"}
          </button>
          {isIOS && !canInstall && (
            <p className="text-[11px] text-muted-foreground">
              Sur iPhone : bouton Partager{" "}
              <span aria-hidden>→</span> « Sur l&apos;écran d&apos;accueil ».
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
