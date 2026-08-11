"use client";

import { useCallback, useEffect, useState } from "react";
import { Key, Check, ExternalLink, X, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  API_KEY_CHANGE_EVENT,
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
} from "@/lib/ai/api-key";
import { checkLLMStatus } from "@/lib/ai/client";
import { showDevApiKeyUi } from "@/lib/ai/dev-api-key-ui";
import { cn } from "@/lib/utils";

type LlmStatus = { configured: boolean; source: "env" | "browser" | null };

function useLlmStatus() {
  const [status, setStatus] = useState<LlmStatus>({
    configured: false,
    source: null,
  });

  const refresh = useCallback(async () => {
    const result = await checkLLMStatus();
    setStatus(result);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(API_KEY_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(API_KEY_CHANGE_EVENT, refresh);
  }, [refresh]);

  return { status, refresh };
}

export function ApiKeySettings() {
  if (!showDevApiKeyUi()) return null;

  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const { status, refresh } = useLlmStatus();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getStoredApiKey() ?? "");
      refresh();
    }
  }, [open, refresh]);

  const handleSave = () => {
    setStoredApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refresh();
  };

  const handleClear = () => {
    clearStoredApiKey();
    setKey("");
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={status.configured ? "ghost" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5",
              status.configured
                ? "text-muted-foreground"
                : "border-orange-500/40 text-orange-300 hover:bg-orange-500/10"
            )}
          >
            <Key className="size-3.5" />
            {status.configured ? "API Key" : "Add API Key"}
            {status.configured && (
              <span className="size-1.5 rounded-full bg-emerald-500" />
            )}
          </Button>
        }
      />
      <ApiKeyDialogContent
        status={status}
        keyValue={key}
        onKeyChange={setKey}
        onSave={handleSave}
        onClear={handleClear}
        saved={saved}
      />
    </Dialog>
  );
}

function ApiKeyDialogContent({
  status,
  keyValue,
  onKeyChange,
  onSave,
  onClear,
  saved,
}: {
  status: LlmStatus;
  keyValue: string;
  onKeyChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  saved: boolean;
}) {
  return (
    <DialogContent className="max-w-md border-white/10 bg-[#1c1917]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          OpenAI API Key
          <Badge variant="outline" className="border-amber-500/30 text-[10px] text-amber-400">
            Dev only
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Paste your key to enable live web research for architectures, current
          vendor picks, and contact points. Without a key, Stacky uses template mode.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {status.configured ? (
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              Active ({status.source === "env" ? "server .env" : "browser"})
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not configured: template mode
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Paste your OpenAI key</label>
          <Input
            type="password"
            value={keyValue}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="sk-..."
            className="font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && onSave()}
          />
          <div className="flex gap-2">
            <Button
              className="bg-orange-600 hover:bg-orange-500"
              onClick={onSave}
              disabled={!keyValue.trim()}
            >
              {saved ? (
                <>
                  <Check className="size-4" /> Saved
                </>
              ) : (
                "Save key"
              )}
            </Button>
            <Button variant="ghost" onClick={onClear}>
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Stored in your browser only. Sent to Stacky&apos;s API routes, which
            forward it to OpenAI.
          </p>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
          <p className="mb-2 text-sm font-medium">Or use server config</p>
          <ol className="list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
            <li>
              Create{" "}
              <code className="rounded bg-white/10 px-1">.env.local</code> in the
              project root
            </li>
            <li>
              Add:{" "}
              <code className="rounded bg-white/10 px-1">
                OPENAI_API_KEY=sk-your-key
              </code>
            </li>
            <li>Restart: npm run dev</li>
          </ol>
        </div>

        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-orange-400 hover:underline"
        >
          Get an API key from OpenAI
          <ExternalLink className="size-3" />
        </a>
      </div>
    </DialogContent>
  );
}

export function ApiKeyDevBanner({ embedded = false }: { embedded?: boolean }) {
  if (!showDevApiKeyUi()) return null;

  const { status, refresh } = useLlmStatus();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(false);
    setKey(getStoredApiKey() ?? "");
  }, []);

  useEffect(() => {
    if (status.configured) {
      setDismissed(true);
    }
  }, [status.configured]);

  if (dismissed || status.configured) return null;

  const handleSave = () => {
    if (!key.trim()) return;
    setStoredApiKey(key);
    setSaved(true);
    refresh();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-orange-500/10 via-amber-500/8 to-orange-500/10 px-4 py-3",
        embedded ? "border-t border-orange-500/15" : "border-b border-orange-500/20"
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20">
            <Sparkles className="size-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-orange-100">
              Enable AI mode: add your OpenAI API key
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dev preview only. Without a key, Stacky uses templates instead of
              real AI generation.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-..."
            className="h-9 w-full min-w-[200px] font-mono text-xs sm:w-56"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-500"
            onClick={handleSave}
            disabled={!key.trim()}
          >
            {saved ? <Check className="size-4" /> : "Save"}
          </Button>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs text-orange-400 hover:underline sm:inline"
          >
            Get key
          </a>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
