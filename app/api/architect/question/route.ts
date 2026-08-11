import { NextResponse } from "next/server";
import type { ProjectContext } from "@/lib/types";
import { llmGetNextQuestion, isLLMConfigured, extractApiKey } from "@/lib/ai/server";
import { getNextQuestion, getAnsweredFields } from "@/lib/mock/question-flow";

export async function POST(req: Request) {
  const { context } = (await req.json()) as { context: ProjectContext };
  const apiKey = extractApiKey(req);

  if (context.intakeMode === "natural") {
    return NextResponse.json({ done: true, question: null, source: "natural" });
  }

  if (isLLMConfigured(apiKey)) {
    try {
      const result = await llmGetNextQuestion(context, apiKey);
      if (result.question) {
        const alreadyAnswered = Boolean(context[result.question.id]);
        if (alreadyAnswered) {
          const question = getNextQuestion(context);
          return NextResponse.json({
            done: question === null,
            question,
            source: "mock-fallback",
          });
        }
      }
      return NextResponse.json({ ...result, source: "llm" });
    } catch (err) {
      console.error("LLM question error:", err);
    }
  }

  const question = getNextQuestion(context);
  return NextResponse.json({
    done: question === null,
    question,
    source: "mock",
    answeredFields: getAnsweredFields(context),
  });
}
