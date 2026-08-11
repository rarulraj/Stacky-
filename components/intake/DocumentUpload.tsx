"use client";

import { useCallback, useRef, useState } from "react";
import {
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  FileType,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/lib/types";
import { ACCEPTED_FILE_TYPES, parseUploadedFile } from "@/lib/files/parse-upload";

type DocumentUploadProps = {
  pastedText: string;
  attachments: UploadedFile[];
  onPastedTextChange: (value: string) => void;
  onAttachmentsChange: (files: UploadedFile[]) => void;
  className?: string;
  collapsed?: boolean;
};

function FileIcon({ type }: { type: UploadedFile["type"] }) {
  if (type === "image") return <ImageIcon className="size-4 text-amber-400" />;
  if (type === "pdf") return <FileType className="size-4 text-orange-400" />;
  return <FileText className="size-4 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUpload({
  pastedText,
  attachments,
  onPastedTextChange,
  onAttachmentsChange,
  className,
  collapsed: initialCollapsed = true,
}: DocumentUploadProps) {
  const [open, setOpen] = useState(!initialCollapsed);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalFiles = attachments.length;
  const charCount = pastedText.length;

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setLoading(true);
      setError(null);
      const newFiles: UploadedFile[] = [];

      try {
        for (const file of Array.from(fileList)) {
          const parsed = await parseUploadedFile(file);
          newFiles.push(parsed);
        }
        onAttachmentsChange([...attachments, ...newFiles]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      } finally {
        setLoading(false);
      }
    },
    [attachments, onAttachmentsChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const removeFile = (id: string) => {
    onAttachmentsChange(attachments.filter((f) => f.id !== id));
  };

  return (
    <div className={cn("rounded-xl border border-white/8 bg-white/[0.02]", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Documents & files</span>
          {(totalFiles > 0 || charCount > 0) && (
            <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] text-orange-300">
              {totalFiles > 0 && `${totalFiles} file${totalFiles !== 1 ? "s" : ""}`}
              {totalFiles > 0 && charCount > 0 && " · "}
              {charCount > 0 && `${charCount.toLocaleString()} chars`}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/8 px-4 pb-4 pt-3">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 transition-colors",
              dragging
                ? "border-orange-500/60 bg-orange-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-orange-500/30 hover:bg-orange-500/5"
            )}
          >
            {loading ? (
              <Loader2 className="size-8 animate-spin text-orange-400" />
            ) : (
              <Upload className="mb-2 size-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, Markdown (.md), TXT, PNG, JPG, WebP — up to 10MB
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) processFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Uploaded files */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/5 p-3"
                >
                  {file.type === "image" && file.content ? (
                    <img
                      src={file.content}
                      alt={file.name}
                      className="size-10 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/5">
                      <FileIcon type={file.type} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {file.type} · {formatSize(file.size)}
                      {file.type !== "image" && file.content && (
                        <> · {file.content.length.toLocaleString()} chars extracted</>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Paste area */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Or paste text directly
            </p>
            <textarea
              value={pastedText}
              onChange={(e) => onPastedTextChange(e.target.value)}
              placeholder="Paste RFPs, requirements, specs, or notes…"
              className="h-28 w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:border-orange-500/30 focus:outline-none"
            />
            {charCount > 0 && (
              <div className="mt-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onPastedTextChange("")}
                  className="text-muted-foreground"
                >
                  <X className="size-3" />
                  Clear text
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
