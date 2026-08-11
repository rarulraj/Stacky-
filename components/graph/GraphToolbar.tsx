"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  Plus,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { DeploymentsPanel } from "@/components/deployments/DeploymentsPanel";
import { ExportMenu } from "@/components/graph/ExportMenu";
import { GraphHowToUse } from "@/components/graph/GraphHowToUse";
import { StackyMascot } from "@/components/brand/StackyMascot";
import { Button } from "@/components/ui/button";
import { fetchGenerateGraph } from "@/lib/ai/client";
import { useStackyStore } from "@/lib/store";

export function GraphToolbar() {
  const router = useRouter();
  const context = useStackyStore((s) => s.context);
  const nodes = useStackyStore((s) => s.nodes);
  const selectedNodeId = useStackyStore((s) => s.selectedNodeId);
  const userEmail = useStackyStore((s) => s.userEmail);
  const resetProject = useStackyStore((s) => s.resetProject);
  const setOutreachOpen = useStackyStore((s) => s.setOutreachOpen);
  const outreachOpen = useStackyStore((s) => s.outreachOpen);
  const setGraphData = useStackyStore((s) => s.setGraphData);
  const addChildNode = useStackyStore((s) => s.addChildNode);
  const relayoutGraph = useStackyStore((s) => s.relayoutGraph);
  const [rebuilding, setRebuilding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleNewProject = () => {
    resetProject();
    router.push("/");
  };

  const handleAddChild = () => {
    const parentId =
      selectedNodeId ?? nodes.find((n) => n.depth === 0)?.id ?? null;
    if (!parentId) return;
    const label = window.prompt("Component name", "New component");
    if (!label?.trim()) return;
    addChildNode(parentId, label.trim());
  };

  const handleRebuild = async () => {
    if (
      !window.confirm(
        "Rebuild the architecture from your current requirements? Manual node edits will be replaced."
      )
    ) {
      return;
    }
    setRebuilding(true);
    try {
      const { nodes: next, integrations, implementationPartners } =
        await fetchGenerateGraph(context);
      setGraphData(next, integrations, implementationPartners);
      showToast("Architecture rebuilt");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Rebuild failed");
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <header className="shrink-0 border-b border-white/8 bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <StackyMascot size={24} />
            <span className="text-sm font-semibold">Stacky</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="max-w-[200px] truncate text-sm text-muted-foreground md:max-w-xs">
            {context.idea || "Architecture"}
          </span>
          {context.intent && (
            <span
              className={
                context.intent === "architecture"
                  ? "hidden rounded-md border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300 sm:inline"
                  : "hidden rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300 sm:inline"
              }
            >
              {context.intent === "architecture" ? "Diagram" : "Quote"}
            </span>
          )}
          {userEmail && (
            <span className="hidden truncate text-[10px] text-muted-foreground/70 lg:inline">
              {userEmail}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleAddChild}
            title="Add child component under selected node"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add node</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => relayoutGraph()}
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Layout</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            disabled={rebuilding}
            onClick={() => void handleRebuild()}
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">
              {rebuilding ? "Rebuilding…" : "Rebuild"}
            </span>
          </Button>
          {context.intent !== "architecture" && (
            <Button
              variant={outreachOpen ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => setOutreachOpen(!outreachOpen)}
            >
              <Users className="size-3.5" />
              <span className="hidden md:inline">Deploy & Help</span>
            </Button>
          )}
          <ExportMenu />
          <DeploymentsPanel />
          <GraphHowToUse />
          <Button variant="ghost" size="sm" onClick={handleNewProject}>
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </div>
      {toast && (
        <div className="border-t border-white/8 bg-orange-500/10 px-4 py-1.5 text-center text-xs text-orange-200">
          {toast}
        </div>
      )}
    </header>
  );
}
