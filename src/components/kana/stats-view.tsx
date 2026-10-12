"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Target, Flame, Repeat2, Zap, Trash2, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { KanaChar } from "@/lib/kana-data";
import { ProgressData, computeGlobalStats, DAY } from "@/lib/srs-engine";
import { resetAll } from "@/lib/progress-store";
import { MasteryDots } from "./mastery-badge";

interface StatsViewProps {
  pool: KanaChar[];
  progress: ProgressData;
}

const MASTERY_COLORS = {
  new: "oklch(0.7 0.01 80)",
  learning: "oklch(0.6 0.19 27)",
  familiar: "oklch(0.75 0.15 80)",
  mastered: "oklch(0.65 0.14 150)",
};

export function StatsView({ pool, progress }: StatsViewProps) {
  const stats = useMemo(() => computeGlobalStats(pool, progress), [pool, progress]);
  const [, setResetTick] = useState(0);

  // ── Activité des 14 derniers jours ────────────────────────────────────────
  const dailyData = useMemo(() => {
    const out: { day: string; label: string; tentatives: number; bonnes: number; precision: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * DAY);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const log = progress.daily[key];
      out.push({
        day: key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        tentatives: log?.attempts ?? 0,
        bonnes: log?.correct ?? 0,
        precision: log && log.attempts > 0 ? Math.round((log.correct / log.attempts) * 100) : 0,
      });
    }
    return out;
  }, [progress.daily]);

  const pieData = useMemo(() => {
    return [
      { name: "Nouveaux", value: stats.unseen, key: "new" as const },
      { name: "En apprentissage", value: stats.learning, key: "learning" as const },
      { name: "Familier", value: stats.familiar, key: "familiar" as const },
      { name: "Maîtrisés", value: stats.mastered, key: "mastered" as const },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // ── Détail par caractère (trié) ───────────────────────────────────────────
  const [sort, setSort] = useState<"weakness" | "attempts" | "mastery">("weakness");
  const charRows = useMemo(() => {
    const rows = pool
      .map((c) => {
        const s = progress.chars[c.id];
        return {
          char: c,
          attempts: s?.attempts ?? 0,
          correct: s?.correct ?? 0,
          accuracy: s && s.attempts > 0 ? s.correct / s.attempts : null,
          box: s?.box ?? 0,
          streak: s?.currentStreak ?? 0,
          best: s?.bestStreak ?? 0,
        };
      })
      .filter((r) => r.attempts > 0);

    rows.sort((a, b) => {
      if (sort === "weakness") {
        // Les plus faibles d'abord (précision asc, puis tentatives desc)
        return (a.accuracy ?? 2) - (b.accuracy ?? 2) || b.attempts - a.attempts;
      }
      if (sort === "attempts") return b.attempts - a.attempts;
      return a.box - b.box || (a.accuracy ?? 2) - (b.accuracy ?? 2);
    });
    return rows.slice(0, 40);
  }, [pool, progress, sort]);

  const hasData = stats.totalAttempts > 0;

  const handleReset = () => {
    resetAll();
    setResetTick((t) => t + 1);
    window.location.reload();
  };

  return (
    <div className="flex flex-col gap-6 pt-6">
      {/* ── Résumé ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={Target} label="Précision globale" value={`${Math.round(stats.accuracy * 100)} %`} accent />
        <SummaryCard icon={Repeat2} label="Réponses totales" value={`${stats.totalAttempts}`} />
        <SummaryCard icon={Zap} label="Sessions" value={`${stats.sessionsCount}`} />
        <SummaryCard icon={Flame} label="Série actuelle" value={`${stats.dayStreak} j`} accent />
      </section>

      {!hasData && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground flex flex-col items-center gap-3">
            <span className="font-kana text-4xl text-primary/60">空</span>
            <p className="text-sm">
              Aucune donnée pour l&apos;instant — faites une première session pour
              voir vos statistiques apparaître ici.
            </p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* ── Activité + maîtrise ───────────────────────────────────────── */}
          <div className="grid lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" />
                  Activité — 14 derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} barCategoryGap="22%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        width={28}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--popover-foreground)",
                        }}
                        formatter={(value: number, name: string) => [value, name === "tentatives" ? "Tentatives" : "Bonnes"]}
                      />
                      <Bar dataKey="tentatives" fill="var(--primary)" radius={[3, 3, 0, 0]} name="tentatives" />
                      <Bar dataKey="bonnes" fill="var(--chart-4)" radius={[3, 3, 0, 0]} name="bonnes" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Répartition de la maîtrise</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.key} fill={MASTERY_COLORS[entry.key]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "var(--popover-foreground)",
                        }}
                      />
                      <Legend
                        iconSize={8}
                        wrapperStyle={{ fontSize: "11px", color: "var(--muted-foreground)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 w-full">
                  <MasteryDots stats={stats} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Table détaillée ───────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Détail par caractère</CardTitle>
                <div className="flex gap-1.5">
                  {(
                    [
                      ["weakness", "Plus faibles"],
                      ["attempts", "Plus vus"],
                      ["mastery", "Moins maîtrisés"],
                    ] as const
                  ).map(([v, label]) => (
                    <Button
                      key={v}
                      size="sm"
                      variant={sort === v ? "secondary" : "ghost"}
                      className="h-7 text-xs"
                      onClick={() => setSort(v)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-16">Kana</TableHead>
                      <TableHead>Rōmaji</TableHead>
                      <TableHead className="text-right">Précision</TableHead>
                      <TableHead className="text-right">Vues</TableHead>
                      <TableHead className="text-right">Boîte</TableHead>
                      <TableHead className="text-right">Série</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {charRows.map((r) => (
                      <TableRow key={r.char.id}>
                        <TableCell className="font-kana text-xl py-1.5">{r.char.kana}</TableCell>
                        <TableCell className="font-mono text-xs">{r.char.romaji}</TableCell>
                        <TableCell className="text-right">
                          <AccuracyBadge accuracy={r.accuracy} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{r.attempts}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1">
                            <BoxLevel box={r.box} />
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{r.streak}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {charRows.length} caractère(s) vu(s) dans la sélection · boîte 0 = à retravailler, boîte 8 = maîtrise
                longue durée
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Zone de danger ────────────────────────────────────────────────── */}
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold">Réinitialiser la progression</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Efface tout l&apos;historique, les statistiques et les réglages (stockage local).
              Irréversible.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5 shrink-0">
                <Trash2 className="size-4" />
                Tout effacer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer toute la progression ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Vos {stats.totalAttempts} réponses, la série de {stats.dayStreak} jour(s) et
                  les niveaux de maîtrise seront définitivement supprimés. Cette action est
                  irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Effacer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <p className="text-xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AccuracyBadge({ accuracy }: { accuracy: number | null }) {
  if (accuracy === null) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round(accuracy * 100);
  const variant = pct >= 80 ? "success" : pct >= 60 ? "warning" : "destructive";
  void variant;
  const cls =
    pct >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-destructive";
  return <span className={`text-sm font-semibold tabular-nums ${cls}`}>{pct}%</span>;
}

function BoxLevel({ box }: { box: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Boîte ${box}/8`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={`size-1.5 rounded-[2px] ${i < box ? "bg-primary" : "bg-muted-foreground/20"}`}
        />
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground tabular-nums w-3">{box}</span>
    </span>
  );
}
