"use client";

import { ArrowRight, Wrench, Network, User } from "lucide-react";
import type { Integration } from "@/lib/types";

type IntegrationCardProps = {
  integration: Integration;
  fromLabel: string;
  toLabel: string;
  direction: "outgoing" | "incoming";
};

export function IntegrationCard({
  integration,
  fromLabel,
  toLabel,
  direction,
}: IntegrationCardProps) {
  const isOutgoing = direction === "outgoing";

  return (
    <div
      className={
        isOutgoing
          ? "rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs"
          : "rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs"
      }
    >
      <div
        className={`flex items-center gap-1.5 font-medium ${isOutgoing ? "text-sky-300" : ""}`}
      >
        <span className={isOutgoing ? "" : "text-muted-foreground"}>{fromLabel}</span>
        <ArrowRight className="size-3 text-muted-foreground" />
        <span>{toLabel}</span>
      </div>

      <p className={`mt-1 ${isOutgoing ? "text-orange-300/90" : "text-muted-foreground"}`}>
        {integration.label}
      </p>

      <p className="mt-1 text-muted-foreground">
        <span className="text-muted-foreground/60">Protocol:</span> {integration.protocol}
      </p>
      {integration.ports && (
        <p className="mt-0.5 font-medium text-amber-200/90">
          <span className="font-normal text-muted-foreground/60">Ports:</span>{" "}
          {integration.ports}
          {integration.direction ? ` · ${integration.direction}` : ""}
        </p>
      )}
      <p className="mt-0.5 text-muted-foreground">
        <span className="text-muted-foreground/60">Data:</span> {integration.dataFlow}
      </p>

      {integration.dataFormat && (
        <p className="mt-1 text-muted-foreground">
          <span className="text-muted-foreground/60">Format:</span> {integration.dataFormat}
        </p>
      )}

      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">
        {integration.description}
      </p>

      {integration.networkNote && (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-200/80">
          <Network className="mt-0.5 size-3 shrink-0" />
          {integration.networkNote}
        </p>
      )}

      {integration.whoSetsThisUp && (
        <p className="mt-1 flex items-start gap-1.5 text-[11px] text-violet-200/80">
          <User className="mt-0.5 size-3 shrink-0" />
          Set up by: {integration.whoSetsThisUp}
          {integration.estimatedEffort ? ` · ${integration.estimatedEffort}` : ""}
        </p>
      )}

      {integration.setupSteps && integration.setupSteps.length > 0 && (
        <div className="mt-2 rounded-md bg-black/20 p-2">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase">
            <Wrench className="size-3" />
            Setup steps
          </p>
          <ol className="list-decimal space-y-0.5 pl-4 text-[11px] text-muted-foreground/90">
            {integration.setupSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
