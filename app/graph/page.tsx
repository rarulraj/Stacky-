"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArchitectureCanvas } from "@/components/graph/ArchitectureCanvas";
import { OutreachPanel } from "@/components/graph/OutreachPanel";
import { GraphToolbar } from "@/components/graph/GraphToolbar";
import { NodeSidePanel } from "@/components/graph/NodeSidePanel";
import { fetchExpandNode } from "@/lib/ai/client";
import { useStackyStore } from "@/lib/store";

export default function GraphPage() {
  const router = useRouter();
  const nodes = useStackyStore((s) => s.nodes);
  const context = useStackyStore((s) => s.context);
  const selectedNodeId = useStackyStore((s) => s.selectedNodeId);
  const panelOpen = useStackyStore((s) => s.panelOpen);
  const integrations = useStackyStore((s) => s.integrations);
  const setGraphData = useStackyStore((s) => s.setGraphData);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);
  const selectNode = useStackyStore((s) => s.selectNode);
  const setPanelOpen = useStackyStore((s) => s.setPanelOpen);
  const [isExpanding, setIsExpanding] = useState(false);

  const selectedNode =
    selectedNodeId !== null
      ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
      : null;

  const canExpand =
    selectedNode !== null &&
    !selectedNode.expanded &&
    selectedNode.depth >= 1 &&
    selectedNode.depth < 4;

  useEffect(() => {
    if (nodes.length === 0) {
      router.replace("/");
    }
  }, [nodes.length, router]);

  const handleExpand = async () => {
    if (!selectedNode || isExpanding) return;
    setIsExpanding(true);
    try {
      const { nodes: updated, integrations: nextIntegrations } = await fetchExpandNode(
        context,
        selectedNode,
        nodes,
        integrations
      );
      setGraphData(updated, nextIntegrations);
      updateActiveDeployment();
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#1c1917]">
      <GraphToolbar />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {context.intent !== "architecture" && <OutreachPanel />}
        <ArchitectureCanvas />
        <NodeSidePanel
          open={panelOpen}
          onClose={() => {
            selectNode(null);
            setPanelOpen(false);
          }}
          onExpand={handleExpand}
          canExpand={canExpand && !isExpanding}
        />
      </div>
    </div>
  );
}
