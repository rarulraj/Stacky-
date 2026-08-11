import OpenAI from "openai";
import type { Integration, ImplementationPartner, OutreachProfile, OutreachSendResult, ProjectContext, StackyNode, TechnologyPick } from "@/lib/types";
import {
  buildAlternativePrompt,
  buildExpandPrompt,
  buildGraphPrompt,
  buildOutreachEmailPrompt,
  buildQuestionPrompt,
  buildResearchTechnologyPrompt,
  llmNodesToStackyNodes,
  parseGraphResponse,
  SYSTEM_PROMPT,
  type AlternativeResponse,
  type QuestionResponse,
} from "./prompts";
import { enrichNodesWithTechnologies, applyTechnologyPickToNode } from "./enrich";
import { mergeIntegrations } from "@/lib/graph/integrations-from-nodes";
import { extractProjectRequirements } from "./requirements";
import {
  getResearchModel,
  isWebResearchEnabled,
} from "./web-research";

function createClient(apiKey?: string): OpenAI | null {
  const key = apiKey?.trim() || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

async function chatJSON<T>(
  prompt: string,
  apiKey?: string,
  temperature = 0.5
): Promise<T> {
  const client = createClient(apiKey);
  if (!client) throw new Error("NO_LLM");

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");
  return JSON.parse(content) as T;
}

async function chatJSONWithWebResearch<T>(
  prompt: string,
  apiKey?: string,
  temperature = 0.45
): Promise<T> {
  const client = createClient(apiKey);
  if (!client) throw new Error("NO_LLM");

  if (!isWebResearchEnabled()) {
    return chatJSON<T>(prompt, apiKey, temperature);
  }

  try {
    const response = await client.responses.create({
      model: getResearchModel(),
      tools: [{ type: "web_search", search_context_size: "high" }],
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      text: { format: { type: "json_object" } },
      temperature,
    });

    const content = response.output_text;
    if (!content) throw new Error("Empty LLM response");
    return JSON.parse(content) as T;
  } catch (error) {
    console.warn(
      "[stacky] Web research failed, falling back to chat completions:",
      error instanceof Error ? error.message : error
    );
    return chatJSON<T>(prompt, apiKey, temperature);
  }
}

export function isLLMConfigured(apiKey?: string): boolean {
  return Boolean(apiKey?.trim() || process.env.OPENAI_API_KEY);
}

export function isWebResearchConfigured(): boolean {
  return isWebResearchEnabled();
}

export function getApiKeySource(apiKey?: string): "env" | "browser" | null {
  if (process.env.OPENAI_API_KEY) return "env";
  if (apiKey?.trim()) return "browser";
  return null;
}

export async function llmGetNextQuestion(
  ctx: ProjectContext,
  apiKey?: string
): Promise<QuestionResponse> {
  return chatJSON<QuestionResponse>(buildQuestionPrompt(ctx), apiKey, 0.6);
}

export async function llmResearchTechnology(
  ctx: ProjectContext,
  node: StackyNode,
  siblingPicks: string[],
  apiKey?: string
): Promise<TechnologyPick> {
  const result = await chatJSONWithWebResearch<{ technologyPick: TechnologyPick }>(
    buildResearchTechnologyPrompt(ctx, node, siblingPicks),
    apiKey,
    0.35
  );
  return result.technologyPick;
}

async function enforceMandatoryPicks(
  ctx: ProjectContext,
  nodes: StackyNode[],
  apiKey?: string
): Promise<StackyNode[]> {
  const req = extractProjectRequirements(ctx);
  if (!req.wantsTDengine || req.mandatoryProducts.length === 0) return nodes;

  const hasMandatory = req.mandatoryProducts.every((product) =>
    nodes.some((n) =>
      n.detail.technologyPick?.product.toLowerCase().includes(product.toLowerCase())
    )
  );
  if (hasMandatory) return nodes;

  const historianNode =
    nodes.find(
      (n) =>
        n.depth === 1 &&
        /data platform|historian|time.?series|operational data/i.test(n.label)
    ) ?? nodes.find((n) => n.depth === 1 && /data|historian|analytics/i.test(n.label));

  if (!historianNode) return nodes;

  const pick = await llmResearchTechnology(
    ctx,
    {
      ...historianNode,
      detail: {
        ...historianNode.detail,
        purpose: `${historianNode.detail.purpose} Must use TDengine Enterprise as the IA-level industrial data historian.`,
      },
    },
    nodes
      .filter((n) => n.id !== historianNode.id && n.detail.technologyPick)
      .map((n) => n.detail.technologyPick!.product),
    apiKey
  );

  return nodes.map((n) =>
    n.id === historianNode.id ? applyTechnologyPickToNode(n, pick) : n
  );
}

async function enrichGraph(
  ctx: ProjectContext,
  nodes: StackyNode[],
  apiKey?: string
): Promise<StackyNode[]> {
  return enrichNodesWithTechnologies(ctx, nodes, async (node) => {
    const siblingPicks = nodes
      .filter((n) => n.id !== node.id && n.detail.technologyPick)
      .map((n) => n.detail.technologyPick!.product);
    return llmResearchTechnology(ctx, node, siblingPicks, apiKey);
  });
}

export async function llmGenerateGraph(
  ctx: ProjectContext,
  apiKey?: string
): Promise<{
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners: ImplementationPartner[];
}> {
  const result = await chatJSONWithWebResearch<{
    nodes: StackyNode[];
    integrations?: Integration[];
    implementationPartners?: ImplementationPartner[];
  }>(buildGraphPrompt(ctx), apiKey, 0.45);

  const parsed = parseGraphResponse(result);
  if (ctx.intent === "architecture") {
    return {
      nodes: parsed.nodes,
      integrations: parsed.integrations,
      implementationPartners: [],
    };
  }
  const enriched = await enrichGraph(ctx, parsed.nodes, apiKey);
  const withMandatory = await enforceMandatoryPicks(ctx, enriched, apiKey);
  return {
    nodes: withMandatory,
    integrations: parsed.integrations,
    implementationPartners: parsed.implementationPartners,
  };
}

export async function llmExpandNode(
  ctx: ProjectContext,
  node: StackyNode,
  existingNodes: StackyNode[],
  existingIntegrations: Integration[] = [],
  apiKey?: string
): Promise<{ nodes: StackyNode[]; integrations: Integration[] }> {
  const siblingLabels = existingNodes
    .filter((n) => n.parentId === node.parentId && n.id !== node.id)
    .map((n) => n.label);

  const prompt = buildExpandPrompt(ctx, node, siblingLabels);

  const result = await chatJSONWithWebResearch<{
    nodes: StackyNode[];
    integrations?: Integration[];
  }>(prompt, apiKey, 0.45);

  const expanded = llmNodesToStackyNodes(
    result.nodes.map((n) => ({
      ...n,
      parentId: n.parentId ?? node.id,
      depth: node.depth + 1,
    })),
    result.integrations ?? [],
    existingNodes.map((n) =>
      n.id === node.id ? { ...n, expanded: true, collapsed: false } : n
    )
  );

  const integrations = mergeIntegrations(
    existingIntegrations,
    expanded.integrations
  );

  if (ctx.intent === "architecture") {
    return { nodes: expanded.nodes, integrations };
  }

  const enriched = await enrichGraph(ctx, expanded.nodes, apiKey);
  return { nodes: enriched, integrations };
}

export async function llmFindAlternative(
  ctx: ProjectContext,
  node: StackyNode,
  currentPick: TechnologyPick,
  reason: string,
  rejectedProducts: string[],
  apiKey?: string
): Promise<AlternativeResponse> {
  return chatJSONWithWebResearch<AlternativeResponse>(
    buildAlternativePrompt(ctx, node, currentPick, reason, rejectedProducts),
    apiKey,
    0.4
  );
}

export async function llmDraftOutreachEmail(
  ctx: ProjectContext,
  profile: OutreachProfile,
  contact: {
    vendorName: string;
    product?: string;
    role?: string;
    nodeLabel: string;
    vendorDescription?: string;
  },
  apiKey?: string
): Promise<{ subject: string; body: string }> {
  return chatJSON<{ subject: string; body: string }>(
    buildOutreachEmailPrompt(ctx, profile, contact),
    apiKey,
    0.5
  );
}

async function sendViaResend(
  to: string,
  subject: string,
  body: string,
  profile: OutreachProfile
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Stacky <onboarding@resend.dev>";
  if (!apiKey) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: profile.email,
      subject,
      text: body,
    }),
  });

  return res.ok;
}

export async function sendOutreachEmail(
  ctx: ProjectContext,
  profile: OutreachProfile,
  contact: {
    vendorName: string;
    vendorEmail: string;
    product?: string;
    role?: string;
    nodeLabel: string;
    vendorDescription?: string;
  },
  apiKey?: string
): Promise<OutreachSendResult> {
  const { subject, body } = await llmDraftOutreachEmail(
    ctx,
    profile,
    contact,
    apiKey
  );

  const mailtoUrl = `mailto:${encodeURIComponent(contact.vendorEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const sent = await sendViaResend(contact.vendorEmail, subject, body, profile);

  return {
    sent,
    subject,
    body,
    mailtoUrl,
    message: sent
      ? `Email sent to ${contact.vendorName} from Stacky. They can reply to ${profile.email}.`
      : `Email drafted for ${contact.vendorName}. Open your mail app to send, or add RESEND_API_KEY to send automatically.`,
  };
}

export function extractApiKey(req: Request): string | undefined {
  return req.headers.get("x-stacky-api-key") ?? undefined;
}
