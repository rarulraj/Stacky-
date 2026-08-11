import { NextResponse } from "next/server";
import type { ProjectContext, StackyNode, TechnologyPick } from "@/lib/types";
import { llmFindAlternative, isLLMConfigured, extractApiKey } from "@/lib/ai/server";
import {
  applyTechnologyPick,
  findAlternativeTechnology,
} from "@/lib/mock/alternatives";

export async function POST(req: Request) {
  const { context, node, currentPick, reason, rejectedProducts } =
    (await req.json()) as {
      context: ProjectContext;
      node: StackyNode;
      currentPick: TechnologyPick;
      reason: string;
      rejectedProducts?: string[];
    };

  const rejected = rejectedProducts ?? [currentPick.product];
  const apiKey = extractApiKey(req);

  if (isLLMConfigured(apiKey)) {
    try {
      const result = await llmFindAlternative(
        context,
        node,
        currentPick,
        reason,
        rejected,
        apiKey
      );
      const updatedNode = applyTechnologyPick(node, result.technologyPick, result.summary);
      return NextResponse.json({
        node: updatedNode,
        summary: result.summary,
        source: "llm",
      });
    } catch (err) {
      console.error("LLM alternative error:", err);
    }
  }

  const result = findAlternativeTechnology(
    node,
    currentPick,
    reason,
    context,
    rejected
  );
  const updatedNode = applyTechnologyPick(
    node,
    result.technologyPick,
    result.summary
  );

  return NextResponse.json({
    node: updatedNode,
    summary: result.summary,
    source: "mock",
  });
}
