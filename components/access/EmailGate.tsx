"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { StackyMascot } from "@/components/brand/StackyMascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getStoredUserEmail,
  isValidEmail,
  setStoredUserEmail,
} from "@/lib/access/email";
import { useStackyStore } from "@/lib/store";

type EmailGateProps = {
  open: boolean;
  onComplete: (email: string) => void;
  onCancel?: () => void;
  idea?: string;
  historian?: string;
};

export function EmailGate({
  open,
  onComplete,
  onCancel,
  idea,
  historian,
}: EmailGateProps) {
  const setUserEmail = useStackyStore((s) => s.setUserEmail);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const existing = getStoredUserEmail();
    if (existing) setEmail(existing);
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!isValidEmail(email)) {
      setError("Enter a valid work email");
      return;
    }
    setSubmitting(true);
    setError(null);
    const normalized = email.trim().toLowerCase();

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          idea,
          historian,
          source: "email-gate",
        }),
      });
    } catch {
      // Still let them through — lead capture is best-effort
    }

    setStoredUserEmail(normalized);
    setUserEmail(normalized);
    setSubmitting(false);
    onComplete(normalized);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1917] p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <StackyMascot size={40} />
          <div>
            <h2 className="text-lg font-semibold">Start planning</h2>
            <p className="text-xs text-muted-foreground">
              No account needed — just your email to continue
            </p>
          </div>
        </div>

        <label className="mb-1.5 block text-sm text-muted-foreground">
          Work email
        </label>
        <div className="relative mb-2">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            placeholder="you@company.com"
            className="pl-10"
          />
        </div>
        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
        <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
          We use this to share your blueprint link context and follow up — no
          password, no signup flow.
        </p>

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="ghost" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            className="flex-1 bg-orange-600 hover:bg-orange-500"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Continuing…" : "Continue to Stacky"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Session email only (memory) — never browser storage */
export function ensureUserEmail(): string | null {
  return (
    getStoredUserEmail() ?? useStackyStore.getState().userEmail ?? null
  );
}
