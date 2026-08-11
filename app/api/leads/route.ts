import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadBody = {
  email?: string;
  idea?: string;
  historian?: string;
  source?: string;
};

/**
 * Capture a user's email (no account). Optionally notify the owner via Resend
 * and/or a webhook so leads land in your inbox.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as LeadBody;
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const payload = {
    email,
    idea: body.idea?.slice(0, 500) ?? "",
    historian: body.historian ?? "",
    source: body.source ?? "stacky",
    at: new Date().toISOString(),
  };

  console.info("[stacky-lead]", JSON.stringify(payload));

  const webhook = process.env.STACKY_LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[stacky-lead] webhook failed", err);
    }
  }

  const ownerEmail = process.env.STACKY_OWNER_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Stacky <onboarding@resend.dev>";

  if (ownerEmail && resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [ownerEmail],
          subject: `Stacky lead: ${email}`,
          text: [
            `New Stacky user (no account — email only)`,
            ``,
            `Email: ${email}`,
            payload.historian ? `Historian focus: ${payload.historian}` : null,
            payload.idea ? `Idea: ${payload.idea}` : null,
            `When: ${payload.at}`,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
    } catch (err) {
      console.error("[stacky-lead] owner notify failed", err);
    }
  }

  return NextResponse.json({ ok: true, email });
}
