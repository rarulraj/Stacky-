import { layoutGraph } from "@/lib/layout-graph";
import type { Integration, ProjectContext, StackyNode } from "@/lib/types";
import { fillDetail } from "./helpers";
import { generateIntegrations } from "./integrations";
import { CHILDREN_MAP, enrichDomainDetail, getChildDetail, ROOT_DETAILS } from "./node-details";
import { getTemplateVars } from "./templates";

function createNode(
  label: string,
  parentId: string | null,
  depth: number,
  detail: StackyNode["detail"]
): StackyNode {
  return {
    id: `${parentId ?? "root"}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${depth}`,
    label,
    parentId,
    depth,
    collapsed: false,
    expanded: false,
    position: { x: 0, y: 0 },
    detail,
  };
}

export function buildGraph(
  nodes: StackyNode[]
): { nodes: StackyNode[]; integrations: Integration[] } {
  const laidOut = layoutGraph(nodes);
  return {
    nodes: laidOut,
    integrations: generateIntegrations(laidOut),
  };
}

export function generateRootGraph(ctx: ProjectContext): StackyNode[] {
  return generateRootGraphWithIntegrations(ctx).nodes;
}

export function generateRootGraphWithIntegrations(
  ctx: ProjectContext
): { nodes: StackyNode[]; integrations: Integration[] } {
  const vars = getTemplateVars(ctx);
  const rootLabel = ctx.idea || "System Architecture";

  const root = createNode(
    rootLabel,
    null,
    0,
    fillDetail(
      {
        overview: `Complete architecture blueprint for: ${ctx.idea}`,
        purpose: `A ${vars.deployment} solution designed for ${vars.industry} at ${vars.scale} scale.`,
        technologies: ["See child nodes for specific product picks"],
        tradeoffs: [],
        risks: ["Scope creep without phased rollout"],
        costEstimate: { range: vars.budget, notes: "Full platform estimate across all layers" },
        standards: ["ISA-95", "IEC 62443"],
        bestPractices: ["Phase rollout by plant", "Establish architecture review board"],
        notes: `Designed for ${vars.facilities} facilities with existing: ${ctx.existingSystems ?? "greenfield"}.`,
        futureRecommendations: ["Add specialized agents for security, cost, and compliance review"],
        vendors: [],
      },
      vars
    )
  );

  const children = Object.keys(ROOT_DETAILS).map((label) => {
    const nodeDetail = enrichDomainDetail(
      label,
      fillDetail(ROOT_DETAILS[label], vars)
    );
    return createNode(label, root.id, 1, nodeDetail);
  });

  return buildGraph([root, ...children]);
}

export function expandNode(
  node: StackyNode,
  ctx: ProjectContext,
  existingNodes: StackyNode[]
): { nodes: StackyNode[]; integrations: Integration[]; newNodes: StackyNode[] } {
  const vars = getTemplateVars(ctx);
  const childLabels = CHILDREN_MAP[node.label] ?? [];

  if (childLabels.length === 0 || node.expanded) {
    return {
      nodes: existingNodes,
      integrations: generateIntegrations(existingNodes),
      newNodes: [],
    };
  }

  const existingChildren = existingNodes.filter((n) => n.parentId === node.id);
  if (existingChildren.length > 0) {
    const updated = existingNodes.map((n) =>
      n.id === node.id ? { ...n, expanded: true, collapsed: false } : n
    );
    const result = buildGraph(updated);
    return { ...result, newNodes: [] };
  }

  const newNodes = childLabels.map((label) =>
    createNode(label, node.id, node.depth + 1, getChildDetail(label, vars))
  );

  const updated = existingNodes.map((n) =>
    n.id === node.id ? { ...n, expanded: true, collapsed: false } : n
  );

  const result = buildGraph([...updated, ...newNodes]);
  return { ...result, newNodes };
}
