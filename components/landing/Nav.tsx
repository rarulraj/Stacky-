"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StackyMascot } from "@/components/brand/StackyMascot";
import { ApiKeyDevBanner, ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { API_KEY_CHANGE_EVENT } from "@/lib/ai/api-key";
import { checkLLMStatus } from "@/lib/ai/client";
import { useStackyStore } from "@/lib/store";

export function Nav() {
  const [aiActive, setAiActive] = useState(false);
  const userEmail = useStackyStore((s) => s.userEmail);

  useEffect(() => {
    const refresh = () => checkLLMStatus().then((r) => setAiActive(r.configured));
    refresh();
    window.addEventListener(API_KEY_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(API_KEY_CHANGE_EVENT, refresh);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-white/8 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <StackyMascot size={24} />
          <span className="text-sm font-semibold tracking-tight">Stacky</span>
          {aiActive && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
              AI
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          {userEmail && (
            <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground sm:inline">
              {userEmail}
            </span>
          )}
          <ApiKeySettings />
        </div>
      </div>
      <ApiKeyDevBanner embedded />
    </header>
  );
}
