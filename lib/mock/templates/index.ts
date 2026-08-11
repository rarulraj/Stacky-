import type { ProjectContext, TemplateId } from "@/lib/types";

export function matchTemplate(idea: string): TemplateId {
  const lower = idea.toLowerCase();

  if (/construction|jobsite|jobsite|procore|field ops|contractor/i.test(lower)) {
    return "generic-platform";
  }
  if (/industrial|manufacturing|factory|mes|smart factory/i.test(lower)) {
    return "industrial-ai-platform";
  }
  if (/tdengine|tsdb|historian|time.?series|scada/i.test(lower)) {
    return "tdengine-deployment";
  }
  if (/warehouse|autonomous|drone|logistics|fleet|asset track/i.test(lower)) {
    return "autonomous-warehouse";
  }
  if (/building|bms|hvac|automation|smart building/i.test(lower)) {
    return "generic-platform";
  }
  if (/oil|gas|energy|utility|utilities|grid|mining|water/i.test(lower)) {
    return "generic-platform";
  }
  return "generic-platform";
}

export function getTemplateVars(ctx: ProjectContext): Record<string, string> {
  return {
    industry: ctx.industry ?? "industrial",
    deployment: ctx.deployment ?? "hybrid",
    scale: ctx.scale ?? "medium",
    facilities: ctx.facilities ?? "multiple",
    budget: ctx.budget ?? "mid-range",
    idea: ctx.idea,
  };
}
