import { NextResponse } from "next/server";
import type { OutreachProfile, ProjectContext } from "@/lib/types";
import { sendOutreachEmail, isLLMConfigured, extractApiKey } from "@/lib/ai/server";

export async function POST(req: Request) {
  const { context, profile, contact } = (await req.json()) as {
    context: ProjectContext;
    profile: OutreachProfile;
    contact: {
      vendorName: string;
      vendorEmail: string;
      product?: string;
      role?: string;
      nodeLabel: string;
      vendorDescription?: string;
    };
  };

  const apiKey = extractApiKey(req);

  if (!isLLMConfigured(apiKey)) {
    return NextResponse.json(
      { error: "OpenAI API key required to draft outreach emails.", code: "API_KEY_REQUIRED" },
      { status: 403 }
    );
  }

  if (!profile.email?.trim() || !profile.name?.trim()) {
    return NextResponse.json(
      { error: "Add your name and email in Outreach settings first.", code: "PROFILE_REQUIRED" },
      { status: 400 }
    );
  }

  if (!contact.vendorEmail?.trim()) {
    return NextResponse.json(
      { error: "This vendor has no email address on file.", code: "NO_VENDOR_EMAIL" },
      { status: 400 }
    );
  }

  try {
    const result = await sendOutreachEmail(context, profile, contact, apiKey);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Outreach send error:", err);
    return NextResponse.json(
      { error: "Failed to draft outreach email.", code: "OUTREACH_FAILED" },
      { status: 500 }
    );
  }
}
