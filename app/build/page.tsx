"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/landing/Nav";
import { BuildSidebar } from "@/components/intake/BuildSidebar";
import { ChatThread } from "@/components/intake/ChatThread";
import { BuildComposer } from "@/components/intake/BuildComposer";
import { DocumentUpload } from "@/components/intake/DocumentUpload";
import { GeneratingOverlay } from "@/components/intake/GeneratingOverlay";
import { IntakeModeToggle } from "@/components/intake/IntakeModeToggle";
import {
  getTotalQuestions,
  getAnsweredCount,
  normalizeAnswer,
  getNextQuestion,
  NATURAL_MODE_INTRO,
  GUIDED_MODE_INTRO,
} from "@/lib/mock/question-flow";
import { fetchNextQuestion, fetchGenerateGraph, checkLLMStatus, ApiKeyRequiredError } from "@/lib/ai/client";
import { useStackyStore } from "@/lib/store";
import type { IntakeMode, Question } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function BuildPage() {
  const router = useRouter();
  const context = useStackyStore((s) => s.context);
  const messages = useStackyStore((s) => s.messages);
  const updateContext = useStackyStore((s) => s.updateContext);
  const addMessage = useStackyStore((s) => s.addMessage);
  const setGraphData = useStackyStore((s) => s.setGraphData);
  const setAttachments = useStackyStore((s) => s.setAttachments);
  const saveDeployment = useStackyStore((s) => s.saveDeployment);

  const intakeMode: IntakeMode = context.intakeMode ?? "guided";
  const isNatural = intakeMode === "natural";

  const [pendingQuestion, setPendingQuestion] = useState<Question | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
  const [streamDone, setStreamDone] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);

  const initRef = useRef(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const refresh = () => checkLLMStatus().then((r) => setLlmEnabled(r.configured));
    refresh();
    window.addEventListener("stacky-api-key-change", refresh);
    return () => window.removeEventListener("stacky-api-key-change", refresh);
  }, []);

  useEffect(() => {
    if (!context.idea) router.replace("/");
  }, [context.idea, router]);

  const generateGraph = useCallback(
    async (ctx: typeof context) => {
      setGraphError(null);
      setIsGenerating(true);
      setGeneratingStatus(
        llmEnabled
          ? "Reviewing your requirements…"
          : "Building template architecture…"
      );
      setStreamingMessage(null);
      setPendingQuestion(null);

      const statusInterval = setInterval(() => {
        setGeneratingStatus((prev) => {
          const steps = llmEnabled
            ? [
                "Reviewing your requirements…",
                "Searching the web for latest industry trends…",
                "Designing architecture for your industry…",
                "Researching current products & vendor contacts…",
                "Verifying sales contacts on vendor sites…",
                "Mapping how everything connects…",
                "Stacking your blueprint…",
              ]
            : [
                "Building template architecture…",
                "Mapping historian & OT layers…",
                "Stacking your blueprint…",
              ];
          const idx = steps.indexOf(prev);
          return steps[Math.min(idx + 1, steps.length - 1)] ?? steps[0];
        });
      }, 2800);

      try {
        const { nodes, integrations, implementationPartners, source } =
          await fetchGenerateGraph(ctx);
        setGeneratingStatus(
          source === "llm"
            ? "Blueprint ready — vendors loaded…"
            : "Blueprint ready — template mode…"
        );
        await new Promise((r) => setTimeout(r, 600));
        setGraphData(nodes, integrations, implementationPartners);
        saveDeployment();
        router.push("/graph");
      } catch (err) {
        const message =
          err instanceof ApiKeyRequiredError
            ? "OpenAI API key required on the server. Ask your admin to set OPENAI_API_KEY."
            : err instanceof Error
              ? err.message
              : "Failed to generate architecture.";
        setGraphError(message);
        setIsGenerating(false);
      } finally {
        clearInterval(statusInterval);
      }
    },
    [setGraphData, saveDeployment, router, llmEnabled]
  );

  const presentQuestion = useCallback((question: Question) => {
    setPendingQuestion(question);
    setStreamDone(false);
    setIsThinking(true);
    setStreamingMessage(null);

    setTimeout(() => {
      setIsThinking(false);
      setStreamingMessage(question.text);
    }, 500 + Math.random() * 300);
  }, []);

  const fetchAndPresentNext = useCallback(
    async (ctx: typeof context) => {
      if (fetchingRef.current || ctx.intakeMode === "natural") return;
      fetchingRef.current = true;

      try {
        setIsThinking(true);
        const result = await fetchNextQuestion(ctx);

        if (result.done) {
          setIsThinking(false);
          await generateGraph(ctx);
          return;
        }

        if (result.question) {
          const alreadyAnswered = Boolean(ctx[result.question.id]);
          const alreadyAsked = messages.some(
            (m) => m.role === "stacky" && m.content === result.question!.text
          );

          if (alreadyAnswered || alreadyAsked) {
            const fallback = getNextQuestion(ctx);
            if (!fallback) {
              setIsThinking(false);
              await generateGraph(ctx);
              return;
            }
            presentQuestion(fallback);
            return;
          }

          presentQuestion(result.question);
        } else {
          setIsThinking(false);
        }
      } finally {
        fetchingRef.current = false;
      }
    },
    [generateGraph, presentQuestion, messages]
  );

  const postIntroMessage = useCallback(
    (content: string) => {
      addMessage({ id: crypto.randomUUID(), role: "stacky", content });
      setStreamDone(true);
    },
    [addMessage]
  );

  useEffect(() => {
    if (initRef.current || messages.length > 0) return;
    initRef.current = true;

    if (isNatural) {
      postIntroMessage(NATURAL_MODE_INTRO);
      return;
    }

    postIntroMessage(GUIDED_MODE_INTRO);
    fetchAndPresentNext(context);
  }, [context, messages.length, fetchAndPresentNext, isNatural, postIntroMessage]);

  const handleGuidedAnswer = async (answer: string) => {
    if (!pendingQuestion || !streamDone || fetchingRef.current) return;

    const normalized = normalizeAnswer(pendingQuestion.id, answer);
    const questionText = pendingQuestion.text;

    addMessage({ id: crypto.randomUUID(), role: "stacky", content: questionText });
    addMessage({ id: crypto.randomUUID(), role: "user", content: answer });
    updateContext({ [pendingQuestion.id]: normalized });

    setPendingQuestion(null);
    setStreamingMessage(null);
    setStreamDone(false);

    await new Promise((r) => setTimeout(r, 200));

    const updatedCtx = {
      ...useStackyStore.getState().context,
      [pendingQuestion.id]: normalized,
    };

    await fetchAndPresentNext(updatedCtx);
  };

  const handleNaturalMessage = (text: string) => {
    if (!text.trim()) return;

    const prev = useStackyStore.getState().context.naturalNotes ?? "";
    const naturalNotes = prev ? `${prev}\n\n${text.trim()}` : text.trim();

    addMessage({ id: crypto.randomUUID(), role: "user", content: text.trim() });
    updateContext({ naturalNotes });

    addMessage({
      id: crypto.randomUUID(),
      role: "stacky",
      content:
        "Got it — I've added that to your project context. Keep going with more detail, or hit **Build blueprint** when you're ready.",
    });
    setStreamDone(true);
  };

  const switchToNatural = () => {
    updateContext({ intakeMode: "natural" });
    setPendingQuestion(null);
    setStreamingMessage(null);
    setIsThinking(false);
    setStreamDone(true);
    addMessage({
      id: crypto.randomUUID(),
      role: "stacky",
      content: NATURAL_MODE_INTRO,
    });
  };

  const switchToGuided = () => {
    updateContext({ intakeMode: "guided" });
    setStreamDone(false);
    addMessage({
      id: crypto.randomUUID(),
      role: "stacky",
      content: GUIDED_MODE_INTRO,
    });
    void fetchAndPresentNext(useStackyStore.getState().context);
  };

  const showGuidedComposer = !isNatural && streamDone && pendingQuestion && !isThinking;
  const showNaturalComposer = isNatural && !isGenerating;
  const showWaiting =
    !isNatural && !showGuidedComposer && !isGenerating;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#1c1917]">
      <Nav />
      {isGenerating && <GeneratingOverlay status={generatingStatus} />}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <BuildSidebar
          context={context}
          llmEnabled={llmEnabled}
          answeredCount={getAnsweredCount(context)}
          totalQuestions={getTotalQuestions()}
          onDocumentsChange={(documents) => updateContext({ documents })}
          onAttachmentsChange={(files) => setAttachments(files)}
          onIntakeModeChange={(mode) => {
            if (mode === "natural") switchToNatural();
            else switchToGuided();
          }}
        />

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="border-b border-white/8 px-4 py-3 lg:hidden">
            <p className="truncate text-sm font-medium">{context.idea}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <IntakeModeToggle
                value={intakeMode}
                onChange={(mode) => {
                  if (mode === "natural") switchToNatural();
                  else switchToGuided();
                }}
              />
            </div>
            <div className="mt-3">
              <DocumentUpload
                pastedText={context.documents ?? ""}
                attachments={context.attachments ?? []}
                onPastedTextChange={(documents) => updateContext({ documents })}
                onAttachmentsChange={(files) => setAttachments(files)}
                collapsed
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="mx-auto w-full max-w-3xl px-4 md:px-8 lg:max-w-4xl">
              {graphError && (
                <div className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">
                  {graphError}
                </div>
              )}
              <ChatThread
                messages={messages}
                isThinking={isThinking}
                streamingMessage={streamingMessage}
                onStreamComplete={() => setStreamDone(true)}
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-white/8 bg-[#1c1917]/90 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
              {showNaturalComposer && (
                <>
                  <BuildComposer
                    placeholder="Add scenario details, scale, constraints, existing systems…"
                    onSubmit={handleNaturalMessage}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={switchToGuided}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Prefer scenario-first questions instead?
                    </button>
                    <Button
                      className="bg-orange-600 hover:bg-orange-500"
                      onClick={() => generateGraph(useStackyStore.getState().context)}
                    >
                      <Sparkles className="size-4" />
                      Build blueprint
                    </Button>
                  </div>
                </>
              )}

              {showGuidedComposer && (
                <>
                  <BuildComposer
                    placeholder={pendingQuestion!.placeholder}
                    chips={pendingQuestion!.chips}
                    onSubmit={handleGuidedAnswer}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={switchToNatural}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      Prefer natural language — skip questions
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateGraph(useStackyStore.getState().context)}
                    >
                      <Sparkles className="size-3.5" />
                      Skip → build now
                    </Button>
                  </div>
                </>
              )}

              {showWaiting && (
                <div className="flex h-[52px] items-center justify-center rounded-2xl border border-white/8 bg-white/[0.02]">
                  <p className="text-sm text-muted-foreground">
                    {isThinking
                      ? "Stacky is thinking…"
                      : streamingMessage && !streamDone
                        ? "Stacky is responding…"
                        : "Waiting for Stacky…"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
