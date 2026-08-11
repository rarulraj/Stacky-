import type { ProjectContext, StackyNode, TechnologyPick } from "@/lib/types";
import { isValidTechnologyPick } from "./validate-pick";

export function applyTechnologyPickToNode(
  node: StackyNode,
  pick: TechnologyPick
): StackyNode {
  const techLabel = `${pick.product}${pick.version ? ` ${pick.version}` : ""}`;
  return {
    ...node,
    detail: {
      ...node.detail,
      technologyPick: pick,
      technologies: [techLabel],
      vendors: [pick.vendor],
      overview: node.detail.overview.includes(pick.product)
        ? node.detail.overview
        : `${node.detail.overview} Stacky selected ${pick.product} by ${pick.vendor.name}.`,
    },
  };
}

export function nodesNeedingResearch(nodes: StackyNode[]): StackyNode[] {
  return nodes.filter(
    (n) => n.depth >= 1 && !isValidTechnologyPick(n.detail.technologyPick, n.label)
  );
}

export async function enrichNodesWithTechnologies(
  ctx: ProjectContext,
  nodes: StackyNode[],
  researchFn: (node: StackyNode) => Promise<TechnologyPick>
): Promise<StackyNode[]> {
  const needsResearch = nodesNeedingResearch(nodes);
  if (needsResearch.length === 0) return nodes;

  const picks = await Promise.all(
    needsResearch.map(async (node) => ({
      id: node.id,
      pick: await researchFn(node),
    }))
  );

  const pickMap = new Map(picks.map((p) => [p.id, p.pick]));

  return nodes.map((node) => {
    const pick = pickMap.get(node.id);
    return pick ? applyTechnologyPickToNode(node, pick) : node;
  });
}
