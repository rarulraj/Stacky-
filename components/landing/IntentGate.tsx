"use client";

import { Building2, DraftingCompass } from "lucide-react";
import type { ProjectIntent } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: {
  id: ProjectIntent;
  title: string;
  subtitle: string;
  points: string[];
  icon: typeof DraftingCompass;
}[] = [
  {
    id: "architecture",
    title: "Architectural diagram",
    subtitle: "Build a serious, editable network / system blueprint",
    points: [
      "Zones, DMZ, firewalls, and port labels",
      "Drag, connect, add/delete every node and edge",
      "Export PNG / SVG / JSON for engineering reviews",
    ],
    icon: DraftingCompass,
  },
  {
    id: "quote",
    title: "Commercial quote",
    subtitle: "Get product picks, vendors, and SI contacts ready to reach out",
    points: [
      "Definitive product picks per layer",
      "Vendor + integrator outreach contacts",
      "Cost ranges and deployment notes for procurement",
    ],
    icon: Building2,
  },
];

type IntentGateProps = {
  value: ProjectIntent | null;
  onChange: (intent: ProjectIntent) => void;
  className?: string;
};

export function IntentGate({ value, onChange, className }: IntentGateProps) {
  return (
    <section className={cn("w-full", className)}>
      <p className="mb-1 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
        First, what do you need?
      </p>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Stacky works for engineering diagrams and for commercial quotes. Pick
        one so we generate the right kind of blueprint.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition-colors",
                selected
                  ? "border-orange-500/50 bg-orange-500/12"
                  : "border-white/8 bg-white/[0.03] hover:border-orange-500/30 hover:bg-orange-500/8"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    selected ? "bg-orange-500/25 text-orange-300" : "bg-white/5 text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {opt.title}
                </span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                {opt.subtitle}
              </p>
              <ul className="space-y-1.5">
                {opt.points.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2 text-[11px] leading-snug text-muted-foreground/90"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange-400/70" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </section>
  );
}
