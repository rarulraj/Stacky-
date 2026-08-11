import { layoutGraph } from "@/lib/layout-graph";
import type {
  Integration,
  NodeDetail,
  NodeKind,
  StackyNode,
} from "@/lib/types";

export function emptyNodeDetail(label: string): NodeDetail {
  return {
    overview: `${label}: describe this component’s role in the architecture.`,
    purpose: `Supports the parent system as ${label}.`,
    technologies: [],
    tradeoffs: [],
    risks: [],
    costEstimate: { range: "TBD", notes: "Estimate after product selection" },
    standards: [],
    bestPractices: [],
    notes: "",
    futureRecommendations: [],
    vendors: [],
  };
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function uniqueNodeId(
  base: string,
  existingIds: Set<string>
): string {
  let id = slugify(base) || "component";
  let n = 1;
  while (existingIds.has(id)) {
    id = `${slugify(base) || "component"}-${n++}`;
  }
  return id;
}

export function createChildNode(
  parent: StackyNode,
  label: string,
  existingIds: Set<string>,
  extras?: { kind?: NodeKind; zone?: string; roleTag?: string }
): StackyNode {
  let id = `${parent.id}-${slugify(label) || "component"}`;
  let n = 1;
  while (existingIds.has(id)) {
    id = `${parent.id}-${slugify(label) || "component"}-${n++}`;
  }

  return {
    id,
    label: label.trim() || "New component",
    parentId: parent.id,
    depth: parent.depth + 1,
    collapsed: false,
    expanded: false,
    position: {
      x: parent.position.x,
      y: parent.position.y + 140,
    },
    detail: emptyNodeDetail(label.trim() || "New component"),
    kind: extras?.kind ?? "component",
    zone: extras?.zone ?? parent.zone,
    roleTag: extras?.roleTag,
  };
}

export function createStandaloneNode(
  label: string,
  existingIds: Set<string>,
  opts?: {
    parentId?: string | null;
    depth?: number;
    kind?: NodeKind;
    zone?: string;
    roleTag?: string;
    position?: { x: number; y: number };
  }
): StackyNode {
  const id = uniqueNodeId(label, existingIds);
  return {
    id,
    label: label.trim() || "New component",
    parentId: opts?.parentId ?? null,
    depth: opts?.depth ?? 1,
    collapsed: false,
    expanded: false,
    position: opts?.position ?? { x: 120, y: 120 },
    detail: emptyNodeDetail(label.trim() || "New component"),
    kind: opts?.kind ?? "component",
    zone: opts?.zone,
    roleTag: opts?.roleTag,
  };
}

export function createIntegration(
  fromNodeId: string,
  toNodeId: string,
  extras?: Partial<Integration>
): Integration {
  return {
    id: extras?.id ?? `int-${fromNodeId}-${toNodeId}`,
    fromNodeId,
    toNodeId,
    label: extras?.label ?? "Data flow",
    protocol: extras?.protocol ?? "",
    dataFlow: extras?.dataFlow ?? "",
    description: extras?.description ?? "",
    setupSteps: extras?.setupSteps,
    dataFormat: extras?.dataFormat,
    networkNote: extras?.networkNote,
    ports: extras?.ports,
    direction: extras?.direction ?? "bidirectional",
    whoSetsThisUp: extras?.whoSetsThisUp,
    estimatedEffort: extras?.estimatedEffort,
  };
}

export function collectDescendantIds(
  nodes: StackyNode[],
  rootId: string
): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id);
        changed = true;
      }
    }
  }
  return ids;
}

export function removeNodesAndIntegrations(
  nodes: StackyNode[],
  integrations: Integration[],
  removeIds: Set<string>
): { nodes: StackyNode[]; integrations: Integration[] } {
  return {
    nodes: nodes.filter((n) => !removeIds.has(n.id)),
    integrations: integrations.filter(
      (i) => !removeIds.has(i.fromNodeId) && !removeIds.has(i.toNodeId)
    ),
  };
}

export function withRelayout(
  nodes: StackyNode[],
  intent?: import("@/lib/types").ProjectIntent
): StackyNode[] {
  return layoutGraph(nodes, intent);
}
