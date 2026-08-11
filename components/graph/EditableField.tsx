"use client";

import { cn } from "@/lib/utils";

type EditableFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
};

export function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  className,
}: EditableFieldProps) {
  const inputClass = cn(
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-foreground",
    "placeholder:text-muted-foreground/50 focus:border-orange-500/40 focus:outline-none focus:ring-1 focus:ring-orange-500/20",
    className
  );

  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={cn(inputClass, "resize-y min-h-[72px]")}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
    </label>
  );
}
