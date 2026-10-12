"use client";

// ─── PWA : installation sur l'écran d'accueil ────────────────────────────────
// Un seul contrat : le bouton d'installation reste visible tant que
// l'application n'est pas installée. Android/Chromium → invite native
// (beforeinstallprompt). iOS/Safari → feuille d'instructions « Sur
// l'écran d'accueil ». Installé (display-mode standalone) → tout disparaît.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowSquareOut,
  Check,
  Plus,
  X,
} from "@phosphor-icons/react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextValue {
  canInstall: boolean;
  installed: boolean;
  isIOS: boolean;
  promptInstall: () => void;
}

const PwaContext = createContext<PwaContextValue>({
  canInstall: false,
  installed: false,
  isIOS: false,
  promptInstall: () => {},
});

export function usePwa(): PwaContextValue {
  return useContext(PwaContext);
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se présente comme macOS avec tactile
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

// ── Store externe « plateforme iOS » : déterministe, abonnement vide ──
let iosCache: boolean | null = null;
function iosSnapshot(): boolean {
  if (iosCache === null) iosCache = detectIOS();
  return iosCache;
}
function subscribePlatform(): () => void {
  return () => {};
}

// ── Store externe « mode standalone » (l'app est installée) ──
function standaloneSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}
function subscribeStandalone(cb: () => void): () => void {
  const q = window.matchMedia("(display-mode: standalone)");
  const onChange = () => cb();
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  // Stockage externe : snapshot serveur pendant l'hydratation, puis
  // resynchronisation client propre (aucune erreur d'hydratation).
  const standalone = useSyncExternalStore(subscribeStandalone, standaloneSnapshot, () => false);
  const isIOS = useSyncExternalStore(subscribePlatform, iosSnapshot, () => false);
  const [installedOverride, setInstalledOverride] = useState(false);
  const installed = installedOverride || standalone;
  const [sheetOpen, setSheetOpen] = useState(false);
  const reloadedRef = useRef(false);

  // ── beforeinstallprompt : l'invite arrive, on la garde sous le coude ──
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      setDeferred(ev);
      setCanInstall(true);
    };
    const onInstalled = () => {
      setInstalledOverride(true);
      setCanInstall(false);
      setDeferred(null);
      setSheetOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // ── Service worker : hors développement, avec mise à jour propre ──
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Une nouvelle version attend : elle prend la main, la page se recharge
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              worker.postMessage("SKIP_WAITING");
            }
          });
        });
      } catch {
        /* pas de SW : l'app fonctionne en ligne, c'est tout */
      }
    };
    void register();

    const onController = () => {
      if (reloadedRef.current) return;
      reloadedRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", onController);
  }, []);

  const promptInstall = useCallback(() => {
    if (installed) return;
    if (deferred) {
      void deferred.prompt();
      void deferred.userChoice.then(() => setDeferred(null));
      return;
    }
    if (isIOS) setSheetOpen(true);
  }, [installed, deferred, isIOS]);

  const value = useMemo(
    () => ({ canInstall: canInstall && !installed, installed, isIOS, promptInstall }),
    [canInstall, installed, isIOS, promptInstall]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      <IosInstallSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </PwaContext.Provider>
  );
}

// ─── Feuille d'instructions iOS (Safari n'a pas d'invite native) ─────────────

function IosInstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps: Array<{ icon: typeof Plus; title: string; body: string }> = [
    {
      icon: ArrowSquareOut,
      title: "Ouvrez le menu de partage",
      body: "Appuyez sur le bouton Partager de Safari (le carré avec la flèche), en bas de l'écran.",
    },
    {
      icon: Plus,
      title: "« Sur l'écran d'accueil »",
      body: "Faites défiler la liste puis choisissez « Sur l'écran d'accueil » (Add to Home Screen).",
    },
    {
      icon: Check,
      title: "Appuyez sur « Ajouter »",
      body: "Kana Dojo rejoint votre écran d'accueil, avec son icône. Elle fonctionne hors connexion.",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Fermer les instructions"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Installer Kana Dojo sur iPhone"
            initial={{ y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="sign-panel relative mx-3 mb-3 w-full max-w-md overflow-hidden"
            style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
          >
            <div className="line-band flex items-center justify-between bg-line-h px-5 py-3 text-line-h-foreground">
              <span className="text-sm font-extrabold uppercase tracking-[0.1em]">
                Sur votre écran d'accueil
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex size-7 items-center justify-center rounded-md bg-black/20 transition-colors hover:bg-black/30 active:scale-95"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-5 py-5">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-line-h-soft text-line-h">
                    <s.icon size={18} weight="bold" aria-hidden />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold">{s.title}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {s.body}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
