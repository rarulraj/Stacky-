"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableField } from "./EditableField";
import { IntegrationCard } from "./IntegrationCard";
import { useStackyStore } from "@/lib/store";
import type { Integration } from "@/lib/types";

type IntegrationEditorProps = {
  integration: Integration;
  fromLabel: string;
  toLabel: string;
  direction: "outgoing" | "incoming";
};

export function IntegrationEditor({
  integration,
  fromLabel,
  toLabel,
  direction,
}: IntegrationEditorProps) {
  const updateIntegration = useStackyStore((s) => s.updateIntegration);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(integration);

  const save = () => {
    updateIntegration(integration.id, draft);
    updateActiveDeployment();
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="relative group">
        <IntegrationCard
          integration={integration}
          fromLabel={fromLabel}
          toLabel={toLabel}
          direction={direction}
        />
        <button
          type="button"
          onClick={() => {
            setDraft(integration);
            setEditing(true);
          }}
          className="absolute top-2 right-2 rounded-md bg-black/40 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-orange-300"
          title="Edit connection"
        >
          <Pencil className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-sky-300">
          Edit: {fromLabel} → {toLabel}
        </p>
        <button type="button" onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
      <EditableField label="Label" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
      <EditableField label="Ports" value={draft.ports ?? ""} onChange={(v) => setDraft({ ...draft, ports: v })} />
      <EditableField label="Protocol" value={draft.protocol} onChange={(v) => setDraft({ ...draft, protocol: v })} />
      <div className="space-y-1">
        <label className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Direction
        </label>
        <select
          value={draft.direction ?? "bidirectional"}
          onChange={(e) =>
            setDraft({
              ...draft,
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
      <EditableField label="Data flow" value={draft.dataFlow} onChange={(v) => setDraft({ ...draft, dataFlow: v })} multiline />
      <EditableField label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} multiline />
      <EditableField label="Data format" value={draft.dataFormat ?? ""} onChange={(v) => setDraft({ ...draft, dataFormat: v })} />
      <EditableField label="Network" value={draft.networkNote ?? ""} onChange={(v) => setDraft({ ...draft, networkNote: v })} multiline />
      <EditableField label="Who sets this up" value={draft.whoSetsThisUp ?? ""} onChange={(v) => setDraft({ ...draft, whoSetsThisUp: v })} />
      <EditableField label="Effort" value={draft.estimatedEffort ?? ""} onChange={(v) => setDraft({ ...draft, estimatedEffort: v })} />
      <EditableField
        label="Setup steps (one per line)"
        value={(draft.setupSteps ?? []).join("\n")}
        onChange={(v) =>
          setDraft({
            ...draft,
            setupSteps: v.split("\n").map((s) => s.trim()).filter(Boolean),
          })
        }
        multiline
      />
      <Button size="sm" className="w-full bg-sky-600 hover:bg-sky-500" onClick={save}>
        <Save className="size-3.5" />
        Save connection
      </Button>
    </div>
  );
}
