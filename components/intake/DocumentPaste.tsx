"use client";

import { useState } from "react";
import { FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocumentPasteProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  collapsed?: boolean;
};

export function DocumentPaste({
  value,
  onChange,
  className,
  collapsed: initialCollapsed = true,
}: DocumentPasteProps) {
  const [open, setOpen] = useState(!initialCollapsed);
  const charCount = value.length;

  return (
    <div className={cn("rounded-xl border border-white/8 bg-white/[0.02]", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reference documents</span>
          {charCount > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-muted-foreground">
              {charCount.toLocaleString()} chars
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
        <div className="border-t border-white/8 px-4 pb-4">
          <p className="mb-2 text-xs text-muted-foreground">
            Paste RFPs, requirements docs, specs, or notes. Stacky uses these to tailor your architecture.
          </p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your documents here...

Example:
- 8 construction sites, mobile field crews, equipment tracking
- Existing Procore + custom CMMS, need unified data platform
- Budget: $500k, hybrid cloud with edge at each site
- Integrate telematics, safety compliance, and project scheduling"
            className="h-40 w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:border-orange-500/30 focus:outline-none"
          />
          {charCount > 0 && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onChange("")}
                className="text-muted-foreground"
              >
                <X className="size-3" />
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
