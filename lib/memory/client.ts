import type { EmailMemory } from "./types";

export async function fetchEmailMemory(email: string): Promise<{
  memory: EmailMemory;
  hasBlueprint: boolean;
}> {
  const res = await fetch(`/api/memory?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error("Failed to load email memory");
  return res.json();
}

export async function saveEmailMemory(
  payload: Partial<EmailMemory> & { email: string; note?: string }
): Promise<EmailMemory> {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save email memory");
  const data = (await res.json()) as { memory: EmailMemory };
  return data.memory;
}
