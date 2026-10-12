"use client";

import { GlobalStats, MASTERY_META, MasteryLevel } from "@/lib/srs-engine";

const ORDER: MasteryLevel[] = ["new", "learning", "familiar", "mastered"];

const DOT_CLASSES: Record<MasteryLevel, string> = {
  new: "bg-muted-foreground/25",
  learning: "bg-destructive/80",
  familiar: "bg-amber-500",
  mastered: "bg-emerald-600",
};

export function MasteryDots({ stats }: { stats: GlobalStats }) {
  const counts: Record<MasteryLevel, number> = {
    new: stats.unseen,
    learning: stats.learning,
    familiar: stats.familiar,
    mastered: stats.mastered,
  };

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {ORDER.map((level) => (
        <div key={level} className="flex items-center gap-2">
          <span className={`inline-block size-2.5 rounded-full ${DOT_CLASSES[level]}`} aria-hidden />
          <span className="text-xs text-muted-foreground">
            {MASTERY_META[level].label}
          </span>
          <span className="text-xs font-semibold tabular-nums">{counts[level]}</span>
        </div>
      ))}
    </div>
  );
}
