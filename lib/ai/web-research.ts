import type { ProjectContext, StackyNode } from "@/lib/types";
import { extractProjectRequirements } from "./requirements";

const CURRENT_YEAR = new Date().getFullYear();

export function isWebResearchEnabled(): boolean {
  return process.env.OPENAI_WEB_SEARCH !== "false";
}

export function getResearchModel(): string {
  return (
    process.env.OPENAI_RESEARCH_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o"
  );
}

export function webResearchInstructions(ctx: ProjectContext): string {
  const industry = ctx.industry ?? "industrial";
  const deployment = ctx.deployment ?? "hybrid cloud/on-prem";
  const scale = ctx.scale ?? "enterprise";
  const req = extractProjectRequirements(ctx);

  const extraQueries =
    req.architecturePattern === "historian"
      ? `
6. "TDengine enterprise reference deployment ${CURRENT_YEAR}"
7. "industrial historian architecture MQTT Kafka TDengine ${CURRENT_YEAR}"
8. "IA industrial analytics data platform case study ${CURRENT_YEAR}"`
      : "";

  return `
WEB RESEARCH REQUIRED — search the web before selecting any product:
1. "${industry} industrial software architecture trends ${CURRENT_YEAR}"
2. "best ${industry} OT IT integration platforms ${CURRENT_YEAR}"
3. "${deployment} ${scale} industrial IoT data platform vendors ${CURRENT_YEAR}"
4. For each product you pick: verify the current version, that it is actively sold (not EOL), and find a real sales contact page or email
5. Prefer vendors gaining market share in ${CURRENT_YEAR - 1}–${CURRENT_YEAR}; avoid deprecated or legacy-only stacks unless the user requires them (${ctx.existingSystems ?? "none specified"})${extraQueries}

Today's date: ${new Date().toISOString().slice(0, 10)}. Model this after real production deployments found via web search — not generic training-data defaults.`;
}

export function webResearchForComponent(
  ctx: ProjectContext,
  node: StackyNode
): string {
  const industry = ctx.industry ?? "industrial";

  return `
WEB RESEARCH REQUIRED for "${node.label}":
1. "${node.label} ${industry} software vendors ${CURRENT_YEAR}"
2. "${node.label} commercial product comparison ${CURRENT_YEAR} ${ctx.deployment ?? ""}"
3. Verify current product version, pricing model, and vendor sales contact page
4. Check recent release notes or news — prefer actively maintained products`;
}
