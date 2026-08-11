import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { emptyMemory, type EmailMemory } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

function memoryKey(email: string): string {
  return `stacky:memory:${email}`;
}

function fileKey(email: string): string {
  const hash = createHash("sha256").update(email).digest("hex").slice(0, 24);
  return `${hash}.json`;
}

function localDir(): string {
  return process.env.STACKY_MEMORY_DIR?.trim() || path.join(process.cwd(), ".data", "memories");
}

function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

async function upstashCommand(command: unknown[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Upstash command failed (${res.status})`);
  }
  const data = (await res.json()) as { result?: unknown };
  return data.result ?? null;
}

async function upstashGet(email: string): Promise<EmailMemory | null> {
  try {
    const result = await upstashCommand(["GET", memoryKey(email)]);
    if (typeof result !== "string" || !result) return null;
    return JSON.parse(result) as EmailMemory;
  } catch {
    return null;
  }
}

async function upstashSet(memory: EmailMemory): Promise<void> {
  await upstashCommand(["SET", memoryKey(memory.email), JSON.stringify(memory)]);
}

async function fileGet(email: string): Promise<EmailMemory | null> {
  const file = path.join(localDir(), fileKey(email));
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as EmailMemory;
  } catch {
    return null;
  }
}

async function fileSet(memory: EmailMemory): Promise<void> {
  const dir = localDir();
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, fileKey(memory.email));
  await fs.writeFile(file, JSON.stringify(memory, null, 2), "utf8");
}

/** Strip heavy attachment payloads before persisting */
export function sanitizeMemory(memory: EmailMemory): EmailMemory {
  const scrubContext = (ctx: EmailMemory["context"]) => ({
    ...ctx,
    attachments: ctx.attachments?.map((a) =>
      a.type === "image" ? { ...a, content: "" } : a
    ),
  });

  return {
    ...memory,
    email: memory.email.trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
    notes: (memory.notes ?? []).slice(-50),
    context: scrubContext(memory.context),
    deployments: (memory.deployments ?? []).slice(0, 20).map((d) => ({
      ...d,
      context: scrubContext(d.context),
    })),
  };
}

export async function readEmailMemory(email: string): Promise<EmailMemory | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (upstashConfigured()) {
    return upstashGet(normalized);
  }
  return fileGet(normalized);
}

export async function writeEmailMemory(memory: EmailMemory): Promise<EmailMemory> {
  const normalized = normalizeEmail(memory.email);
  if (!normalized) throw new Error("Invalid email");

  const next = sanitizeMemory({ ...memory, email: normalized });

  if (upstashConfigured()) {
    await upstashSet(next);
  } else {
    await fileSet(next);
  }
  return next;
}

export async function appendMemoryNote(
  email: string,
  note: string
): Promise<EmailMemory> {
  const existing = (await readEmailMemory(email)) ?? emptyMemory(email);
  const trimmed = note.trim();
  if (trimmed) {
    existing.notes = [...existing.notes.filter((n) => n !== trimmed), trimmed].slice(
      -50
    );
  }
  return writeEmailMemory(existing);
}

export function memoryBackendLabel(): "upstash" | "filesystem" {
  return upstashConfigured() ? "upstash" : "filesystem";
}
