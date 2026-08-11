"use client";

import { getDepthAccent, getNodeAccent } from "@/lib/layout-graph";
import { useStackyStore } from "@/lib/store";
import type { NodeKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const LAYERS = [
  { depth: 0, label: "System" },
  { depth: 1, label: "Zones / Domains" },
  { depth: 2, label: "Components" },
  { depth: 3, label: "Details" },
];

const KINDS: { kind: NodeKind; label: string }[] = [
  { kind: "zone", label: "Zone" },
  { kind: "component", label: "Component" },
  { kind: "firewall", label: "Firewall" },
  { kind: "network", label: "Network" },
  { kind: "datasource", label: "Data source" },
  { kind: "client", label: "Client" },
];

export function GraphLegend() {
  const intent = useStackyStore((s) => s.context.intent);
  const isArchitecture = intent === "architecture";

  return (
    <div className="absolute top-4 left-4 z-10 rounded-xl border border-white/8 bg-[#1c1917]/90 p-3 backdrop-blur-md">
      <p className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {isArchitecture ? "Architecture elements" : "Blueprint layers"}
      </p>
      <div className="space-y-1.5">
        {(isArchitecture ? KINDS : LAYERS).map((item) => {
          if ("kind" in item) {
            return (
              <div key={item.kind} className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    getNodeAccent({
                      id: "",
                      label: "",
                      parentId: null,
                      depth: 1,
                      collapsed: false,
                      expanded: false,
                      position: { x: 0, y: 0 },
                      kind: item.kind,
                      detail: {
                        overview: "",
                        purpose: "",
                        technologies: [],
                        tradeoffs: [],
                        risks: [],
                        costEstimate: { range: "", notes: "" },
                        standards: [],
                        bestPractices: [],
                        notes: "",
                        futureRecommendations: [],
                        vendors: [],
                      },
                    })
                  )}
                />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            );
          }
          return (
            <div key={item.depth} className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", getDepthAccent(item.depth))} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 border-t border-white/8 pt-2 text-[10px] text-muted-foreground/70">
        {isArchitecture
          ? "Blue edges = data paths · ports shown on labels · drag handles to connect"
          : "Solid orange = hierarchy · Dashed blue = data connections"}
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground/70">
        Drag to move · pencil to edit · Download for PNG/SVG/JSON
      </p>
    </div>
  );
}
