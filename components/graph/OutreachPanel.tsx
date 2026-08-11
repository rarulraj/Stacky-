"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  ExternalLink,
  Copy,
  Check,
  Send,
  HardHat,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OutreachProfileForm } from "@/components/outreach/OutreachProfileForm";
import { SendOutreachButton } from "@/components/outreach/SendOutreachButton";
import { collectOutreachContacts } from "@/lib/outreach";
import { useStackyStore } from "@/lib/store";
import { fetchSendOutreach } from "@/lib/ai/client";
import { isOutreachProfileComplete } from "@/components/outreach/OutreachProfileForm";
import { PartnerEditor } from "@/components/graph/PartnerEditor";
import type { ImplementationPartner } from "@/lib/types";

function PartnerCard({
  partner,
  context,
  profile,
}: {
  partner: ImplementationPartner;
  context: ReturnType<typeof useStackyStore.getState>["context"];
  profile: ReturnType<typeof useStackyStore.getState>["outreachProfile"];
}) {
  const [copied, setCopied] = useState(false);
  const contact = {
    name: partner.company,
    website: partner.website,
    description: partner.description,
    category: partner.partnerType,
    contactEmail: partner.contactEmail,
    contactPhone: partner.contactPhone,
    contactPage: partner.contactPage,
    nodeLabel: partner.deploysComponents.join(", "),
    product: partner.services.join(" · "),
    role: `Deploys: ${partner.deploysComponents.join(", ")}`,
  };

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-violet-100">{partner.company}</p>
          {partner.name && partner.name !== partner.company && (
            <p className="text-xs text-muted-foreground">{partner.name}</p>
          )}
        </div>
        <Badge variant="outline" className="shrink-0 border-violet-500/30 text-[9px] text-violet-300">
          {partner.partnerType}
        </Badge>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {partner.description}
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        {partner.deploysComponents.map((c) => (
          <span
            key={c}
            className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-muted-foreground"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <SendOutreachButton contact={contact} context={context} profile={profile} />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {partner.contactEmail && (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(partner.contactEmail!);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            {partner.contactEmail}
          </button>
        )}
        {partner.contactPage && (
          <a
            href={partner.contactPage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
          >
            <ExternalLink className="size-3" />
            Contact
          </a>
        )}
        {partner.contactPhone && (
          <a
            href={`tel:${partner.contactPhone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
          >
            <Phone className="size-3" />
            Call
          </a>
        )}
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
          >
            <Building2 className="size-3" />
            Website
          </a>
        </div>
        <PartnerEditor partner={partner} />
      </div>
  );
}

export function OutreachPanel() {
  const open = useStackyStore((s) => s.outreachOpen);
  const setOutreachOpen = useStackyStore((s) => s.setOutreachOpen);
  const nodes = useStackyStore((s) => s.nodes);
  const implementationPartners = useStackyStore((s) => s.implementationPartners);
  const context = useStackyStore((s) => s.context);
  const profile = useStackyStore((s) => s.outreachProfile);
  const [copied, setCopied] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const contacts = collectOutreachContacts(nodes);
  const withEmail = contacts.filter((c) => c.contactEmail);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendAll = async () => {
    if (!isOutreachProfileComplete(profile) || batchLoading) return;
    setBatchLoading(true);
    setBatchStatus(null);
    let sent = 0;
    for (const contact of withEmail) {
      try {
        const result = await fetchSendOutreach(context, profile, {
          vendorName: contact.name,
          vendorEmail: contact.contactEmail!,
          product: contact.product,
          role: contact.role,
          nodeLabel: contact.nodeLabel,
          vendorDescription: contact.description,
        });
        if (result.sent) sent++;
        await new Promise((r) => setTimeout(r, 800));
      } catch {
        // continue
      }
    }
    setBatchStatus(
      sent > 0
        ? `Stacky sent ${sent} email${sent !== 1 ? "s" : ""} via Resend.`
        : `Drafted ${withEmail.length} emails — opened via your mail app or add RESEND_API_KEY for auto-send.`
    );
    setBatchLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -380, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 z-50 flex h-full w-[400px] flex-col border-r border-white/8 bg-[#1c1917]/98 backdrop-blur-xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">Deploy & Outreach</h2>
              <p className="text-xs text-muted-foreground">
                {implementationPartners.length} integrator
                {implementationPartners.length !== 1 ? "s" : ""} · {contacts.length} vendor
                {contacts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setOutreachOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4">
            <OutreachProfileForm />

            {implementationPartners.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <HardHat className="size-4 text-violet-400" />
                  <h3 className="text-sm font-medium text-violet-100">
                    Who can set this up
                  </h3>
                </div>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  Systems integrators and consultants who deploy stacks like yours — reach out for
                  implementation quotes.
                </p>
                <div className="space-y-3">
                  {implementationPartners.map((partner) => (
                    <PartnerCard
                      key={partner.id}
                      partner={partner}
                      context={context}
                      profile={profile}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="size-4 text-orange-400" />
                <h3 className="text-sm font-medium">Product vendors</h3>
              </div>

              {withEmail.length > 0 && isOutreachProfileComplete(profile) && (
                <Button
                  className="mb-3 w-full bg-orange-600 hover:bg-orange-500"
                  disabled={batchLoading}
                  onClick={sendAll}
                >
                  <Send className="size-4" />
                  {batchLoading ? "Sending…" : `AI outreach all ${withEmail.length} vendors`}
                </Button>
              )}
              {batchStatus && (
                <p className="mb-3 text-xs text-emerald-400/90">{batchStatus}</p>
              )}

              <div className="space-y-3 pb-6">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Generate a blueprint to load vendor contacts.
                  </p>
                ) : (
                  contacts.map((contact) => {
                    const key = `${contact.name}-${contact.nodeLabel}`;
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            {contact.product && (
                              <p className="text-xs text-orange-300/90">{contact.product}</p>
                            )}
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              For: {contact.nodeLabel}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[9px]">
                            {contact.category}
                          </Badge>
                        </div>

                        {contact.role && (
                          <p className="mt-2 text-xs text-muted-foreground">{contact.role}</p>
                        )}

                        <div className="mt-3">
                          <SendOutreachButton
                            contact={contact}
                            context={context}
                            profile={profile}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {contact.contactEmail && (
                            <button
                              type="button"
                              onClick={() => copyText(contact.contactEmail!, key)}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
                            >
                              {copied === key ? (
                                <Check className="size-3 text-emerald-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                              {contact.contactEmail}
                            </button>
                          )}
                          {contact.contactPhone && (
                            <a
                              href={`tel:${contact.contactPhone.replace(/\s/g, "")}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
                            >
                              <Phone className="size-3" />
                              Call
                            </a>
                          )}
                          {contact.contactPage && (
                            <a
                              href={contact.contactPage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10"
                            >
                              <ExternalLink className="size-3" />
                              Contact page
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
