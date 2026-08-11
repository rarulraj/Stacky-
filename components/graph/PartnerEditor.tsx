"use client";

import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableField } from "@/components/graph/EditableField";
import { useStackyStore } from "@/lib/store";
import type { ImplementationPartner } from "@/lib/types";

export function PartnerEditor({ partner }: { partner: ImplementationPartner }) {
  const updateImplementationPartner = useStackyStore((s) => s.updateImplementationPartner);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(partner);

  const save = () => {
    updateImplementationPartner(partner.id, draft);
    updateActiveDeployment();
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(partner);
          setEditing(true);
        }}
        className="text-[10px] text-muted-foreground underline-offset-2 hover:text-orange-300 hover:underline"
      >
        <Pencil className="mr-1 inline size-3" />
        Edit partner
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-violet-500/30 bg-black/20 p-3">
      <EditableField label="Company" value={draft.company} onChange={(v) => setDraft({ ...draft, company: v })} />
      <EditableField label="Contact name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
      <EditableField label="Type" value={draft.partnerType} onChange={(v) => setDraft({ ...draft, partnerType: v as ImplementationPartner["partnerType"] })} />
      <EditableField label="Website" value={draft.website} onChange={(v) => setDraft({ ...draft, website: v })} />
      <EditableField label="Email" value={draft.contactEmail ?? ""} onChange={(v) => setDraft({ ...draft, contactEmail: v })} />
      <EditableField label="Contact page" value={draft.contactPage ?? ""} onChange={(v) => setDraft({ ...draft, contactPage: v })} />
      <EditableField label="Phone" value={draft.contactPhone ?? ""} onChange={(v) => setDraft({ ...draft, contactPhone: v })} />
      <EditableField label="Region" value={draft.region ?? ""} onChange={(v) => setDraft({ ...draft, region: v })} />
      <EditableField label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} multiline />
      <EditableField
        label="Services (comma-separated)"
        value={draft.services.join(", ")}
        onChange={(v) => setDraft({ ...draft, services: v.split(",").map((s) => s.trim()).filter(Boolean) })}
      />
      <EditableField
        label="Deploys (comma-separated)"
        value={draft.deploysComponents.join(", ")}
        onChange={(v) => setDraft({ ...draft, deploysComponents: v.split(",").map((s) => s.trim()).filter(Boolean) })}
      />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={save}>
          <Save className="size-3.5" />
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
