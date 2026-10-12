// ─── Grammaire de mouvement ──────────────────────────────────────────────────
// Pondération : Jakub (polish production) principal, Emil pour les actions
// haute fréquence (réponses : rapide, jamais sur les raccourcis clavier),
// Jhey pour l'unique moment de délice (l'arrivée en terminus).
// GPU uniquement : transform, opacity, filter. Reduced-motion partout.

import type { Transition, Variants } from "framer-motion";

/** Ease-out forte — la courbe standard des arrivées (cookbook, Emil). */
export const EASE_OUT_STRONG = [0.16, 1, 0.3, 1] as const;

/** Réponse correcte : ressenti immédiat, décélération propre. */
export const SPRING_SNAP: Transition = {
  type: "spring",
  duration: 0.28,
  bounce: 0,
};

/** Arrivée en station : léger dépassement assumé, réservé à la fin de session. */
export const SPRING_ARRIVE: Transition = {
  type: "spring",
  duration: 0.55,
  bounce: 0.12,
};

/** Transition question → question (haute fréquence : rapide). */
export const QUESTION_ENTER: Transition = {
  duration: 0.22,
  ease: EASE_OUT_STRONG,
};

/** Sortie plus discrète que l'entrée (Jakub). */
export const QUESTION_EXIT: Transition = {
  duration: 0.14,
  ease: [0.4, 0, 1, 1] as const,
};

// ── Variantes partagées ──────────────────────────────────────────────────────

/** Entrée d'un panneau : opacité + translation + mise au point. */
export const panelEnter: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: EASE_OUT_STRONG },
  },
};

/** Conteneur en cascade (le seul usage de stagger : chargement de page). */
export const boardStagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

/** Élément de tableau de service (chiffres du home). */
export const figureEnter: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT_STRONG },
  },
};

/** Révélation du rōmaji sous le kana : le panneau se complète. */
export const revealEnter: Variants = {
  hidden: { opacity: 0, y: 4, filter: "blur(4px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.22, ease: EASE_OUT_STRONG },
  },
};
