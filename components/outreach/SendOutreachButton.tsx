"use client";

import { useState } from "react";
import { Calendar, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSendOutreach } from "@/lib/ai/client";
import { isOutreachProfileComplete } from "@/components/outreach/OutreachProfileForm";
import type { OutreachContact } from "@/lib/outreach";
import type { ProjectContext, OutreachProfile } from "@/lib/types";

type SendOutreachButtonProps = {
  contact: OutreachContact;
  context: ProjectContext;
  profile: OutreachProfile;
  variant?: "primary" | "compact";
};

export function SendOutreachButton({
  contact,
  context,
  profile,
  variant = "compact",
}: SendOutreachButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const canSend = isOutreachProfileComplete(profile) && contact.contactEmail;

  const handleSend = async () => {
    if (!canSend || loading) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await fetchSendOutreach(context, profile, {
        vendorName: contact.name,
        vendorEmail: contact.contactEmail!,
        product: contact.product,
        role: contact.role,
        nodeLabel: contact.nodeLabel,
        vendorDescription: contact.description,
      });

      if (result.sent) {
        setStatus(`Sent to ${contact.name}`);
      } else if (result.mailtoUrl) {
        window.location.href = result.mailtoUrl;
        setStatus("Opened in your email app");
      } else {
        setStatus(result.message);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  if (!contact.contactEmail) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        size="sm"
        disabled={!canSend || loading}
        onClick={handleSend}
        className={
          variant === "primary"
            ? "w-full bg-orange-600 hover:bg-orange-500"
            : "gap-1.5 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
        }
        variant={variant === "primary" ? "default" : "ghost"}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {variant === "primary" ? "Send outreach email" : "AI send email"}
      </Button>
      {profile.calendlyUrl && (
        <a
          href={profile.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-muted-foreground hover:bg-white/5"
        >
          <Calendar className="size-3" />
          Your Calendly link
        </a>
      )}
      {status && (
        <p className="text-[10px] text-emerald-400/90">{status}</p>
      )}
      {!canSend && (
        <p className="text-[10px] text-muted-foreground">Set up outreach profile first</p>
      )}
    </div>
  );
}
