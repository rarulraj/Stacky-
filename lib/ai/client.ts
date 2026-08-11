import type { Integration, ImplementationPartner, OutreachProfile, OutreachSendResult, ProjectContext, Question, StackyNode, TechnologyPick } from "@/lib/types";
import { getApiHeaders, getApiHeadersPlain } from "@/lib/ai/api-key";
import { ApiKeyRequiredError, GraphGenerationError } from "@/lib/ai/errors";
import { applyTechnologyPick, findAlternativeTechnology } from "@/lib/mock/alternatives";
import {
  expandNode as mockExpandNode,
  generateRootGraphWithIntegrations,
} from "@/lib/mock/generate-graph";
import { generateArchitectureTemplate } from "@/lib/mock/architecture-template";
import { getNextQuestion as mockGetNextQuestion } from "@/lib/mock/question-flow";

async function parseApiError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  if (res.status === 403 && body.code === "API_KEY_REQUIRED") {
    throw new ApiKeyRequiredError();
  }
  throw new GraphGenerationError(
    body.error ?? `Request failed (${res.status})`
  );
}

function mockGraphResult(ctx: ProjectContext): {
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners: ImplementationPartner[];
  source: "mock";
} {
  if (ctx.intent === "architecture") {
    const { nodes, integrations } = generateArchitectureTemplate(ctx);
    return { nodes, integrations, implementationPartners: [], source: "mock" };
  }
  const { nodes, integrations } = generateRootGraphWithIntegrations(ctx);
  return { nodes, integrations, implementationPartners: [], source: "mock" };
}

export async function fetchNextQuestion(
  ctx: ProjectContext
): Promise<{ done: boolean; question: Question | null; source: "llm" | "mock" }> {
  try {
    const res = await fetch("/api/architect/question", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ context: ctx }),
    });
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    const q = mockGetNextQuestion(ctx);
    return { done: q === null, question: q, source: "mock" };
  }
}

export async function fetchGenerateGraph(
  ctx: ProjectContext
): Promise<{
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners: ImplementationPartner[];
  source: "llm" | "mock";
}> {
  try {
    const res = await fetch("/api/architect/graph", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ context: ctx }),
    });
    if (!res.ok) {
      // Template mode / transient LLM failures — still produce a usable blueprint
      return mockGraphResult(ctx);
    }
    return res.json();
  } catch {
    return mockGraphResult(ctx);
  }
}

export async function fetchExpandNode(
  ctx: ProjectContext,
  node: StackyNode,
  existingNodes: StackyNode[],
  integrations: Integration[] = []
): Promise<{ nodes: StackyNode[]; integrations: Integration[]; source: "llm" | "mock" }> {
  try {
    const res = await fetch("/api/architect/expand", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({ context: ctx, node, existingNodes, integrations }),
    });
    if (res.ok) return res.json();
  } catch {
    // fall through to mock
  }

  const result = mockExpandNode(node, ctx, existingNodes);
  return {
    nodes: result.nodes,
    integrations:
      result.integrations.length > 0 ? result.integrations : integrations,
    source: "mock",
  };
}

export async function fetchFindAlternative(
  ctx: ProjectContext,
  node: StackyNode,
  currentPick: TechnologyPick,
  reason: string,
  rejectedProducts: string[] = []
): Promise<{
  node: StackyNode;
  summary: string;
  source: "llm" | "mock";
}> {
  try {
    const res = await fetch("/api/architect/alternative", {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        context: ctx,
        node,
        currentPick,
        reason,
        rejectedProducts,
      }),
    });
    if (!res.ok) await parseApiError(res);
    return res.json();
  } catch (err) {
    if (err instanceof ApiKeyRequiredError) throw err;
    const result = findAlternativeTechnology(
      node,
      currentPick,
      reason,
      ctx,
      rejectedProducts
    );
    return {
      node: applyTechnologyPick(node, result.technologyPick, result.summary),
      summary: result.summary,
      source: "mock",
    };
  }
}

export async function fetchSendOutreach(
  ctx: ProjectContext,
  profile: OutreachProfile,
  contact: {
    vendorName: string;
    vendorEmail: string;
    product?: string;
    role?: string;
    nodeLabel: string;
    vendorDescription?: string;
  }
): Promise<OutreachSendResult> {
  const res = await fetch("/api/outreach/send", {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({ context: ctx, profile, contact }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function checkLLMStatus(): Promise<{
  configured: boolean;
  source: "env" | "browser" | null;
}> {
  try {
    const res = await fetch("/api/architect/status", {
      headers: getApiHeadersPlain(),
    });
    return res.json();
  } catch {
    return { configured: false, source: null };
  }
}

export { ApiKeyRequiredError, GraphGenerationError };
