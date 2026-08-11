import { NextResponse } from "next/server";
import type { ProjectContext } from "@/lib/types";
import { llmGenerateGraph, isLLMConfigured, extractApiKey } from "@/lib/ai/server";
import { layoutGraph } from "@/lib/layout-graph";

export async function POST(req: Request) {
  const { context } = (await req.json()) as { context: ProjectContext };
  const apiKey = extractApiKey(req);

  if (!isLLMConfigured(apiKey)) {
    return NextResponse.json(
      {
        error: "OpenAI API key required. Add your key to research real vendors and products.",
        code: "API_KEY_REQUIRED",
      },
      { status: 403 }
    );
  }

  try {
    const { nodes, integrations, implementationPartners } = await llmGenerateGraph(context, apiKey);
    return NextResponse.json({
      nodes: layoutGraph(nodes, context.intent),
      integrations,
      implementationPartners,
      source: "llm",
    });
  } catch (err) {
    console.error("LLM graph error:", err);
    return NextResponse.json(
      {
        error: "Failed to research vendors and build architecture. Check your API key and try again.",
        code: "GRAPH_GENERATION_FAILED",
      },
      { status: 500 }
    );
  }
}
