"use client";

import { cn } from "@/lib/utils";
import type { IntakeMode } from "@/lib/types";

type IntakeModeToggleProps = {
  value: IntakeMode;
  onChange: (mode: IntakeMode) => void;
  className?: string;
};

export function IntakeModeToggle({ value, onChange, className }: IntakeModeToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("guided")}
        className={cn(
          "rounded-lg px-4 py-2 text-sm transition-colors",
          value === "guided"
            ? "bg-orange-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Scenario-first
      </button>
      <button
        type="button"
        onClick={() => onChange("natural")}
        className={cn(
          "rounded-lg px-4 py-2 text-sm transition-colors",
          value === "natural"
            ? "bg-orange-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Natural language
      </button>
    </div>
  );
}
