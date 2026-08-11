"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, Trash2, FolderOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStackyStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeploymentsPanel() {
  const router = useRouter();
  const deployments = useStackyStore((s) => s.deployments);
  const activeDeploymentId = useStackyStore((s) => s.activeDeploymentId);
  const loadDeployment = useStackyStore((s) => s.loadDeployment);
  const deleteDeployment = useStackyStore((s) => s.deleteDeployment);
  const [open, setOpen] = useState(false);

  if (deployments.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => setOpen(!open)}
      >
        <History className="size-3.5" />
        Deployments
        <span className="rounded-full bg-white/10 px-1.5 text-[10px]">
          {deployments.length}
        </span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-xl border border-white/10 bg-background/95 p-2 shadow-xl backdrop-blur-xl">
            <p className="px-2 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              Past deployments
            </p>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {deployments.map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    "group flex items-start gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/5",
                    d.id === activeDeploymentId && "bg-white/5"
                  )}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      loadDeployment(d.id);
                      setOpen(false);
                      router.push("/graph");
                    }}
                  >
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {d.context.industry ? `${d.context.industry} · ` : ""}
                      {formatDate(d.updatedAt)}
                      {d.nodes.length > 0 && ` · ${d.nodes.length} nodes`}
                    </p>
                  </button>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        loadDeployment(d.id);
                        setOpen(false);
                        router.push("/graph");
                      }}
                    >
                      <FolderOpen className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteDeployment(d.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
