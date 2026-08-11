"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableField } from "./EditableField";
import { useStackyStore } from "@/lib/store";
import type { Integration } from "@/lib/types";

export function EdgeEditPopover() {
  const selectedEdgeId = useStackyStore((s) => s.selectedEdgeId);
  const integrations = useStackyStore((s) => s.integrations);
  const nodes = useStackyStore((s) => s.nodes);
  const updateIntegration = useStackyStore((s) => s.updateIntegration);
  const deleteIntegration = useStackyStore((s) => s.deleteIntegration);
  const selectEdge = useStackyStore((s) => s.selectEdge);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);

  const edge = selectedEdgeId
    ? integrations.find((i) => i.id === selectedEdgeId) ?? null
    : null;

  if (!edge) return null;

  const from = nodes.find((n) => n.id === edge.fromNodeId)?.label ?? edge.fromNodeId;
  const to = nodes.find((n) => n.id === edge.toNodeId)?.label ?? edge.toNodeId;

  const patch = (partial: Partial<Integration>) => {
    updateIntegration(edge.id, partial);
    updateActiveDeployment();
  };

  return (
    <div className="absolute bottom-20 left-1/2 z-20 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-sky-500/30 bg-[#1c1917]/95 p-4 shadow-xl backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-sky-300">Edit connection</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {from} → {to}
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-red-300/90 hover:text-red-200"
            onClick={() => {
              if (!confirm("Delete this connection?")) return;
              deleteIntegration(edge.id);
              updateActiveDeployment();
            }}
            title="Delete connection"
          >
            <Trash2 className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => selectEdge(null)}>
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <EditableField
          label="Label"
          value={edge.label}
          onChange={(v) => patch({ label: v })}
        />
        <EditableField
          label="Ports"
          value={edge.ports ?? ""}
          onChange={(v) => patch({ ports: v })}
        />
        <EditableField
          label="Protocol"
          value={edge.protocol}
          onChange={(v) => patch({ protocol: v })}
        />
        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Direction
          </label>
          <select
            value={edge.direction ?? "bidirectional"}
            onChange={(e) =>
              patch({
                direction: e.target.value as Integration["direction"],
              })
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs outline-none focus:border-orange-500/40"
          >
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
            <option value="bidirectional">Bidirectional</option>
          </select>
        </div>
      </div>
      <div className="mt-2">
        <EditableField
          label="Network / firewall note"
          value={edge.networkNote ?? ""}
          onChange={(v) => patch({ networkNote: v })}
          multiline
        />
      </div>
    </div>
  );
}
