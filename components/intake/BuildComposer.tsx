"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildComposerProps = {
  placeholder?: string;
  chips?: string[];
  onSubmit: (answer: string) => void;
  disabled?: boolean;
};

export function BuildComposer({
  placeholder,
  chips,
  onSubmit,
  disabled,
}: BuildComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  const submit = (answer: string) => {
    if (!answer.trim() || disabled) return;
    onSubmit(answer.trim());
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="w-full">
      {chips && chips.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => submit(chip)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-foreground disabled:opacity-40"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-lg transition-colors",
          "focus-within:border-orange-500/40 focus-within:ring-2 focus-within:ring-orange-500/10",
          disabled && "opacity-50"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(value);
            }
          }}
          disabled={disabled}
          placeholder={placeholder ?? "Type your answer…"}
          rows={1}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/60"
        />
        <Button
          size="icon"
          disabled={disabled || !value.trim()}
          className="mb-0.5 shrink-0 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-30"
          onClick={() => submit(value)}
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
