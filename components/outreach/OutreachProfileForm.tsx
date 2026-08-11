"use client";

import { useState } from "react";
import { Calendar, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStackyStore } from "@/lib/store";

export function OutreachProfileForm({ compact = false }: { compact?: boolean }) {
  const profile = useStackyStore((s) => s.outreachProfile);
  const setOutreachProfile = useStackyStore((s) => s.setOutreachProfile);
  const [saved, setSaved] = useState(false);

  const isComplete = Boolean(profile.name.trim() && profile.email.trim());

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
      }
    >
      {!compact && (
        <div>
          <p className="text-sm font-medium">Your outreach profile</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Stacky uses this to send vendor emails and include your Calendly link.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="size-3" />
          Your name
        </label>
        <Input
          value={profile.name}
          onChange={(e) => setOutreachProfile({ name: e.target.value })}
          placeholder="Jane Smith"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="size-3" />
          Your email
        </label>
        <Input
          type="email"
          value={profile.email}
          onChange={(e) => setOutreachProfile({ email: e.target.value })}
          placeholder="jane@company.com"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Company (optional)</label>
        <Input
          value={profile.company ?? ""}
          onChange={(e) => setOutreachProfile({ company: e.target.value })}
          placeholder="Acme Industrial"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          Calendly link
        </label>
        <Input
          value={profile.calendlyUrl ?? ""}
          onChange={(e) => setOutreachProfile({ calendlyUrl: e.target.value })}
          placeholder="https://calendly.com/you/30min"
          className="h-9 text-sm"
        />
        <p className="text-[10px] text-muted-foreground/70">
          Included in outreach emails so vendors can book a call with you.
        </p>
      </div>

      {!compact && (
        <Button
          size="sm"
          className="w-full bg-orange-600 hover:bg-orange-500"
          onClick={handleSave}
        >
          {saved ? "Saved" : isComplete ? "Save profile" : "Fill name & email to save"}
        </Button>
      )}

      {!isComplete && (
        <p className="text-[10px] text-amber-400/80">
          Add your name and email before sending outreach.
        </p>
      )}
    </div>
  );
}

export function isOutreachProfileComplete(profile: {
  name: string;
  email: string;
}): boolean {
  return Boolean(profile.name.trim() && profile.email.trim());
}
