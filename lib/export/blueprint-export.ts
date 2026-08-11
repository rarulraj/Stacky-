import type { Integration, ImplementationPartner, ProjectContext, StackyNode } from "@/lib/types";
import { collectOutreachContacts } from "@/lib/outreach";

function downloadFile(content: string | Blob, filename: string, mime: string) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function mermaidSafeId(label: string): string {
  return label.replace(/[^a-zA-Z0-9]/g, "_");
}

function buildMermaidDiagram(nodes: StackyNode[], integrations: Integration[]): string {
  const lines: string[] = ["```mermaid", "flowchart TB"];

  nodes.forEach((node) => {
    const id = mermaidSafeId(node.id);
    const product = node.detail.technologyPick?.product;
    const label = product ? `${node.label}<br/>${product}` : node.label;
    lines.push(`  ${id}["${label.replace(/"/g, "'")}"]`);
  });

  nodes
    .filter((n) => n.parentId)
    .forEach((n) => {
      lines.push(`  ${mermaidSafeId(n.parentId!)} --> ${mermaidSafeId(n.id)}`);
    });

  integrations.forEach((int) => {
    const from = nodes.find((n) => n.id === int.fromNodeId);
    const to = nodes.find((n) => n.id === int.toNodeId);
    if (!from || !to) return;
    lines.push(
      `  ${mermaidSafeId(from.id)} -. "${int.protocol}" .-> ${mermaidSafeId(to.id)}`
    );
  });

  lines.push("```");
  return lines.join("\n");
}

function buildStackTable(nodes: StackyNode[]): string {
  const picks = nodes.filter((n) => n.detail.technologyPick);
  if (picks.length === 0) return "_No technology picks in this blueprint._\n";

  let table = "| Layer | Component | Product | Vendor |\n";
  table += "|-------|-----------|---------|--------|\n";
  picks.forEach((n) => {
    const pick = n.detail.technologyPick!;
    const depth =
      n.depth === 0 ? "System" : n.depth === 1 ? "Domain" : "Component";
    table += `| ${depth} | ${n.label} | ${pick.product} | ${pick.vendor.name} |\n`;
  });
  return table + "\n";
}

export function exportBlueprintJson(
  context: ProjectContext,
  nodes: StackyNode[],
  integrations: Integration[] = [],
  implementationPartners: ImplementationPartner[] = []
) {
  const payload = {
    exportedAt: new Date().toISOString(),
    project: context,
    nodes,
    integrations,
    implementationPartners,
    outreach: collectOutreachContacts(nodes),
  };
  const name = slugify(context.idea || "stacky-blueprint");
  downloadFile(JSON.stringify(payload, null, 2), `${name}.json`, "application/json");
}

export function exportBlueprintMarkdown(
  context: ProjectContext,
  nodes: StackyNode[],
  integrations: Integration[] = [],
  implementationPartners: ImplementationPartner[] = []
) {
  const contacts = collectOutreachContacts(nodes);
  const name = context.idea || "Architecture Blueprint";

  let md = `# ${name}\n\n`;
  md += `> Stacky deployment blueprint · ${new Date().toLocaleString()}\n\n`;

  md += `## Table of contents\n\n`;
  md += `1. [Project summary](#project-summary)\n`;
  md += `2. [Technology stack](#technology-stack)\n`;
  md += `3. [Architecture diagram](#architecture-diagram)\n`;
  md += `4. [Hierarchy](#hierarchy)\n`;
  md += `5. [Integration map](#integration-map)\n`;
  md += `6. [Who can deploy this](#who-can-deploy-this)\n`;
  md += `7. [Vendor outreach](#vendor-outreach)\n`;
  md += `8. [Component details](#component-details)\n\n`;
  md += `---\n\n`;

  md += `## Project Summary\n\n`;
  if (context.industry) md += `- **Industry:** ${context.industry}\n`;
  if (context.deployment) md += `- **Deployment:** ${context.deployment}\n`;
  if (context.facilities) md += `- **Sites:** ${context.facilities}\n`;
  if (context.scale) md += `- **Scale:** ${context.scale}\n`;
  if (context.budget) md += `- **Budget:** ${context.budget}\n`;
  if (context.existingSystems) md += `- **Existing systems:** ${context.existingSystems}\n`;
  md += `\n**Goal:** ${context.idea}\n\n`;

  md += `---\n\n## Technology Stack\n\n`;
  md += buildStackTable(nodes);

  md += `---\n\n## Architecture Diagram\n\n`;
  md += buildMermaidDiagram(nodes, integrations);
  md += `\n\n---\n\n## Hierarchy\n\n`;

  const roots = nodes.filter((n) => !n.parentId);
  function renderTree(node: StackyNode, depth: number) {
    const indent = "  ".repeat(depth);
    const pick = node.detail.technologyPick?.product;
    md += `${indent}- **${node.label}**${pick ? `: _${pick}_` : ""}\n`;
    nodes
      .filter((n) => n.parentId === node.id)
      .forEach((child) => renderTree(child, depth + 1));
  }
  roots.forEach((r) => renderTree(r, 0));

  md += `\n---\n\n## Integration Map\n\n`;

  if (integrations.length === 0) {
    md += `_Expand domains to generate cross-component integration details._\n`;
  } else {
    integrations.forEach((int, i) => {
      const from = nodes.find((n) => n.id === int.fromNodeId)?.label ?? int.fromNodeId;
      const to = nodes.find((n) => n.id === int.toNodeId)?.label ?? int.toNodeId;
      md += `### ${i + 1}. ${from} → ${to}\n`;
      md += `- **Connection:** ${int.label}\n`;
      md += `- **Protocol:** ${int.protocol}\n`;
      md += `- **Data flow:** ${int.dataFlow}\n`;
      if (int.dataFormat) md += `- **Data format:** ${int.dataFormat}\n`;
      if (int.networkNote) md += `- **Network:** ${int.networkNote}\n`;
      if (int.whoSetsThisUp) {
        md += `- **Who sets this up:** ${int.whoSetsThisUp}`;
        if (int.estimatedEffort) md += ` (${int.estimatedEffort})`;
        md += `\n`;
      }
      md += `- **Details:** ${int.description}\n`;
      if (int.setupSteps?.length) {
        md += `- **Setup steps:**\n`;
        int.setupSteps.forEach((step, j) => {
          md += `  ${j + 1}. ${step}\n`;
        });
      }
      md += `\n`;
    });
  }

  md += `---\n\n## Who Can Deploy This\n\n`;

  if (implementationPartners.length === 0) {
    md += `_Regenerate the blueprint to load systems integrator recommendations._\n`;
  } else {
    implementationPartners.forEach((p, i) => {
      md += `### ${i + 1}. ${p.company} (${p.partnerType})\n`;
      md += `${p.description}\n\n`;
      md += `- **Services:** ${p.services.join(", ")}\n`;
      md += `- **Deploys:** ${p.deploysComponents.join(", ")}\n`;
      md += `- **Website:** ${p.website}\n`;
      if (p.contactEmail) md += `- **Email:** ${p.contactEmail}\n`;
      if (p.contactPage) md += `- **Contact:** ${p.contactPage}\n`;
      if (p.region) md += `- **Region:** ${p.region}\n`;
      md += `\n`;
    });
  }

  md += `---\n\n## Vendor Outreach\n\n`;

  if (contacts.length === 0) {
    md += `_No vendor contacts in this blueprint._\n`;
  } else {
    contacts.forEach((v, i) => {
      md += `### ${i + 1}. ${v.name}\n`;
      if (v.product) md += `- **Product:** ${v.product}\n`;
      md += `- **Component:** ${v.nodeLabel}\n`;
      if (v.role) md += `- **Role:** ${v.role}\n`;
      md += `- **Website:** ${v.website}\n`;
      if (v.contactPage) md += `- **Contact:** ${v.contactPage}\n`;
      if (v.contactEmail) md += `- **Email:** ${v.contactEmail}\n`;
      if (v.contactPhone) md += `- **Phone:** ${v.contactPhone}\n`;
      md += `\n`;
    });
  }

  md += `---\n\n## Component Details\n\n`;
  nodes.forEach((node) => {
    md += `### ${node.label}\n\n`;
    md += `${node.detail.overview}\n\n`;
    md += `**Purpose:** ${node.detail.purpose}\n\n`;

    const pick = node.detail.technologyPick;
    if (pick) {
      md += `**Deploy:** ${pick.product}${pick.version ? ` v${pick.version}` : ""} (${pick.vendor.name})\n\n`;
      md += `- **Role:** ${pick.role}\n`;
      if (pick.connectsTo) md += `- **Connects to:** ${pick.connectsTo}\n`;
      if (pick.deploymentNote) md += `- **Deployment:** ${pick.deploymentNote}\n`;
      md += `\n`;
    }

    if (node.detail.bestPractices.length > 0) {
      md += `**Best practices:**\n`;
      node.detail.bestPractices.forEach((bp) => {
        md += `- ${bp}\n`;
      });
      md += `\n`;
    }
  });

  const filename = slugify(context.idea || "stacky-blueprint");
  downloadFile(md, `${filename}.md`, "text/markdown");
}

async function prepareDiagramElement(): Promise<HTMLElement> {
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 2500);
    const onReady = () => {
      clearTimeout(timeout);
      window.removeEventListener("stacky-export-png-ready", onReady);
      resolve();
    };
    window.addEventListener("stacky-export-png-ready", onReady);
    window.dispatchEvent(new CustomEvent("stacky-prepare-export-png"));
  });

  const viewport = document.querySelector(
    ".react-flow__viewport"
  ) as HTMLElement | null;
  const element =
    viewport ?? (document.querySelector(".react-flow") as HTMLElement | null);
  if (!element) throw new Error("Diagram not found");
  return element;
}

function diagramFilter(node: HTMLElement | unknown): boolean {
  if (node instanceof HTMLElement) {
    return (
      !node.classList?.contains("react-flow__minimap") &&
      !node.classList?.contains("react-flow__controls")
    );
  }
  return true;
}

export async function exportDiagramPng(context: ProjectContext) {
  const element = await prepareDiagramElement();
  const { toPng } = await import("html-to-image");

  const dataUrl = await toPng(element, {
    backgroundColor: "#1c1917",
    pixelRatio: 3,
    cacheBust: true,
    filter: diagramFilter,
  });

  const filename = `${slugify(context.idea || "stacky-diagram")}.png`;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadFile(blob, filename, "image/png");
}

export async function exportDiagramSvg(context: ProjectContext) {
  const element = await prepareDiagramElement();
  const { toSvg } = await import("html-to-image");

  const dataUrl = await toSvg(element, {
    backgroundColor: "#1c1917",
    cacheBust: true,
    filter: diagramFilter,
  });

  const filename = `${slugify(context.idea || "stacky-diagram")}.svg`;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadFile(blob, filename, "image/svg+xml");
}
