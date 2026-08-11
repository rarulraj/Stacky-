"use client";

import { Database } from "lucide-react";
import { HISTORIANS } from "@/lib/historians";
import { cn } from "@/lib/utils";

type HistorianPlanningProps = {
  onSelect: (idea: string, historianId: string) => void;
  className?: string;
  caption?: string;
};

export function HistorianPlanning({
  onSelect,
  className,
  caption,
}: HistorianPlanningProps) {
  return (
    <section className={cn("w-full", className)}>
      <div className="mb-3 flex items-center justify-center gap-2">
        <Database className="size-3.5 text-orange-400/80" />
        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Historian planning
        </p>
      </div>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        {caption ??
          "Pick a major historian to scaffold a deployable architecture — or describe your stack in natural language above."}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {HISTORIANS.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onSelect(h.idea, h.id)}
            className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-orange-500/35 hover:bg-orange-500/8"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">{h.name}</span>
              <span className="text-[10px] text-muted-foreground">{h.vendor}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {h.blurb}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
