"use client";

import { useState } from "react";
import {
  Download,
  Image,
  FileJson,
  FileText,
  FileCode,
  Loader2,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStackyStore } from "@/lib/store";
import {
  exportBlueprintJson,
  exportBlueprintMarkdown,
  exportDiagramPng,
  exportDiagramSvg,
} from "@/lib/export/blueprint-export";
import { exportBlueprintHtml } from "@/lib/export/blueprint-html";

export function ExportMenu() {
  const context = useStackyStore((s) => s.context);
  const nodes = useStackyStore((s) => s.nodes);
  const integrations = useStackyStore((s) => s.integrations);
  const implementationPartners = useStackyStore((s) => s.implementationPartners);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (type: "png" | "svg" | "json" | "md" | "html") => {
    setLoading(type);
    try {
      if (type === "png") await exportDiagramPng(context);
      else if (type === "svg") await exportDiagramSvg(context);
      else if (type === "json")
        exportBlueprintJson(context, nodes, integrations, implementationPartners);
      else if (type === "html")
        exportBlueprintHtml(context, nodes, integrations, implementationPartners);
      else
        exportBlueprintMarkdown(
          context,
          nodes,
          integrations,
          implementationPartners
        );
      setOpen(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Try again.");
    } finally {
      setLoading(null);
    }
  };

  if (nodes.length === 0) return null;

  const items: {
    type: "png" | "svg" | "json" | "md" | "html";
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { type: "png", label: "PNG diagram", hint: "Image of the graph", icon: Image },
    { type: "svg", label: "SVG diagram", hint: "Vector graph download", icon: FileImage },
    { type: "json", label: "JSON blueprint", hint: "Full editable data", icon: FileJson },
    { type: "html", label: "HTML report", hint: "Shareable page", icon: FileCode },
    { type: "md", label: "Markdown report", hint: "Vendors + architecture", icon: FileText },
  ];

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        className="gap-1.5"
        disabled={!!loading}
        onClick={() => setOpen((v) => !v)}
        title="Download graph and blueprint"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        Download
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close download menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1c1917] py-1 shadow-xl">
            {items.map(({ type, label, hint, icon: Icon }) => (
              <button
                key={type}
                type="button"
                disabled={!!loading}
                onClick={() => run(type)}
                className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-white/5 disabled:opacity-50"
              >
                {loading === type ? (
                  <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-orange-400" />
                ) : (
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span>
                  <span className="block text-sm text-foreground">{label}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
