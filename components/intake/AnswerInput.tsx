"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AnswerInputProps = {
  placeholder?: string;
  chips?: string[];
  onSubmit: (answer: string) => void;
};

export function AnswerInput({ placeholder, chips, onSubmit }: AnswerInputProps) {
  const [value, setValue] = useState("");

  const submit = (answer: string) => {
    if (!answer.trim()) return;
    onSubmit(answer.trim());
    setValue("");
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(value)}
          placeholder={placeholder ?? "Type your answer..."}
          className="h-12 rounded-xl border-white/10 bg-white/5 pr-12 focus-visible:border-orange-500/50 focus-visible:ring-orange-500/20"
          autoFocus
        />
        <Button
          size="icon-sm"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-orange-600 hover:bg-orange-500"
          onClick={() => submit(value)}
        >
          <ArrowRight className="size-3.5" />
        </Button>
      </div>
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => submit(chip)}
              className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-foreground"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
