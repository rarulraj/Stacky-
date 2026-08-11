import type { NodeDetail } from "@/lib/types";

export function fillDetail(
  detail: NodeDetail,
  vars: Record<string, string>
): NodeDetail {
  const fill = (text: string) =>
    Object.entries(vars).reduce(
      (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
      text
    );

  return {
    ...detail,
    overview: fill(detail.overview),
    purpose: fill(detail.purpose),
    notes: fill(detail.notes),
    costEstimate: {
      range: fill(detail.costEstimate.range),
      notes: fill(detail.costEstimate.notes),
    },
    futureRecommendations: detail.futureRecommendations.map(fill),
  };
}

export const defaultVars = {
  industry: "industrial",
  deployment: "hybrid",
  scale: "medium",
  facilities: "multiple",
  budget: "mid-range",
};
