import type { UploadedFile } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 50000;

async function readTextFile(file: File): Promise<string> {
  const text = await file.text();
  return text.slice(0, MAX_TEXT_LENGTH);
}

async function readPdfFile(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");

  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text);
    if (pages.join("\n").length > MAX_TEXT_LENGTH) break;
  }

  return pages.join("\n\n").slice(0, MAX_TEXT_LENGTH);
}

async function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getFileType(file: File): UploadedFile["type"] | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (file.type.startsWith("image/")) return "image";
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "txt" || file.type === "text/plain") return "txt";
  return null;
}

export async function parseUploadedFile(file: File): Promise<UploadedFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name} exceeds 10MB limit`);
  }

  const type = getFileType(file);
  if (!type) {
    throw new Error(`${file.name}: unsupported type. Use PDF, MD, TXT, or images.`);
  }

  let content = "";

  if (type === "pdf") {
    content = await readPdfFile(file);
  } else if (type === "image") {
    content = await readImageFile(file);
  } else {
    content = await readTextFile(file);
  }

  return {
    id: crypto.randomUUID(),
    name: file.name,
    type,
    content,
    mimeType: file.type,
    size: file.size,
  };
}

export const ACCEPTED_FILE_TYPES =
  ".pdf,.md,.markdown,.txt,image/png,image/jpeg,image/webp,image/gif";
