"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  AlertTriangle,
  DollarSign,
  Shield,
  Lightbulb,
  Building2,
  ExternalLink,
  Mail,
  Phone,
  User,
  Link2,
  Package,
  Pencil,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getNodeIntegrations } from "@/lib/mock/integrations";
import { SwapTechnologyChat } from "./SwapTechnologyChat";
import { IntegrationEditor } from "./IntegrationEditor";
import { NodeEditor } from "./NodeEditor";
import { SendOutreachButton } from "@/components/outreach/SendOutreachButton";
import { useStackyStore } from "@/lib/store";

type NodeSidePanelProps = {
  open: boolean;
  onClose: () => void;
  onExpand: () => void;
  canExpand: boolean;
};

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export function NodeSidePanel({
  open,
  onClose,
  onExpand,
  canExpand,
}: NodeSidePanelProps) {
  const [editMode, setEditMode] = useState(false);
  const integrations = useStackyStore((s) => s.integrations);
  const nodes = useStackyStore((s) => s.nodes);
  const selectedNodeId = useStackyStore((s) => s.selectedNodeId);
  const node =
    selectedNodeId !== null
      ? (nodes.find((n) => n.id === selectedNodeId) ?? null)
      : null;
  const context = useStackyStore((s) => s.context);
  const profile = useStackyStore((s) => s.outreachProfile);
  const addChildNode = useStackyStore((s) => s.addChildNode);
  const deleteNode = useStackyStore((s) => s.deleteNode);
  const updateActiveDeployment = useStackyStore((s) => s.updateActiveDeployment);

  const nodeIntegrations = node
    ? getNodeIntegrations(integrations, node.id)
    : { outgoing: [], incoming: [] };
  const canAddChild = !!node && node.depth < 4;
  const canDeleteNode = !!node && node.depth > 0;

  const labelFor = (id: string) =>
    nodes.find((n) => n.id === id)?.label ?? "Unknown";

  useEffect(() => {
    setEditMode(false);
  }, [selectedNodeId]);

  return (
    <AnimatePresence>
      {open && node && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-0 right-0 z-50 flex h-full w-[420px] flex-col overflow-hidden border-l border-white/8 bg-background/95 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{node.label}</h2>
              <p className="text-xs text-muted-foreground">
                {[node.kind, node.zone, `depth ${node.depth}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={editMode ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setEditMode((e) => !e)}
                title={editMode ? "View mode" : "Edit manually"}
              >
                {editMode ? <Eye className="size-4" /> : <Pencil className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-5 py-4">
            {editMode ? (
              <NodeEditor node={node} onSaved={() => setEditMode(false)} />
            ) : (
            <div className="space-y-6 pb-6">
              <Section title="Overview">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {node.detail.overview}
                </p>
              </Section>

              <Separator className="bg-white/8" />

              <Section title="Purpose">
                <p className="text-sm leading-relaxed">{node.detail.purpose}</p>
              </Section>

              {node.detail.technologyPick && (
                <>
                  <Separator className="bg-white/8" />
                  <Section
                    title={
                      context.intent === "architecture"
                        ? "Technology"
                        : "Your stack, ready to deploy"
                    }
                    icon={Package}
                  >
                    {(() => {
                      const pick = node.detail.technologyPick!;
                      const outreachContact = {
                        ...pick.vendor,
                        nodeLabel: node.label,
                        product: pick.product,
                        role: pick.role,
                      };
                      const isArch = context.intent === "architecture";
                      return (
                        <div className="rounded-lg border border-orange-500/25 bg-orange-500/8 p-4">
                          <p className="text-[10px] font-medium tracking-wide text-orange-400/80 uppercase">
                            {isArch ? "Component product" : "Stacky selected this for you"}
                          </p>
                          <div className="mt-2 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-orange-100">
                                {pick.product}
                                {pick.version && (
                                  <span className="ml-1 font-normal text-muted-foreground">
                                    v{pick.version}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {pick.vendor.name} · {pick.vendor.category}
                              </p>
                            </div>
                            <a
                              href={pick.vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-orange-400"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{pick.role}</p>
                          {pick.connectsTo && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-sky-400/80">
                              <Link2 className="size-2.5" />
                              Connects to: {pick.connectsTo}
                            </p>
                          )}
                          {pick.deploymentNote && (
                            <p className="mt-1 text-[10px] text-muted-foreground/70">
                              Deploy: {pick.deploymentNote}
                            </p>
                          )}
                          {!isArch && (
                            <>
                              <div className="mt-4">
                                <SendOutreachButton
                                  contact={outreachContact}
                                  context={context}
                                  profile={profile}
                                  variant="primary"
                                />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {pick.vendor.contactPage && (
                                  <a
                                    href={pick.vendor.contactPage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground hover:bg-white/10"
                                  >
                                    Contact page
                                  </a>
                                )}
                                {pick.vendor.contactPhone && (
                                  <a
                                    href={`tel:${pick.vendor.contactPhone.replace(/\s/g, "")}`}
                                    className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground hover:bg-white/10"
                                  >
                                    <Phone className="size-3" />
                                    {pick.vendor.contactPhone}
                                  </a>
                                )}
                              </div>
                              <SwapTechnologyChat
                                key={pick.product}
                                node={node}
                                pick={pick}
                              />
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </Section>
                </>
              )}

              {node.detail.technologies.length > 0 && !node.detail.technologyPick && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Technologies">
                    <div className="flex flex-wrap gap-1.5">
                      {node.detail.technologies.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="bg-white/5 text-xs"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {(nodeIntegrations.outgoing.length > 0 ||
                nodeIntegrations.incoming.length > 0) && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="How It Connects" icon={Link2}>
                    <div className="space-y-2">
                      {nodeIntegrations.outgoing.map((int) => (
                        <IntegrationEditor
                          key={int.id}
                          integration={int}
                          fromLabel={node.label}
                          toLabel={labelFor(int.toNodeId)}
                          direction="outgoing"
                        />
                      ))}
                      {nodeIntegrations.incoming.map((int) => (
                        <IntegrationEditor
                          key={int.id}
                          integration={int}
                          fromLabel={labelFor(int.fromNodeId)}
                          toLabel={node.label}
                          direction="incoming"
                        />
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {node.detail.tradeoffs.length > 0 && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Tradeoffs">
                    <div className="space-y-2">
                      {node.detail.tradeoffs.map((t, i) => (
                        <div key={i} className="rounded-lg border border-white/8 bg-white/5 p-3 text-xs">
                          <p className="text-emerald-400">+ {t.pro}</p>
                          <p className="mt-1 text-amber-400">− {t.con}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {node.detail.risks.length > 0 && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Risks" icon={AlertTriangle}>
                    <ul className="space-y-1">
                      {node.detail.risks.map((risk) => (
                        <li key={risk} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </Section>
                </>
              )}

              <Separator className="bg-white/8" />
              <Section title="Cost Estimate" icon={DollarSign}>
                <p className="text-sm font-medium">{node.detail.costEstimate.range}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {node.detail.costEstimate.notes}
                </p>
              </Section>

              {node.detail.standards.length > 0 && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Standards" icon={Shield}>
                    <div className="flex flex-wrap gap-1.5">
                      {node.detail.standards.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {node.detail.bestPractices.length > 0 && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Best Practices">
                    <ul className="space-y-1">
                      {node.detail.bestPractices.map((bp) => (
                        <li key={bp} className="text-sm text-muted-foreground">
                          • {bp}
                        </li>
                      ))}
                    </ul>
                  </Section>
                </>
              )}

              {node.detail.notes && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Notes">
                    <p className="text-sm text-muted-foreground">{node.detail.notes}</p>
                  </Section>
                </>
              )}

              {node.detail.vendors &&
                node.detail.vendors.length > 0 &&
                !node.detail.technologyPick && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Vendors & Contact Points" icon={Building2}>
                    <div className="space-y-2">
                      {node.detail.vendors.map((vendor) => (
                        <div
                          key={vendor.name}
                          className="rounded-lg border border-white/8 bg-white/5 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{vendor.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">
                                {vendor.category}
                              </p>
                            </div>
                            <a
                              href={vendor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-orange-400"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {vendor.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {vendor.contactEmail && (
                              <a
                                href={`mailto:${vendor.contactEmail}`}
                                className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-1 text-xs text-orange-300 hover:bg-orange-500/20"
                              >
                                <Mail className="size-3" />
                                {vendor.contactEmail}
                              </a>
                            )}
                            {vendor.contactPhone && (
                              <a
                                href={`tel:${vendor.contactPhone.replace(/\s/g, "")}`}
                                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground hover:bg-white/10"
                              >
                                <Phone className="size-3" />
                                {vendor.contactPhone}
                              </a>
                            )}
                            {vendor.contactPage && (
                              <a
                                href={vendor.contactPage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground hover:bg-white/10"
                              >
                                Contact page
                              </a>
                            )}
                          </div>
                          {(vendor.contactName || vendor.region) && (
                            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                              {vendor.contactName && (
                                <>
                                  <User className="size-2.5" />
                                  {vendor.contactName}
                                </>
                              )}
                              {vendor.contactName && vendor.region && " · "}
                              {vendor.region}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {node.detail.futureRecommendations.length > 0 && (
                <>
                  <Separator className="bg-white/8" />
                  <Section title="Future Recommendations" icon={Lightbulb}>
                    <ul className="space-y-1">
                      {node.detail.futureRecommendations.map((rec) => (
                        <li key={rec} className="text-sm text-muted-foreground">
                          → {rec}
                        </li>
                      ))}
                    </ul>
                  </Section>
                </>
              )}
            </div>
            )}
          </ScrollArea>

          <div className="space-y-2 border-t border-white/8 p-4">
            {canExpand && (
              <Button className="w-full" onClick={onExpand}>
                <Plus className="size-4" />
                Expand with AI
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={!canAddChild}
                onClick={() => {
                  if (!node) return;
                  addChildNode(node.id);
                  updateActiveDeployment();
                }}
              >
                <Plus className="size-4" />
                Add child
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-red-300 hover:text-red-200"
                disabled={!canDeleteNode}
                onClick={() => {
                  if (!node || !canDeleteNode) return;
                  if (!confirm(`Delete "${node.label}" and its children?`)) return;
                  deleteNode(node.id);
                  updateActiveDeployment();
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              Pencil edits details · drag on canvas to move
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
