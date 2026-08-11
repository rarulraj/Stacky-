"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchFindAlternative } from "@/lib/ai/client";
import { useStackyStore } from "@/lib/store";
import type { StackyNode, TechnologyPick } from "@/lib/types";

type SwapTechnologyChatProps = {
  node: StackyNode;
  pick: TechnologyPick;
};

export function SwapTechnologyChat({ node, pick }: SwapTechnologyChatProps) {
  const context = useStackyStore((s) => s.context);
  const applyNodeUpdate = useStackyStore((s) => s.applyNodeUpdate);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([pick.product]);

  const handleSubmit = async () => {
    if (!reason.trim() || loading) return;
    setLoading(true);
    setLastSummary(null);
    try {
      const { node: updatedNode, summary } = await fetchFindAlternative(
        context,
        node,
        pick,
        reason.trim(),
        rejected
      );
      applyNodeUpdate(updatedNode, { previousProduct: pick.product });
      setRejected((prev) => [...prev, pick.product]);
      setLastSummary(summary);
      setReason("");
      setOpen(false);
      updateActiveDeployment();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 border-t border-white/8 pt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-300"
        >
          <MessageSquare className="size-3.5" />
          Not this solution? Tell Stacky why
        </button>
      ) : (
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-medium text-orange-200">
            Why not {pick.product}?
          </p>
          <p className="text-[10px] text-muted-foreground">
            e.g. too expensive, already use a competitor, on-prem only, bad past
            experience…
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="We already have an EMQX license and can't add another MQTT vendor…"
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#1c1917] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-orange-500/40 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-orange-600 hover:bg-orange-500"
              disabled={!reason.trim() || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="size-3.5" />
                  Find alternative
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setOpen(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {lastSummary && (
        <p className="mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] leading-relaxed text-emerald-300/90">
          {lastSummary}
        </p>
      )}
    </div>
  );
}
