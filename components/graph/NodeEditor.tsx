"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableField } from "./EditableField";
import { useStackyStore } from "@/lib/store";
import type { NodeKind, StackyNode } from "@/lib/types";

const KIND_OPTIONS: NodeKind[] = [
  "system",
  "zone",
  "component",
  "firewall",
  "network",
  "client",
  "datasource",
];

type NodeEditorProps = {
  node: StackyNode;
  onSaved?: () => void;
};

export function NodeEditor({ node, onSaved }: NodeEditorProps) {
  const applyNodeUpdate = useStackyStore((s) => s.applyNodeUpdate);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);

  const [draft, setDraft] = useState(node);

  useEffect(() => {
    setDraft(node);
  }, [node]);

  const pick = draft.detail.technologyPick;
  const previousProduct = node.detail.technologyPick?.product;

  const updateDetail = (field: string, value: string) => {
    setDraft((n) => ({
      ...n,
      detail: { ...n.detail, [field]: value },
    }));
  };

  const updatePick = (field: string, value: string) => {
    if (!pick) return;
    setDraft((n) => ({
      ...n,
      detail: {
        ...n.detail,
        technologyPick: { ...pick, [field]: value },
      },
    }));
  };

  const updateVendor = (field: string, value: string) => {
    if (!pick) return;
    setDraft((n) => ({
      ...n,
      detail: {
        ...n.detail,
        technologyPick: {
          ...pick,
          vendor: { ...pick.vendor, [field]: value },
        },
      },
    }));
  };

  const updateCost = (field: "range" | "notes", value: string) => {
    setDraft((n) => ({
      ...n,
      detail: {
        ...n.detail,
        costEstimate: { ...n.detail.costEstimate, [field]: value },
      },
    }));
  };

  const save = () => {
    applyNodeUpdate(draft, { previousProduct });
    updateActiveDeployment();
    onSaved?.();
  };

  const reset = () => setDraft(node);

  return (
    <div className="space-y-4">
      <EditableField
        label="Component name"
        value={draft.label}
        onChange={(v) => setDraft((n) => ({ ...n, label: v }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Kind
          </label>
          <select
            value={draft.kind ?? "component"}
            onChange={(e) =>
              setDraft((n) => ({
                ...n,
                kind: e.target.value as NodeKind,
              }))
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs outline-none focus:border-orange-500/40"
          >
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <EditableField
          label="Zone"
          value={draft.zone ?? ""}
          onChange={(v) => setDraft((n) => ({ ...n, zone: v }))}
        />
      </div>
      <EditableField
        label="Role tag"
        value={draft.roleTag ?? ""}
        onChange={(v) => setDraft((n) => ({ ...n, roleTag: v }))}
      />
      <EditableField
        label="Overview"
        value={draft.detail.overview}
        onChange={(v) => updateDetail("overview", v)}
        multiline
      />
      <EditableField
        label="Purpose"
        value={draft.detail.purpose}
        onChange={(v) => updateDetail("purpose", v)}
        multiline
      />
      <EditableField
        label="Notes"
        value={draft.detail.notes}
        onChange={(v) => updateDetail("notes", v)}
        multiline
      />

      {pick && (
        <div className="space-y-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="text-[10px] font-medium tracking-wide text-orange-400/80 uppercase">
            Technology pick
          </p>
          <EditableField label="Product" value={pick.product} onChange={(v) => updatePick("product", v)} />
          <EditableField label="Version" value={pick.version ?? ""} onChange={(v) => updatePick("version", v)} />
          <EditableField label="Role" value={pick.role} onChange={(v) => updatePick("role", v)} multiline />
          <EditableField
            label="Connects to"
            value={pick.connectsTo ?? ""}
            onChange={(v) => updatePick("connectsTo", v)}
          />
          <EditableField
            label="Deployment note"
            value={pick.deploymentNote ?? ""}
            onChange={(v) => updatePick("deploymentNote", v)}
            multiline
          />
          <EditableField label="Vendor" value={pick.vendor.name} onChange={(v) => updateVendor("name", v)} />
          <EditableField label="Website" value={pick.vendor.website} onChange={(v) => updateVendor("website", v)} />
          <EditableField
            label="Contact email"
            value={pick.vendor.contactEmail ?? ""}
            onChange={(v) => updateVendor("contactEmail", v)}
          />
          <EditableField
            label="Contact page"
            value={pick.vendor.contactPage ?? ""}
            onChange={(v) => updateVendor("contactPage", v)}
          />
          <EditableField
            label="Phone"
            value={pick.vendor.contactPhone ?? ""}
            onChange={(v) => updateVendor("contactPhone", v)}
          />
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-white/8 bg-white/[0.02] p-3">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Cost estimate
        </p>
        <EditableField
          label="Range"
          value={draft.detail.costEstimate.range}
          onChange={(v) => updateCost("range", v)}
        />
        <EditableField
          label="Notes"
          value={draft.detail.costEstimate.notes}
          onChange={(v) => updateCost("notes", v)}
          multiline
        />
      </div>

      <div className="flex gap-2">
        <Button className="flex-1 bg-orange-600 hover:bg-orange-500" onClick={save}>
          <Save className="size-4" />
          Save changes
        </Button>
        <Button variant="outline" size="icon" onClick={reset} title="Reset">
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
