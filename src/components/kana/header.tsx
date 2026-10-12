"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, BookOpen, BarChart3, Swords, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { View } from "@/app/page";

interface HeaderProps {
  view: View;
  setView: (v: View) => void;
  activeSession: boolean;
}

const NAV: { view: View; label: string; icon: typeof Home }[] = [
  { view: "home", label: "Accueil", icon: Home },
  { view: "stats", label: "Stats", icon: BarChart3 },
  { view: "tables", label: "Tables", icon: BookOpen },
];

export function Header({ view, setView, activeSession }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const go = (v: View) => {
    // Pendant une session, on protège contre les clics accidentels
    if (activeSession && v !== "quiz") return;
    setView(v);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <button
          onClick={() => go("home")}
          className="flex items-center gap-2 group select-none"
          aria-label="Kana Dojo — retour à l'accueil"
        >
          <span className="font-kana text-2xl leading-none text-primary transition-transform group-hover:-rotate-6">
            仮
          </span>
          <span className="font-bold tracking-tight text-lg">
            Kana<span className="text-primary">Dojo</span>
          </span>
        </button>

        <nav className="flex items-center gap-1" aria-label="Navigation principale">
          {NAV.map(({ view: v, label, icon: Icon }) => {
            const active = view === v || (v === "home" && view === "quiz");
            return (
              <Button
                key={v}
                variant={active ? "secondary" : "ghost"}
                size="sm"
                onClick={() => go(v)}
                className="gap-1.5 h-9"
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            );
          })}

          {view === "quiz" && (
            <span className="hidden md:flex items-center gap-1.5 ml-1 text-xs text-muted-foreground">
              <Swords className="size-3.5 text-primary" />
              Session en cours
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Basculer le thème clair/sombre"
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
