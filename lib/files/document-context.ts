import type { ProjectContext, UploadedFile } from "@/lib/types";

export function getFullDocumentContext(ctx: ProjectContext): string {
  const parts: string[] = [];

  if (ctx.documents?.trim()) {
    parts.push(ctx.documents.trim());
  }

  ctx.attachments?.forEach((file: UploadedFile) => {
    if (file.type === "image") {
      parts.push(`[Image attached: ${file.name}]`);
      if (file.content) {
        parts.push(`Image description/context: ${file.content}`);
      }
    } else if (file.content) {
      parts.push(`--- File: ${file.name} ---\n${file.content}`);
    }
  });

  return parts.join("\n\n");
}

export function hasDocumentContext(ctx: ProjectContext): boolean {
  return (
    Boolean(ctx.documents?.trim()) ||
    Boolean(ctx.attachments?.some((a: UploadedFile) => a.content || a.type === "image"))
  );
}
