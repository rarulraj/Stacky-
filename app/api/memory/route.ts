import { NextResponse } from "next/server";
import {
  memoryBackendLabel,
  normalizeEmail,
  readEmailMemory,
  writeEmailMemory,
} from "@/lib/memory/backend";
import { emptyMemory, type EmailMemory } from "@/lib/memory/types";

export async function GET(req: Request) {
  const email = normalizeEmail(
    new URL(req.url).searchParams.get("email") ?? ""
  );
  if (!email) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const memory = (await readEmailMemory(email)) ?? emptyMemory(email);
  return NextResponse.json({
    memory,
    backend: memoryBackendLabel(),
    hasBlueprint: memory.nodes.length > 0 || memory.deployments.length > 0,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<EmailMemory> & {
    email?: string;
    note?: string;
  };

  const email = normalizeEmail(body.email ?? "");
  if (!email) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const existing = (await readEmailMemory(email)) ?? emptyMemory(email);

  const notes = [...(existing.notes ?? [])];
  if (body.note?.trim()) {
    const n = body.note.trim();
    if (!notes.includes(n)) notes.push(n);
  }
  if (Array.isArray(body.notes)) {
    for (const n of body.notes) {
      if (typeof n === "string" && n.trim() && !notes.includes(n.trim())) {
        notes.push(n.trim());
      }
    }
  }

  const merged: EmailMemory = {
    ...existing,
    ...body,
    email,
    notes: notes.slice(-50),
    context: body.context ?? existing.context,
    messages: body.messages ?? existing.messages,
    nodes: body.nodes ?? existing.nodes,
    integrations: body.integrations ?? existing.integrations,
    implementationPartners:
      body.implementationPartners ?? existing.implementationPartners,
    deployments: body.deployments ?? existing.deployments,
    activeDeploymentId:
      body.activeDeploymentId !== undefined
        ? body.activeDeploymentId
        : existing.activeDeploymentId,
    outreachProfile: body.outreachProfile ?? existing.outreachProfile,
  };

  const memory = await writeEmailMemory(merged);
  return NextResponse.json({
    memory,
    backend: memoryBackendLabel(),
    ok: true,
  });
}
