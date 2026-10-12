"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Target, Flame, CheckCircle2, CalendarDays, Play, ChevronRight, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { KanaChar, GROUP_LABELS, KanaGroup } from "@/lib/kana-data";
import { ProgressData, computeGlobalStats } from "@/lib/srs-engine";
import { Settings } from "@/lib/progress-store";
import { MasteryDots } from "./mastery-badge";

interface DashboardProps {
  pool: KanaChar[];
  progress: ProgressData;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  onStart: () => void;
}

const SCRIPT_LABELS: Record<"hiragana" | "katakana", { name: string; kana: string }> = {
  hiragana: { name: "Hiragana", kana: "ひらがな" },
  katakana: { name: "Katakana", kana: "カタカナ" },
};

export function Dashboard({ pool, progress, settings, updateSettings, onStart }: DashboardProps) {
  const stats = useMemo(() => computeGlobalStats(pool, progress), [pool, progress]);

  const weakest = useMemo(() => {
    return pool
      .filter((c) => {
        const s = progress.chars[c.id];
        return s && s.attempts >= 2 && s.correct / s.attempts < 0.8;
      })
      .sort((a, b) => {
        const sa = progress.chars[a.id]!;
        const sb = progress.chars[b.id]!;
        return sa.correct / sa.attempts - sb.correct / sb.attempts;
      })
      .slice(0, 6);
  }, [pool, progress]);

  const poolEmpty = pool.length === 0;
  const percentMastered = pool.length > 0 ? Math.round((stats.mastered / pool.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* ── Héro ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 washi-texture bg-card">
        <div className="absolute inset-x-0 top-0 h-0.5 accent-bar" aria-hidden />
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">
              五十音図 · Gojūon
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Apprenez les kana par la répétition espacée
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md">
              Les caractères ratés reviennent plus souvent, les réussis s&apos;espacent
              dans le temps. Le dojo adapte chaque session à votre mémoire.
            </p>
          </div>
          <div className="flex items-center justify-center" aria-hidden>
            <motion.span
              className="font-kana text-7xl sm:text-8xl text-primary select-none"
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {stats.seenChars > 0 ? "習" : "学"}
            </motion.span>
          </div>
        </div>
      </section>

      {/* ── Stats du jour ────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Target}
          label="Précision globale"
          value={stats.totalAttempts > 0 ? `${Math.round(stats.accuracy * 100)} %` : "—"}
          sub={stats.totalAttempts > 0 ? `${stats.totalCorrect}/${stats.totalAttempts} réponses` : "Aucune réponse"}
        />
        <StatCard
          icon={Flame}
          label="Série de jours"
          value={stats.dayStreak > 0 ? `${stats.dayStreak} j` : "0 j"}
          sub={stats.dayStreak > 0 ? "Continuez comme ça !" : "Répondez pour démarrer"}
        />
        <StatCard
          icon={CheckCircle2}
          label="Maîtrisés"
          value={`${stats.mastered}`}
          sub={`${pool.length} caractères dans la sélection`}
        />
        <StatCard
          icon={CalendarDays}
          label="Aujourd&apos;hui"
          value={stats.todayAttempts > 0 ? `${Math.round(stats.todayAccuracy * 100)} %` : "—"}
          sub={stats.todayAttempts > 0 ? `${stats.todayAttempts} réponses aujourd'hui` : "Pas encore révisé"}
        />
      </section>

      {/* ── Réglage de session ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Composer la session
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Scripts */}
            <fieldset className="flex-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Syllabaire</Label>
              <ToggleGroup
                type="multiple"
                value={settings.scripts}
                onValueChange={(v) => {
                  const scripts = v.filter(Boolean) as Settings["scripts"];
                  if (scripts.length > 0) updateSettings({ scripts });
                }}
                className="mt-2 flex gap-2"
              >
                {(["hiragana", "katakana"] as const).map((s) => (
                  <ToggleGroupItem
                    key={s}
                    value={s}
                    variant="outline"
                    className="flex-col gap-0.5 h-auto py-2 px-4 data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                  >
                    <span className="font-kana text-lg leading-none">{SCRIPT_LABELS[s].kana}</span>
                    <span className="text-xs font-medium">{SCRIPT_LABELS[s].name}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>

            {/* Groupes */}
            <fieldset className="flex-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Groupes</Label>
              <ToggleGroup
                type="multiple"
                value={settings.groups}
                onValueChange={(v) => {
                  const groups = v.filter(Boolean) as Settings["groups"];
                  if (groups.length > 0) updateSettings({ groups });
                }}
                className="mt-2 flex flex-wrap gap-2"
              >
                {(["base", "dakuten", "yoon"] as const).map((g: KanaGroup) => (
                  <ToggleGroupItem
                    key={g}
                    value={g}
                    variant="outline"
                    className="h-8 px-3 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                  >
                    {GROUP_LABELS[g].short}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="mt-2 text-xs text-muted-foreground">
                {GROUP_LABELS[settings.groups.includes("base") ? settings.groups[0] : settings.groups[0] ?? "base"].hint}
                {" · "}
                {pool.length} caractères sélectionnés
              </p>
            </fieldset>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            {/* Taille */}
            <fieldset>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Questions</Label>
              <ToggleGroup
                type="single"
                value={String(settings.sessionSize)}
                onValueChange={(v) => v && updateSettings({ sessionSize: Number(v) })}
                className="mt-2 flex gap-2"
              >
                {[10, 20, 30].map((n) => (
                  <ToggleGroupItem
                    key={n}
                    value={String(n)}
                    variant="outline"
                    className="h-8 w-10 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                  >
                    {n}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>

            {/* Direction */}
            <fieldset className="flex-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Sens</Label>
              <ToggleGroup
                type="single"
                value={settings.direction}
                onValueChange={(v) => v && updateSettings({ direction: v as Settings["direction"] })}
                className="mt-2 flex flex-wrap gap-2"
              >
                {(
                  [
                    ["kana2romaji", "Kana → Rōmaji"],
                    ["romaji2kana", "Rōmaji → Kana"],
                    ["mixed", "Mixte"],
                  ] as const
                ).map(([v, label]) => (
                  <ToggleGroupItem
                    key={v}
                    value={v}
                    variant="outline"
                    className="h-8 px-3 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>

            {/* Mode */}
            <fieldset>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Réponse</Label>
              <ToggleGroup
                type="single"
                value={settings.mode}
                onValueChange={(v) => v && updateSettings({ mode: v as Settings["mode"] })}
                className="mt-2 flex gap-2"
              >
                {(
                  [
                    ["choice", "Choix multiples"],
                    ["typing", "Saisie clavier"],
                  ] as const
                ).map(([v, label]) => (
                  <ToggleGroupItem
                    key={v}
                    value={v}
                    variant="outline"
                    className="h-8 px-3 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>
          </div>

          {/* Lancement */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <Button
              size="lg"
              onClick={onStart}
              disabled={poolEmpty}
              className="h-12 flex-1 sm:flex-none sm:px-10 text-base gap-2"
            >
              <Play className="size-5" />
              Commencer la session
            </Button>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-primary" />
              {poolEmpty
                ? "Sélectionnez au moins un groupe de caractères"
                : `${settings.sessionSize} caractères · les ratés reviennent jusqu'à être réussis`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Progression de la sélection ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Progression de la sélection</span>
            <Badge variant="outline" className="text-primary border-primary/30">
              {percentMastered}% maîtrisés
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Progress value={percentMastered} className="h-2.5" />
          <MasteryDots stats={stats} />
          {weakest.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                À retravailler en priorité
              </p>
              <div className="flex flex-wrap gap-2">
                {weakest.map((c) => {
                  const s = progress.chars[c.id]!;
                  const acc = Math.round((s.correct / s.attempts) * 100);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-1.5"
                    >
                      <span className="font-kana text-xl">{c.kana}</span>
                      <span className="text-xs text-muted-foreground">{c.romaji}</span>
                      <span className="text-xs font-semibold text-destructive">{acc}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="py-0 gap-0">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
