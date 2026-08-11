"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { StackyFlowNode } from "./StackyFlowNode";
import { GraphEditBar } from "./GraphEditBar";
import { GraphLegend } from "./GraphLegend";
import { EdgeEditPopover } from "./EdgeEditPopover";
import { getChildCount, getVisibleNodes, layoutGraph } from "@/lib/layout-graph";
import { getVisibleIntegrations } from "@/lib/mock/integrations";
import { fetchExpandNode } from "@/lib/ai/client";
import { useStackyStore } from "@/lib/store";

const nodeTypes = { stacky: StackyFlowNode };

function FitViewOnChange({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 50);
    return () => clearTimeout(timer);
  }, [nodeCount, fitView]);

  return null;
}

function ArchitectureCanvasInner() {
  const { fitView } = useReactFlow();
  const nodes = useStackyStore((s) => s.nodes);
  const integrations = useStackyStore((s) => s.integrations);
  const context = useStackyStore((s) => s.context);
  const selectedNodeId = useStackyStore((s) => s.selectedNodeId);
  const selectedEdgeId = useStackyStore((s) => s.selectedEdgeId);
  const graphRevision = useStackyStore((s) => s.graphRevision);
  const setGraphData = useStackyStore((s) => s.setGraphData);
  const updateNodePosition = useStackyStore((s) => s.updateNodePosition);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);
  const selectNode = useStackyStore((s) => s.selectNode);
  const selectEdge = useStackyStore((s) => s.selectEdge);
  const setPanelOpen = useStackyStore((s) => s.setPanelOpen);
  const addIntegration = useStackyStore((s) => s.addIntegration);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [expandError, setExpandError] = useState<string | null>(null);
  const [rfNodes, setRfNodes] = useState<Node[]>([]);

  const isArchitecture = context.intent === "architecture";
  const visibleNodes = useMemo(() => getVisibleNodes(nodes), [nodes]);

  const handleToggleCollapse = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      const updated = nodes.map((n) =>
        n.id === id ? { ...n, collapsed: !node.collapsed } : n
      );
      setGraphData(layoutGraph(updated, context.intent), integrations);
      updateActiveDeployment();
    },
    [nodes, integrations, setGraphData, updateActiveDeployment, context.intent]
  );

  const handleExpand = useCallback(
    async (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node || expandingId) return;

      setExpandingId(id);
      setExpandError(null);
      try {
        const { nodes: updated, integrations: updatedIntegrations } =
          await fetchExpandNode(context, node, nodes, integrations);
        setGraphData(updated, updatedIntegrations);
        updateActiveDeployment();
      } catch (err) {
        setExpandError(
          err instanceof Error ? err.message : "Failed to expand node"
        );
      } finally {
        setExpandingId(null);
      }
    },
    [nodes, context, integrations, setGraphData, expandingId, updateActiveDeployment]
  );

  const handleSelect = useCallback(
    (id: string) => selectNode(id),
    [selectNode]
  );

  const flowNodes: Node[] = useMemo(
    () =>
      visibleNodes.map((n) => ({
        id: n.id,
        type: "stacky",
        position: n.position,
        data: {
          stackyNode: n,
          childCount: getChildCount(nodes, n.id),
          canExpand: !n.expanded && n.depth >= 1 && n.depth < 4,
          selected: n.id === selectedNodeId,
          isExpanding: n.id === expandingId,
          onToggleCollapse: handleToggleCollapse,
          onExpand: handleExpand,
          onSelect: handleSelect,
        },
        draggable: true,
      })),
    [
      visibleNodes,
      nodes,
      selectedNodeId,
      expandingId,
      handleToggleCollapse,
      handleExpand,
      handleSelect,
    ]
  );

  useEffect(() => {
    setRfNodes(flowNodes);
  }, [flowNodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setRfNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      updateNodePosition(node.id, node.position);
      updateActiveDeployment();
    },
    [updateNodePosition, updateActiveDeployment]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const id = addIntegration(connection.source, connection.target, {
        label: "Data flow",
        protocol: "",
        ports: "",
        direction: "bidirectional",
        networkNote: "Edit ports and firewall rules on this edge",
      });
      if (id) updateActiveDeployment();
    },
    [addIntegration, updateActiveDeployment]
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleIntegrations = useMemo(
    () => getVisibleIntegrations(integrations, visibleNodeIds),
    [integrations, visibleNodeIds]
  );

  const flowEdges: Edge[] = useMemo(() => {
    const hierarchyEdges: Edge[] = isArchitecture
      ? []
      : visibleNodes
          .filter((n) => n.parentId)
          .map((n) => ({
            id: `h-${n.parentId}-${n.id}`,
            source: n.parentId!,
            target: n.id,
            type: "smoothstep",
            style: {
              stroke: "rgba(251, 146, 60, 0.35)",
              strokeWidth: 2,
            },
            animated: false,
            selectable: false,
          }));

    const integrationEdges: Edge[] = visibleIntegrations.map((int) => {
      const selected = int.id === selectedEdgeId;
      const portLabel = int.ports?.trim()
        ? `${int.label}${int.ports ? ` · ${int.ports}` : ""}`
        : int.label;
      return {
        id: int.id,
        source: int.fromNodeId,
        target: int.toNodeId,
        sourceHandle: isArchitecture ? "right" : "bottom",
        targetHandle: isArchitecture ? "left" : "top",
        type: "smoothstep",
        label: portLabel,
        labelStyle: {
          fill: selected ? "#fdba74" : "#7dd3fc",
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: { fill: "#1c1917", fillOpacity: 0.9 },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: selected ? "rgba(251, 146, 60, 0.9)" : "rgba(56, 189, 248, 0.7)",
        },
        style: {
          stroke: selected
            ? "rgba(251, 146, 60, 0.85)"
            : "rgba(56, 189, 248, 0.55)",
          strokeWidth: selected ? 2.5 : 1.75,
          strokeDasharray: int.direction === "bidirectional" ? undefined : "6 4",
        },
        animated: int.direction !== "bidirectional",
        selectable: true,
      };
    });

    return [...hierarchyEdges, ...integrationEdges];
  }, [visibleNodes, visibleIntegrations, selectedEdgeId, isArchitecture]);

  useEffect(() => {
    const handler = () => {
      void (async () => {
        fitView({ padding: 0.12, duration: 250 });
        await new Promise((r) => setTimeout(r, 400));
        window.dispatchEvent(new CustomEvent("stacky-export-png-ready"));
      })();
    };
    window.addEventListener("stacky-prepare-export-png", handler);
    return () => window.removeEventListener("stacky-prepare-export-png", handler);
  }, [fitView]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        selectNode(null);
        selectEdge(null);
        setPanelOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectNode, selectEdge, setPanelOpen]);

  return (
    <div className="h-full w-full">
      <GraphLegend />
      <GraphEditBar />
      <EdgeEditPopover />
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <div className="rounded-xl border border-white/8 bg-[#1c1917]/90 px-3 py-2 backdrop-blur-md">
          <p className="text-[10px] text-muted-foreground">
            Showing {visibleNodes.length} of {nodes.length} nodes
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/70">
            {isArchitecture
              ? "Drag · drag handle→handle to connect · click edge for ports · pencil to edit"
              : "Drag · edit bar · pencil · Download in toolbar"}
          </p>
        </div>
        {expandError && (
          <div className="max-w-xs rounded-xl border border-red-500/30 bg-red-950/80 px-3 py-2 text-[11px] text-red-200">
            {expandError}
          </div>
        )}
      </div>
      <ReactFlow
        key={graphRevision}
        nodes={rfNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        edgesFocusable
        onEdgeClick={(_, edge) => {
          if (edge.id.startsWith("h-")) return;
          selectEdge(edge.id);
        }}
        onPaneClick={() => {
          selectNode(null);
          selectEdge(null);
          setPanelOpen(false);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ type: "smoothstep" }}
        connectionLineStyle={{ stroke: "rgba(251, 146, 60, 0.7)", strokeWidth: 2 }}
        minZoom={0.15}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
      >
        <FitViewOnChange nodeCount={visibleNodes.length} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls className="!rounded-xl !border-white/8 !bg-[#1c1917]/90 !shadow-lg [&>button]:!border-white/8 [&>button]:!bg-transparent [&>button]:hover:!bg-white/10" />
        <MiniMap
          className="!rounded-xl !border-white/8 !bg-[#1c1917]/90"
          maskColor="rgba(0,0,0,0.65)"
          nodeColor={(node) => {
            const kind = (node.data as { stackyNode?: { kind?: string; depth: number } })
              ?.stackyNode?.kind;
            if (kind === "firewall") return "#ef4444";
            if (kind === "zone") return "#0ea5e9";
            if (kind === "network") return "#06b6d4";
            if (kind === "client") return "#10b981";
            if (kind === "datasource") return "#8b5cf6";
            const depth =
              (node.data as { stackyNode?: { depth: number } })?.stackyNode?.depth ?? 0;
            return ["#f97316", "#f59e0b", "#eab308", "#a8a29e"][depth % 4];
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function ArchitectureCanvas() {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner />
    </ReactFlowProvider>
  );
}
