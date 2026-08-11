import dagre from "@dagrejs/dagre";
import type { NodeKind, ProjectIntent, StackyNode } from "./types";

export const GRAPH_NODE_WIDTH = 200;
export const GRAPH_NODE_HEIGHT = 72;
export const GRAPH_ROOT_WIDTH = 300;
export const GRAPH_ROOT_HEIGHT = 88;
export const GRAPH_DOMAIN_HEIGHT = 80;

function getNodeDimensions(
  node: StackyNode
): { width: number; height: number } {
  if (node.kind === "firewall") return { width: 160, height: 56 };
  if (node.kind === "zone") return { width: 240, height: 72 };
  if (node.depth === 0) return { width: GRAPH_ROOT_WIDTH, height: GRAPH_ROOT_HEIGHT };
  if (node.depth === 1) return { width: GRAPH_NODE_WIDTH + 20, height: GRAPH_DOMAIN_HEIGHT };
  return { width: GRAPH_NODE_WIDTH, height: GRAPH_NODE_HEIGHT };
}

const ZONE_ORDER = [
  "plant",
  "control",
  "ot",
  "site",
  "dmz",
  "edge",
  "server room",
  "central",
  "mpls",
  "wan",
  "corporate",
  "business",
  "enterprise",
  "it",
  "client",
];

function zoneRank(label: string): number {
  const lower = label.toLowerCase();
  const idx = ZONE_ORDER.findIndex((z) => lower.includes(z));
  return idx === -1 ? 50 : idx;
}

/**
 * Compact top-down tree: siblings spread horizontally per layer, layers stack vertically.
 * Only lays out visible (non-collapsed) nodes for a tight diagram.
 */
export function layoutGraph(
  nodes: StackyNode[],
  intent?: ProjectIntent
): StackyNode[] {
  if (nodes.length === 0) return nodes;

  const hasZones = nodes.some(
    (n) => n.kind === "zone" || (n.zone && n.depth >= 1)
  );
  if (intent === "architecture" || hasZones) {
    return layoutArchitectureZones(nodes);
  }

  return layoutTree(nodes, "TB");
}

function layoutTree(
  nodes: StackyNode[],
  rankdir: "TB" | "LR"
): StackyNode[] {
  const visible = getVisibleNodes(nodes);
  if (visible.length === 0) return nodes;

  const visibleIds = new Set(visible.map((n) => n.id));
  const dims = new Map(visible.map((n) => [n.id, getNodeDimensions(n)]));

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir,
    nodesep: rankdir === "LR" ? 40 : 50,
    ranksep: rankdir === "LR" ? 120 : 100,
    marginx: 48,
    marginy: 48,
    align: undefined,
  });

  visible.forEach((node) => {
    const { width, height } = dims.get(node.id)!;
    g.setNode(node.id, { width, height });
  });

  visible.forEach((node) => {
    if (node.parentId && visibleIds.has(node.parentId)) {
      g.setEdge(node.parentId, node.id);
    }
  });

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  visible.forEach((node) => {
    const { width, height } = dims.get(node.id)!;
    const p = g.node(node.id);
    positions.set(node.id, { x: p.x - width / 2, y: p.y - height / 2 });
  });

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}

/**
 * Left-to-right security zones (Control → DMZ → Corporate), components stacked
 * inside each zone column. closer to classic OT architecture drawings.
 */
export function layoutArchitectureZones(nodes: StackyNode[]): StackyNode[] {
  const visible = getVisibleNodes(nodes);
  if (visible.length === 0) return nodes;

  const root = visible.find((n) => n.depth === 0);
  const zones = visible
    .filter((n) => n.kind === "zone" || (n.depth === 1 && n.kind !== "firewall"))
    .sort(
      (a, b) =>
        zoneRank(a.zone ?? a.label) - zoneRank(b.zone ?? b.label) ||
        a.label.localeCompare(b.label)
    );

  const positions = new Map<string, { x: number; y: number }>();
  const COL_W = 280;
  const ROW_H = 100;
  const TOP = 100;

  if (root) {
    positions.set(root.id, {
      x: Math.max(0, ((zones.length - 1) * COL_W) / 2),
      y: 16,
    });
  }

  zones.forEach((zone, col) => {
    const x = col * COL_W;
    positions.set(zone.id, { x, y: TOP });

    const children = visible
      .filter((n) => n.parentId === zone.id)
      .sort((a, b) => {
        const kindOrder = (k?: NodeKind) =>
          k === "firewall" ? 0 : k === "network" ? 1 : k === "datasource" ? 2 : 3;
        return kindOrder(a.kind) - kindOrder(b.kind) || a.label.localeCompare(b.label);
      });

    children.forEach((child, row) => {
      positions.set(child.id, { x: x + 12, y: TOP + 90 + row * ROW_H });

      const grand = visible
        .filter((n) => n.parentId === child.id)
        .sort((a, b) => a.label.localeCompare(b.label));
      grand.forEach((g, gi) => {
        positions.set(g.id, {
          x: x + 28,
          y: TOP + 90 + row * ROW_H + 70 + gi * 70,
        });
      });
    });
  });

  // Orphans (visible but not placed). park to the right
  let orphanY = TOP;
  const orphanX = zones.length * COL_W + 40;
  visible.forEach((n) => {
    if (!positions.has(n.id)) {
      positions.set(n.id, { x: orphanX, y: orphanY });
      orphanY += ROW_H;
    }
  });

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}

export function getVisibleNodes(nodes: StackyNode[]): StackyNode[] {
  const hiddenIds = new Set<string>();

  const collectDescendants = (parentId: string) => {
    nodes.forEach((node) => {
      if (node.parentId === parentId) {
        hiddenIds.add(node.id);
        collectDescendants(node.id);
      }
    });
  };

  nodes.forEach((node) => {
    if (node.collapsed) {
      collectDescendants(node.id);
    }
  });

  return nodes.filter((node) => !hiddenIds.has(node.id));
}

export function getChildCount(nodes: StackyNode[], nodeId: string): number {
  return nodes.filter((node) => node.parentId === nodeId).length;
}

export const DEPTH_LABELS = ["System", "Zone / Domain", "Component", "Detail"];

export const DEPTH_COLORS = [
  "border-orange-500/60 bg-gradient-to-br from-orange-500/15 to-orange-600/5",
  "border-amber-500/50 bg-gradient-to-br from-amber-500/12 to-amber-600/5",
  "border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5",
  "border-stone-500/35 bg-gradient-to-br from-stone-500/8 to-stone-600/5",
];

export const DEPTH_ACCENT = [
  "bg-orange-500",
  "bg-amber-500",
  "bg-yellow-500",
  "bg-stone-400",
];

const KIND_COLORS: Record<NodeKind, string> = {
  system:
    "border-orange-500/60 bg-gradient-to-br from-orange-500/15 to-orange-600/5",
  zone: "border-sky-500/45 bg-gradient-to-br from-sky-500/12 to-sky-900/20",
  component:
    "border-amber-500/45 bg-gradient-to-br from-amber-500/10 to-amber-600/5",
  firewall:
    "border-red-500/55 bg-gradient-to-br from-red-500/15 to-red-900/25",
  network:
    "border-cyan-500/45 bg-gradient-to-br from-cyan-500/10 to-cyan-900/20",
  client:
    "border-emerald-500/45 bg-gradient-to-br from-emerald-500/10 to-emerald-900/15",
  datasource:
    "border-violet-500/45 bg-gradient-to-br from-violet-500/10 to-violet-900/15",
};

const KIND_ACCENT: Record<NodeKind, string> = {
  system: "bg-orange-500",
  zone: "bg-sky-500",
  component: "bg-amber-500",
  firewall: "bg-red-500",
  network: "bg-cyan-500",
  client: "bg-emerald-500",
  datasource: "bg-violet-500",
};

export function getDepthColor(depth: number): string {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

export function getDepthAccent(depth: number): string {
  return DEPTH_ACCENT[depth % DEPTH_ACCENT.length];
}

export function getDepthLabel(depth: number): string {
  return DEPTH_LABELS[Math.min(depth, DEPTH_LABELS.length - 1)];
}

export function getNodeColor(node: StackyNode): string {
  if (node.kind && KIND_COLORS[node.kind]) return KIND_COLORS[node.kind];
  return getDepthColor(node.depth);
}

export function getNodeAccent(node: StackyNode): string {
  if (node.kind && KIND_ACCENT[node.kind]) return KIND_ACCENT[node.kind];
  return getDepthAccent(node.depth);
}

export function getKindLabel(kind?: NodeKind, depth = 0): string {
  if (!kind) return getDepthLabel(depth);
  const map: Record<NodeKind, string> = {
    system: "System",
    zone: "Zone",
    component: "Component",
    firewall: "Firewall",
    network: "Network",
    client: "Client",
    datasource: "Data source",
  };
  return map[kind];
}
