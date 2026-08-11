import { NextResponse } from "next/server";
import { extractApiKey, getApiKeySource, isLLMConfigured, isWebResearchConfigured } from "@/lib/ai/server";

export async function GET(req: Request) {
  const apiKey = extractApiKey(req);
  return NextResponse.json({
    configured: isLLMConfigured(apiKey),
    source: getApiKeySource(apiKey),
    webResearch: isWebResearchConfigured(),
  });
}
