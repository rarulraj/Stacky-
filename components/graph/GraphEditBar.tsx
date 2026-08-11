"use client";

import { LayoutGrid, Plus, Shield, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStackyStore } from "@/lib/store";
import type { NodeKind } from "@/lib/types";

export function GraphEditBar() {
  const selectedNodeId = useStackyStore((s) => s.selectedNodeId);
  const nodes = useStackyStore((s) => s.nodes);
  const context = useStackyStore((s) => s.context);
  const addChildNode = useStackyStore((s) => s.addChildNode);
  const addStandaloneNode = useStackyStore((s) => s.addStandaloneNode);
  const deleteNode = useStackyStore((s) => s.deleteNode);
  const relayoutGraph = useStackyStore((s) => s.relayoutGraph);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);

  const selected = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId) ?? null
    : null;
  const canAdd = !!selected && selected.depth < 4;
  const canDelete = !!selected && selected.depth > 0;
  const isArchitecture = context.intent === "architecture";

  const add = () => {
    if (!selectedNodeId) return;
    const label = window.prompt("Component name", "New component");
    if (!label?.trim()) return;
    addChildNode(selectedNodeId, label.trim());
    updateActiveDeployment();
  };

  const addKind = (kind: NodeKind, defaultLabel: string) => {
    const label = window.prompt("Name", defaultLabel);
    if (!label?.trim()) return;
    addStandaloneNode({
      label: label.trim(),
      kind,
      zone: selected?.zone ?? selected?.label,
      parentId: selected?.id ?? nodes.find((n) => n.depth === 0)?.id ?? null,
    });
    updateActiveDeployment();
  };

  const remove = () => {
    if (!selectedNodeId || !canDelete) return;
    if (!confirm(`Delete "${selected?.label}" and its children?`)) return;
    deleteNode(selectedNodeId);
    updateActiveDeployment();
  };

  const relayout = () => {
    relayoutGraph();
    updateActiveDeployment();
  };

  return (
    <div className="absolute bottom-20 left-4 z-10 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/8 bg-[#1c1917]/90 p-1 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={!canAdd}
          onClick={add}
          title={
            selected
              ? "Add a child component under the selected node"
              : "Select a node first"
          }
        >
          <Plus className="size-3.5" />
          Add
        </Button>
        {isArchitecture && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => addKind("firewall", "Firewall")}
              title="Add firewall node"
            >
              <Shield className="size-3.5" />
              Firewall
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => addKind("zone", "New zone")}
              title="Add network zone"
            >
              <Link2 className="size-3.5" />
              Zone
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-red-300/90 hover:text-red-200"
          disabled={!canDelete}
          onClick={remove}
          title={
            canDelete
              ? "Delete selected node and descendants"
              : "Select a non-root node to delete"
          }
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={relayout}
          title="Auto-layout the graph"
        >
          <LayoutGrid className="size-3.5" />
          Layout
        </Button>
      </div>
      <p className="max-w-[260px] px-1 text-[10px] leading-relaxed text-muted-foreground/80">
        {isArchitecture
          ? "Full edit mode: drag nodes, drag handles to connect, click edges for ports, add zones/firewalls."
          : "Manual edit: drag nodes, add/delete here, or open a node and use the pencil."}
      </p>
    </div>
  );
}
