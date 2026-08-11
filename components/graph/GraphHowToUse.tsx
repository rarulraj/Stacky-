"use client";

import { useState } from "react";
import { CircleHelp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDepthAccent, getNodeAccent } from "@/lib/layout-graph";
import { useStackyStore } from "@/lib/store";
import type { NodeKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getVisibleNodes } from "@/lib/layout-graph";

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

export function GraphHowToUse() {
  const [open, setOpen] = useState(false);
  const nodes = useStackyStore((s) => s.nodes);
  const intent = useStackyStore((s) => s.context.intent);
  const isArchitecture = intent === "architecture";
  const visibleCount = getVisibleNodes(nodes).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <CircleHelp className="size-3.5" />
        <span className="hidden sm:inline">How to use</span>
        <ChevronDown
          className={cn("size-3 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[#1c1917]/98 p-3 shadow-xl backdrop-blur-xl">
            <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Canvas tips
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Showing {visibleCount} of {nodes.length} nodes
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-foreground/90">
              <li>Drag nodes to rearrange</li>
              <li>
                {isArchitecture
                  ? "Drag a handle → another handle to connect"
                  : "Use the edit bar to add / delete components"}
              </li>
              {isArchitecture && <li>Click a blue edge to set ports</li>}
              <li>Click a node, then pencil to edit details</li>
              <li>Download exports PNG / SVG / JSON from the toolbar</li>
              <li>Escape closes the side panel</li>
            </ul>

            <p className="mt-3 border-t border-white/8 pt-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {isArchitecture ? "Element colors" : "Layer colors"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(isArchitecture ? KINDS : LAYERS).map((item) => {
                if ("kind" in item) {
                  return (
                    <div key={item.kind} className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-2 shrink-0 rounded-full",
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
                      <span className="text-[11px] text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  );
                }
                return (
                  <div key={item.depth} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        getDepthAccent(item.depth)
                      )}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/70">
              {isArchitecture
                ? "Dashed blue edges = data paths"
                : "Solid orange = hierarchy · Dashed blue = data links"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
