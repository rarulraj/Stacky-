"use client";

import { DocumentUpload } from "./DocumentUpload";
import { ProgressDots } from "./ProgressDots";
import { IntakeModeToggle } from "./IntakeModeToggle";
import { OutreachProfileForm } from "@/components/outreach/OutreachProfileForm";
import { Badge } from "@/components/ui/badge";
import type { IntakeMode, ProjectContext, UploadedFile } from "@/lib/types";

type BuildSidebarProps = {
  context: ProjectContext;
  llmEnabled: boolean;
  answeredCount: number;
  totalQuestions: number;
  onDocumentsChange: (docs: string) => void;
  onAttachmentsChange: (files: UploadedFile[]) => void;
  onIntakeModeChange: (mode: IntakeMode) => void;
};

export function BuildSidebar({
  context,
  llmEnabled,
  answeredCount,
  totalQuestions,
  onDocumentsChange,
  onAttachmentsChange,
  onIntakeModeChange,
}: BuildSidebarProps) {
  const intakeMode = context.intakeMode ?? "guided";

  const fields = [
    { label: "Project", value: context.idea },
    { label: "Scenario", value: context.scenario },
    { label: "Industry", value: context.industry },
    { label: "Deployment", value: context.deployment },
    { label: "Sites", value: context.facilities },
    { label: "Scale", value: context.scale },
    { label: "Existing", value: context.existingSystems },
    { label: "Budget", value: context.budget },
  ].filter((f) => f.value);

  const fileCount = context.attachments?.length ?? 0;

  return (
    <aside className="hidden h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-r border-white/8 bg-white/[0.02] lg:flex">
      <div className="border-b border-white/8 p-5">
        <Badge variant="outline" className="mb-3 text-xs">
          {llmEnabled ? "AI architect active" : "Template mode"}
        </Badge>
        <h2 className="line-clamp-3 text-sm font-semibold leading-snug">
          {context.idea}
        </h2>
        <div className="mt-4">
          <IntakeModeToggle
            value={intakeMode}
            onChange={onIntakeModeChange}
            className="w-full"
          />
          <p className="mt-2 text-[10px] text-muted-foreground">
            {intakeMode === "natural"
              ? "Natural language — no structured prompts"
              : "Scenario-first guided intake"}
          </p>
        </div>
        {intakeMode === "guided" && (
          <div className="mt-4">
            <ProgressDots total={totalQuestions} current={answeredCount} />
            <p className="mt-2 text-xs text-muted-foreground">
              {answeredCount} / {totalQuestions} context gathered
              {fileCount > 0 && ` · ${fileCount} file${fileCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        )}
        {intakeMode === "natural" && context.naturalNotes && (
          <p className="mt-4 text-xs text-muted-foreground">
            Free-form notes captured — add more in chat, then build
          </p>
        )}
      </div>

      {fields.length > 1 && (
        <div className="border-b border-white/8 p-5">
          <p className="mb-3 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Captured context
          </p>
          <dl className="space-y-2.5">
            {fields.slice(1).map((f) => (
              <div key={f.label}>
                <dt className="text-[10px] text-muted-foreground">{f.label}</dt>
                <dd className="text-sm">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/8 p-5">
        <OutreachProfileForm compact />
        <div className="my-5 border-t border-white/8" />
        <DocumentUpload
          pastedText={context.documents ?? ""}
          attachments={context.attachments ?? []}
          onPastedTextChange={onDocumentsChange}
          onAttachmentsChange={onAttachmentsChange}
          collapsed={false}
        />
      </div>
    </aside>
  );
}
