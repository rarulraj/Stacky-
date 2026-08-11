"use client";

import { cn } from "@/lib/utils";

type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i < current ? "w-6 bg-orange-500" : i === current ? "w-6 bg-orange-500/40" : "w-1.5 bg-white/10"
          )}
        />
      ))}
    </div>
  );
}
