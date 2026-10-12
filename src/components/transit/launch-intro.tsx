"use client";

// ─── Séquence de démarrage : la mise en service de la gare ───────────────────
// Premier rendu SSR : le décor est peint AVANT l'hydratation, là où l'OS
// laisse un splash figé, le logo prend vie dès le premier pixel. La timeline
// est 100 % CSS (logo-ressort, enseigne, LED, portes de quai qui ferment puis
// ouvrent sur l'app) et non bloquante : pointer-events none, l'app reste
// interactive immédiatement. React range le décor une fois la pièce jouée.
//
// Timeline (1,84 s) : 0–0,88 s la scène s'installe · 0,88–1,30 s les portes
// de quai se ferment (la rame arrive) · 1,30–1,84 s elles s'ouvrent sur
// l'application. Reduced-motion : les keyframes retombent sur l'état final,
// le décor est déjà invisible.

import { useEffect, useState } from "react";

export function LaunchIntro() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // La timeline CSS dure 1,84 s ; on démonte juste après (nettoyage DOM,
    // l'overlay est déjà invisible dès 1,84 s par les keyframes elles-mêmes).
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setDone(true), reduced ? 350 : 2200);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className="launch" aria-hidden>
      {/* Fond émail : raccord continu avec le splash de l'OS (manifest) */}
      <div className="launch-bg" />

      {/* La scène : logo, enseigne, bandeau LED */}
      <div className="launch-stage">
        <div className="launch-logo-wrap">
          <span className="launch-ring" />
          <img
            src="/logo.png"
            alt=""
            width={112}
            height={112}
            draggable={false}
            className="launch-logo"
          />
        </div>
        <span className="launch-word">KANA DOJO</span>
        <span className="launch-sub">ひらがな · カタカナ</span>
        <div className="launch-led">
          <span className="launch-led-dot kd-blink" />
          <span className="launch-led-text">開業 · SERVICE OUVERT</span>
          <span className="launch-led-dot kd-blink" />
        </div>
      </div>

      {/* Les portes de quai : elles ferment la scène, puis ouvrent sur l'app */}
      <div className="launch-door launch-door-left">
        <span className="quai-handle" />
      </div>
      <div className="launch-door launch-door-right">
        <span className="quai-handle" />
      </div>
    </div>
  );
}
