import type { Integration, StackyNode, TechnologyPick } from "@/lib/types";
import { buildIntegrationsFromNodes } from "@/lib/graph/integrations-from-nodes";

function replaceProductText(text: string, oldProduct: string, newProduct: string): string {
  if (!text || !oldProduct || oldProduct === newProduct) return text;
  return text.split(oldProduct).join(newProduct);
}

function patchPickReferences(
  pick: TechnologyPick,
  oldProduct: string,
  newProduct: string
): TechnologyPick {
  return {
    ...pick,
    role: replaceProductText(pick.role, oldProduct, newProduct),
    connectsTo: pick.connectsTo
      ? replaceProductText(pick.connectsTo, oldProduct, newProduct)
      : pick.connectsTo,
    deploymentNote: pick.deploymentNote
      ? replaceProductText(pick.deploymentNote, oldProduct, newProduct)
      : pick.deploymentNote,
  };
}

/** Propagate a product rename across every node and integration in the graph */
export function patchProductReferences(
  nodes: StackyNode[],
  integrations: Integration[],
  oldProduct: string,
  newProduct: string
): { nodes: StackyNode[]; integrations: Integration[] } {
  if (!oldProduct || oldProduct === newProduct) {
    return { nodes, integrations };
  }

  const patchedNodes = nodes.map((node) => {
    const detail = node.detail;
    const pick = detail.technologyPick;

    return {
      ...node,
      detail: {
        ...detail,
        overview: replaceProductText(detail.overview, oldProduct, newProduct),
        purpose: replaceProductText(detail.purpose, oldProduct, newProduct),
        notes: replaceProductText(detail.notes, oldProduct, newProduct),
        technologies: detail.technologies.map((t) =>
          replaceProductText(t, oldProduct, newProduct)
        ),
        technologyPick: pick
          ? patchPickReferences(pick, oldProduct, newProduct)
          : pick,
        vendors: detail.vendors.map((v) => ({
          ...v,
          description: replaceProductText(v.description, oldProduct, newProduct),
        })),
        futureRecommendations: detail.futureRecommendations.map((r) =>
          replaceProductText(r, oldProduct, newProduct)
        ),
      },
    };
  });

  const patchedIntegrations = integrations.map((int) => ({
    ...int,
    label: replaceProductText(int.label, oldProduct, newProduct),
    protocol: replaceProductText(int.protocol, oldProduct, newProduct),
    dataFlow: replaceProductText(int.dataFlow, oldProduct, newProduct),
    description: replaceProductText(int.description, oldProduct, newProduct),
  }));

  return { nodes: patchedNodes, integrations: patchedIntegrations };
}

/** Apply a full node update and sync the entire graph atomically */
export function syncGraphAfterNodeUpdate(
  nodes: StackyNode[],
  integrations: Integration[],
  updatedNode: StackyNode,
  previousProduct?: string
): { nodes: StackyNode[]; integrations: Integration[] } {
  const oldProduct =
    previousProduct ??
    nodes.find((n) => n.id === updatedNode.id)?.detail.technologyPick?.product;
  const newProduct = updatedNode.detail.technologyPick?.product;

  let nextNodes = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));

  if (oldProduct && newProduct && oldProduct !== newProduct) {
    const patched = patchProductReferences(nextNodes, integrations, oldProduct, newProduct);
    nextNodes = patched.nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n
    );
    integrations = patched.integrations;
  }

  const derived = buildIntegrationsFromNodes(nextNodes);
  integrations = mergeIntegrations(integrations, derived);

  return { nodes: nextNodes, integrations };
}

function mergeIntegrations(
  existing: Integration[],
  generated: Integration[]
): Integration[] {
  const byId = new Map<string, Integration>();

  existing.forEach((e) => byId.set(e.id, e));
  generated.forEach((g) => {
    const prev = byId.get(g.id);
    byId.set(g.id, prev ? { ...prev, ...g } : g);
  });

  return Array.from(byId.values());
}

/** Sync after expand/collapse. single atomic graph state */
export function syncGraphState(
  nodes: StackyNode[],
  integrations?: Integration[]
): { nodes: StackyNode[]; integrations: Integration[] } {
  return {
    nodes,
    integrations: integrations ?? buildIntegrationsFromNodes(nodes),
  };
}
