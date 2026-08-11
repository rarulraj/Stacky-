"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EmailGate, ensureUserEmail } from "@/components/access/EmailGate";
import { StackyMascot } from "@/components/brand/StackyMascot";
import { DocumentUpload } from "@/components/intake/DocumentUpload";
import { IntakeModeToggle } from "@/components/intake/IntakeModeToggle";
import { HistorianPlanning } from "@/components/landing/HistorianPlanning";
import { IntentGate } from "@/components/landing/IntentGate";
import { Button } from "@/components/ui/button";
import { useStackyStore } from "@/lib/store";
import type { IntakeMode, ProjectIntent } from "@/lib/types";
import { SUGGESTIONS } from "./SuggestionChips";

export function Hero() {
  const router = useRouter();
  const setIdea = useStackyStore((s) => s.setIdea);
  const updateContext = useStackyStore((s) => s.updateContext);
  const setAttachments = useStackyStore((s) => s.setAttachments);
  const resetProject = useStackyStore((s) => s.resetProject);
  const context = useStackyStore((s) => s.context);
  const [intent, setIntent] = useState<ProjectIntent | null>(null);
  const [value, setValue] = useState("");
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("guided");
  const [pending, setPending] = useState<{
    idea: string;
    historian?: string;
  } | null>(null);

  const startBuild = (idea: string, historian?: string) => {
    if (!idea.trim() || !intent) return;
    const docs = context.documents;
    const attachments = context.attachments;
    const mode: IntakeMode =
      intent === "architecture"
        ? intakeMode
        : historian
          ? "guided"
          : intakeMode;
    resetProject();
    setIdea(idea.trim());
    updateContext({
      intent,
      intakeMode: mode,
      historianFocus: historian,
      ...(mode === "natural" ? { naturalNotes: idea.trim() } : {}),
    });
    if (docs) updateContext({ documents: docs });
    if (attachments?.length) setAttachments(attachments);
    router.push("/build");
  };

  const submit = (idea: string, historian?: string) => {
    if (!idea.trim()) return;
    if (!intent) return;
    if (ensureUserEmail()) {
      startBuild(idea, historian);
      return;
    }
    setPending({ idea, historian });
  };

  const isArchitecture = intent === "architecture";
  const isQuote = intent === "quote";

  return (
    <div className="flex min-h-screen flex-col items-center px-6 pt-12 pb-16">
      <div className="dot-grid absolute inset-0 -z-10" />

      <div className="flex w-full max-w-2xl flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <StackyMascot size={80} animated />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 text-center text-4xl font-semibold tracking-tight md:text-5xl"
        >
          What are you building?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 text-center text-lg text-muted-foreground"
        >
          High-fidelity architecture diagrams and commercial blueprints —
          everything editable, no account required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mb-8"
        >
          <IntentGate value={intent} onChange={setIntent} />
        </motion.div>

        {intent && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-col items-center gap-2"
            >
              <IntakeModeToggle value={intakeMode} onChange={setIntakeMode} />
              <p className="text-center text-xs text-muted-foreground">
                {isArchitecture
                  ? intakeMode === "guided"
                    ? "Walk through plant zones, networks, and data paths first"
                    : "Describe the full architecture in your own words"
                  : intakeMode === "guided"
                    ? "Stacky walks through your scenario first, then specs"
                    : "Skip the forms — describe everything in your own words"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-6"
            >
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                {isArchitecture
                  ? "Describe the architecture to draw"
                  : intakeMode === "natural"
                    ? "Describe your system (natural language)"
                    : "Describe your system"}
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(value);
                  }
                }}
                placeholder={
                  isArchitecture
                    ? "Central TDengine in the server room, taosX agents in each plant DMZ, OPC UA servers on the plant network, MPLS between sites, firewalls with allowed ports…"
                    : intakeMode === "natural"
                      ? "We're replacing PI at 3 plants with TDengine, need 2-year retention, OPC UA + MQTT ingest, and Grafana for operators…"
                      : "I want to deploy an industrial historian across multiple plants..."
                }
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 pr-14 text-base leading-relaxed shadow-lg shadow-orange-500/5 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
              <Button
                size="icon"
                className="absolute right-3 bottom-3 rounded-xl bg-orange-600 hover:bg-orange-500"
                onClick={() => submit(value)}
                disabled={!value.trim()}
              >
                <ArrowRight className="size-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <DocumentUpload
                pastedText={context.documents ?? ""}
                attachments={context.attachments ?? []}
                onPastedTextChange={(documents) => updateContext({ documents })}
                onAttachmentsChange={(files) => setAttachments(files)}
              />
            </motion.div>

            {(isQuote || isArchitecture) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <HistorianPlanning
                  onSelect={(idea, historianId) => submit(idea, historianId)}
                  caption={
                    isArchitecture
                      ? "Start from a historian pattern — you'll get zones, relays, and clients you can edit by hand."
                      : undefined
                  }
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-2"
            >
              {(isArchitecture
                ? [
                    "PI Server in DMZ — control / DMZ / corporate",
                    "Multi-plant taosX agents over MPLS",
                    "Purdue L0–L5 OT/IT segmentation",
                    "Central historian + site OPC UA servers",
                  ]
                : SUGGESTIONS
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => submit(suggestion)}
                  className="rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </div>

      <EmailGate
        open={!!pending}
        idea={pending?.idea}
        historian={pending?.historian}
        onCancel={() => setPending(null)}
        onComplete={() => {
          if (!pending) return;
          const { idea, historian } = pending;
          setPending(null);
          startBuild(idea, historian);
        }}
      />
    </div>
  );
}
