import type { Integration, StackyNode } from "@/lib/types";

function slugId(fromId: string, toId: string): string {
  return `int-${fromId}-${toId}`;
}

function findTargetNode(
  nodes: StackyNode[],
  reference: string
): StackyNode | undefined {
  const lower = reference.toLowerCase();
  return (
    nodes.find((n) => n.label.toLowerCase() === lower) ??
    nodes.find((n) =>
      n.detail.technologyPick?.product.toLowerCase().includes(lower)
    ) ??
    nodes.find((n) => lower.includes(n.label.toLowerCase())) ??
    nodes.find((n) => {
      const product = n.detail.technologyPick?.product.toLowerCase();
      return product && lower.includes(product);
    })
  );
}

/** Build integration edges from technology picks — no hardcoded mock vendors */
export function buildIntegrationsFromNodes(nodes: StackyNode[]): Integration[] {
  const byId = new Map<string, Integration>();

  nodes.forEach((node) => {
    if (!node.parentId) return;
    const parent = nodes.find((n) => n.id === node.parentId);
    if (!parent) return;

    const parentPick = parent.detail.technologyPick;
    const childPick = node.detail.technologyPick;
    if (!parentPick || !childPick) return;

    const id = slugId(parent.id, node.id);
    byId.set(id, {
      id,
      fromNodeId: parent.id,
      toNodeId: node.id,
      label: `${parent.label} → ${node.label}`,
      protocol: "Production integration",
      dataFlow: childPick.role,
      description: `${parentPick.product} feeds ${childPick.product}: ${childPick.role}`,
    });
  });

  nodes.forEach((node) => {
    const pick = node.detail.technologyPick;
    if (!pick?.connectsTo) return;

    const targets = pick.connectsTo
      .split(/[,;→]| and /i)
      .map((s) => s.trim())
      .filter(Boolean);

    targets.forEach((ref) => {
      const target = findTargetNode(nodes, ref);
      if (!target || target.id === node.id) return;

      const [fromId, toId] =
        node.depth <= target.depth
          ? [node.id, target.id]
          : [target.id, node.id];

      const id = slugId(fromId, toId);
      if (byId.has(id)) return;

      const fromNode = nodes.find((n) => n.id === fromId)!;
      const toNode = nodes.find((n) => n.id === toId)!;
      const fromPick = fromNode.detail.technologyPick;
      const toPick = toNode.detail.technologyPick;

      byId.set(id, {
        id,
        fromNodeId: fromId,
        toNodeId: toId,
        label: `${fromNode.label} → ${toNode.label}`,
        protocol: "Cross-domain integration",
        dataFlow: pick.role,
        description:
          fromPick && toPick
            ? `${fromPick.product} integrates with ${toPick.product} per deployment design`
            : `${fromNode.label} connects to ${toNode.label}`,
      });
    });
  });

  return Array.from(byId.values());
}

export function mergeIntegrations(
  existing: Integration[],
  incoming: Integration[]
): Integration[] {
  const byId = new Map<string, Integration>();
  existing.forEach((e) => byId.set(e.id, e));
  incoming.forEach((i) => {
    const prev = byId.get(i.id);
    byId.set(i.id, prev ? { ...prev, ...i } : i);
  });
  return Array.from(byId.values());
}
