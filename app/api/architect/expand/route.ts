import { NextResponse } from "next/server";
import type { Integration, ProjectContext, StackyNode } from "@/lib/types";
import { llmExpandNode, isLLMConfigured, extractApiKey } from "@/lib/ai/server";
import { buildIntegrationsFromNodes } from "@/lib/graph/integrations-from-nodes";
import { layoutGraph } from "@/lib/layout-graph";

export async function POST(req: Request) {
  const { context, node, existingNodes, integrations: existingIntegrations = [] } =
    (await req.json()) as {
      context: ProjectContext;
      node: StackyNode;
      existingNodes: StackyNode[];
      integrations?: Integration[];
    };
  const apiKey = extractApiKey(req);

  if (!isLLMConfigured(apiKey)) {
    return NextResponse.json(
      { error: "API key required to expand with real technologies.", code: "API_KEY_REQUIRED" },
      { status: 403 }
    );
  }

  try {
    const existingChildren = existingNodes.filter((n) => n.parentId === node.id);

    // Children already generated — reveal them without re-calling the LLM
    if (existingChildren.length > 0) {
      const updated = existingNodes.map((n) =>
        n.id === node.id ? { ...n, expanded: true, collapsed: false } : n
      );
      const integrations =
        existingIntegrations.length > 0
          ? existingIntegrations
          : buildIntegrationsFromNodes(updated);
      return NextResponse.json({
        nodes: layoutGraph(updated, context.intent),
        integrations,
        source: "llm",
      });
    }

    const { nodes, integrations } = await llmExpandNode(
      context,
      node,
      existingNodes,
      existingIntegrations,
      apiKey
    );
    return NextResponse.json({
      nodes: layoutGraph(nodes, context.intent),
      integrations,
      source: "llm",
    });
  } catch (err) {
    console.error("LLM expand error:", err);
    return NextResponse.json(
      { error: "Failed to expand component with vendor research.", code: "EXPAND_FAILED" },
      { status: 500 }
    );
  }
}
