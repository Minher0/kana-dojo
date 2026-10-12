"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HIRAGANA_BASE, HIRAGANA_DAKUTEN, HIRAGANA_YOON,
  KATAKANA_BASE, KATAKANA_DAKUTEN, KATAKANA_YOON,
  KanaChar, KanaGroup, GROUP_LABELS,
} from "@/lib/kana-data";
import { ProgressData, masteryOf, MasteryLevel } from "@/lib/srs-engine";

const MASTERY_CELL: Record<MasteryLevel, string> = {
  new: "bg-transparent",
  learning: "bg-destructive/8 border-destructive/25",
  familiar: "bg-amber-500/10 border-amber-500/30",
  mastered: "bg-emerald-600/10 border-emerald-600/35",
};

const MASTERY_DOT: Record<MasteryLevel, string> = {
  new: "bg-muted-foreground/25",
  learning: "bg-destructive/80",
  familiar: "bg-amber-500",
  mastered: "bg-emerald-600",
};

interface TablesViewProps {
  progress: ProgressData;
}

interface CellInfo {
  char: KanaChar;
  accuracy: number | null;
  attempts: number;
  box: number;
}

export function TablesView({ progress }: TablesViewProps) {
  const [script, setScript] = useState<"hiragana" | "katakana">("hiragana");

  const groups: { group: KanaGroup; chars: KanaChar[] }[] = useMemo(() => {
    if (script === "hiragana") {
      return [
        { group: "base", chars: HIRAGANA_BASE },
        { group: "dakuten", chars: HIRAGANA_DAKUTEN },
        { group: "yoon", chars: HIRAGANA_YOON },
      ];
    }
    return [
      { group: "base", chars: KATAKANA_BASE },
      { group: "dakuten", chars: KATAKANA_DAKUTEN },
      { group: "yoon", chars: KATAKANA_YOON },
    ];
  }, [script]);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tables de référence</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Le fond coloré indique votre maîtrise de chaque caractère.
          </p>
        </div>
        <Tabs value={script} onValueChange={(v) => setScript(v as typeof script)}>
          <TabsList>
            <TabsTrigger value="hiragana" className="gap-1.5">
              <span className="font-kana text-base leading-none">あ</span>
              Hiragana
            </TabsTrigger>
            <TabsTrigger value="katakana" className="gap-1.5">
              <span className="font-kana text-base leading-none">ア</span>
              Katakana
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {(["new", "learning", "familiar", "mastered"] as MasteryLevel[]).map((m) => (
          <span key={m} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${MASTERY_DOT[m]}`} aria-hidden />
            {m === "new" ? "Jamais vu" : m === "learning" ? "En apprentissage" : m === "familiar" ? "Familier" : "Maîtrisé"}
          </span>
        ))}
      </div>

      {groups.map(({ group, chars }, gi) => (
        <motion.div
          key={`${script}-${group}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.05, duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{GROUP_LABELS[group].long}</span>
                <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                  {chars.length} caractères
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
                {chars.map((c) => {
                  const state = progress.chars[c.id];
                  const mastery = masteryOf(state);
                  const cell: CellInfo = {
                    char: c,
                    accuracy: state && state.attempts > 0 ? state.correct / state.attempts : null,
                    attempts: state?.attempts ?? 0,
                    box: state?.box ?? 0,
                  };
                  return (
                    <TooltipProvider key={c.id} delayDuration={120}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex flex-col items-center justify-center rounded-lg border border-border/60 py-2.5 px-1 cursor-default transition-transform hover:scale-[1.06] ${MASTERY_CELL[mastery]}`}
                          >
                            <span className="font-kana text-xl sm:text-2xl leading-none">{c.kana}</span>
                            <span className="mt-1 font-mono text-[10px] lowercase text-muted-foreground">
                              {c.romaji}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-mono">
                            {c.kana} — {c.romaji}
                            {c.altRomaji?.length ? ` (${c.altRomaji.join(" / ")})` : ""}
                          </p>
                          <p className="text-muted-foreground">
                            {cell.attempts === 0
                              ? "Jamais interrogé"
                              : `Précision ${Math.round((cell.accuracy ?? 0) * 100)}% · ${cell.attempts} vues · boîte ${cell.box}/8`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
