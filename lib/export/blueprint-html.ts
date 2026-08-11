import type {
  Integration,
  ImplementationPartner,
  ProjectContext,
  StackyNode,
} from "@/lib/types";
import { collectOutreachContacts } from "@/lib/outreach";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function depthLabel(depth: number): string {
  if (depth === 0) return "System";
  if (depth === 1) return "Domain";
  return "Component";
}

function buildHierarchyHtml(nodes: StackyNode[]): string {
  const roots = nodes.filter((n) => !n.parentId);

  function renderNode(node: StackyNode, level: number): string {
    const pick = node.detail.technologyPick?.product;
    const children = nodes.filter((n) => n.parentId === node.id);
    const productBadge = pick
      ? `<span class="badge badge-product">${escapeHtml(pick)}</span>`
      : "";

    let html = `<li class="tree-item level-${level}">
      <div class="tree-label">
        <strong>${escapeHtml(node.label)}</strong>
        ${productBadge}
      </div>`;

    if (children.length > 0) {
      html += `<ul class="tree-children">${children.map((c) => renderNode(c, level + 1)).join("")}</ul>`;
    }
    html += `</li>`;
    return html;
  }

  return `<ul class="tree">${roots.map((r) => renderNode(r, 0)).join("")}</ul>`;
}

function buildStackTableHtml(nodes: StackyNode[]): string {
  const picks = nodes.filter((n) => n.detail.technologyPick);
  if (picks.length === 0) {
    return `<p class="muted">No technology picks in this blueprint.</p>`;
  }

  const rows = picks
    .map((n) => {
      const pick = n.detail.technologyPick!;
      return `<tr>
        <td><span class="badge badge-layer">${depthLabel(n.depth)}</span></td>
        <td><strong>${escapeHtml(n.label)}</strong></td>
        <td>${escapeHtml(pick.product)}${pick.version ? ` <span class="muted">v${escapeHtml(pick.version)}</span>` : ""}</td>
        <td>${escapeHtml(pick.vendor.name)}</td>
      </tr>`;
    })
    .join("");

  return `<div class="table-wrap">
    <table>
      <thead>
        <tr><th>Layer</th><th>Component</th><th>Product</th><th>Vendor</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildIntegrationsHtml(
  integrations: Integration[],
  nodes: StackyNode[]
): string {
  if (integrations.length === 0) {
    return `<p class="muted">Expand domains to generate cross-component integration details.</p>`;
  }

  return integrations
    .map((int, i) => {
      const from = nodes.find((n) => n.id === int.fromNodeId)?.label ?? int.fromNodeId;
      const to = nodes.find((n) => n.id === int.toNodeId)?.label ?? int.toNodeId;
      const steps = (int.setupSteps ?? [])
        .map((s, j) => `<li>${j + 1}. ${escapeHtml(s)}</li>`)
        .join("");

      return `<article class="card integration-card" id="integration-${i + 1}">
        <header class="card-header">
          <span class="card-number">${i + 1}</span>
          <div>
            <h3>${escapeHtml(from)} <span class="arrow">→</span> ${escapeHtml(to)}</h3>
            <p class="card-subtitle">${escapeHtml(int.label)}</p>
          </div>
        </header>
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Protocol</span><span class="meta-value">${escapeHtml(int.protocol)}</span></div>
          <div class="meta-item"><span class="meta-label">Data flow</span><span class="meta-value">${escapeHtml(int.dataFlow)}</span></div>
          ${int.dataFormat ? `<div class="meta-item"><span class="meta-label">Format</span><span class="meta-value">${escapeHtml(int.dataFormat)}</span></div>` : ""}
          ${int.whoSetsThisUp ? `<div class="meta-item"><span class="meta-label">Who sets up</span><span class="meta-value">${escapeHtml(int.whoSetsThisUp)}${int.estimatedEffort ? ` <em>(${escapeHtml(int.estimatedEffort)})</em>` : ""}</span></div>` : ""}
        </div>
        <p class="card-body">${escapeHtml(int.description)}</p>
        ${int.networkNote ? `<p class="network-note"><strong>Network:</strong> ${escapeHtml(int.networkNote)}</p>` : ""}
        ${steps ? `<ol class="setup-steps">${steps}</ol>` : ""}
      </article>`;
    })
    .join("");
}

function buildPartnersHtml(partners: ImplementationPartner[]): string {
  if (partners.length === 0) {
    return `<p class="muted">Regenerate the blueprint to load systems integrator recommendations.</p>`;
  }

  return `<div class="partner-grid">${partners
    .map(
      (p, i) => `<article class="card partner-card" id="partner-${i + 1}">
        <header class="card-header">
          <span class="card-number partner">${i + 1}</span>
          <div>
            <h3>${escapeHtml(p.company)}</h3>
            <span class="badge badge-partner">${escapeHtml(p.partnerType)}</span>
          </div>
        </header>
        <p class="card-body">${escapeHtml(p.description)}</p>
        <div class="tag-list">
          ${p.services.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join("")}
        </div>
        <p class="deploys"><strong>Deploys:</strong> ${escapeHtml(p.deploysComponents.join(", "))}</p>
        <div class="contact-links">
          <a href="${escapeHtml(p.website)}" target="_blank" rel="noopener">Website</a>
          ${p.contactEmail ? `<a href="mailto:${escapeHtml(p.contactEmail)}">Email</a>` : ""}
          ${p.contactPage ? `<a href="${escapeHtml(p.contactPage)}" target="_blank" rel="noopener">Contact</a>` : ""}
          ${p.region ? `<span class="muted">${escapeHtml(p.region)}</span>` : ""}
        </div>
      </article>`
    )
    .join("")}</div>`;
}

function buildVendorHtml(nodes: StackyNode[]): string {
  const contacts = collectOutreachContacts(nodes);
  if (contacts.length === 0) {
    return `<p class="muted">No vendor contacts in this blueprint.</p>`;
  }

  return `<div class="vendor-grid">${contacts
    .map(
      (v, i) => `<article class="card vendor-card" id="vendor-${i + 1}">
        <h3>${escapeHtml(v.name)}</h3>
        ${v.product ? `<p class="card-subtitle">${escapeHtml(v.product)}</p>` : ""}
        <p><strong>Component:</strong> ${escapeHtml(v.nodeLabel)}</p>
        ${v.role ? `<p><strong>Role:</strong> ${escapeHtml(v.role)}</p>` : ""}
        <div class="contact-links">
          <a href="${escapeHtml(v.website)}" target="_blank" rel="noopener">Website</a>
          ${v.contactPage ? `<a href="${escapeHtml(v.contactPage)}" target="_blank" rel="noopener">Contact</a>` : ""}
          ${v.contactEmail ? `<a href="mailto:${escapeHtml(v.contactEmail)}">Email</a>` : ""}
          ${v.contactPhone ? `<span>${escapeHtml(v.contactPhone)}</span>` : ""}
        </div>
      </article>`
    )
    .join("")}</div>`;
}

function buildComponentsHtml(nodes: StackyNode[]): string {
  return nodes
    .map((node, i) => {
      const pick = node.detail.technologyPick;
      const practices = node.detail.bestPractices
        .map((bp) => `<li>${escapeHtml(bp)}</li>`)
        .join("");

      return `<article class="card component-card" id="component-${i + 1}">
        <header class="component-header">
          <span class="badge badge-layer">${depthLabel(node.depth)}</span>
          <h3>${escapeHtml(node.label)}</h3>
        </header>
        <p class="lead">${escapeHtml(node.detail.overview)}</p>
        <p><strong>Purpose:</strong> ${escapeHtml(node.detail.purpose)}</p>
        ${
          pick
            ? `<div class="pick-box">
              <p><strong>Deploy:</strong> ${escapeHtml(pick.product)}${pick.version ? ` v${escapeHtml(pick.version)}` : ""} — ${escapeHtml(pick.vendor.name)}</p>
              <p>${escapeHtml(pick.role)}</p>
              ${pick.connectsTo ? `<p><strong>Connects to:</strong> ${escapeHtml(pick.connectsTo)}</p>` : ""}
              ${pick.deploymentNote ? `<p><strong>Deployment:</strong> ${escapeHtml(pick.deploymentNote)}</p>` : ""}
            </div>`
            : ""
        }
        ${
          node.detail.costEstimate.range
            ? `<p class="cost"><strong>Cost:</strong> ${escapeHtml(node.detail.costEstimate.range)} — ${escapeHtml(node.detail.costEstimate.notes)}</p>`
            : ""
        }
        ${practices ? `<div><strong>Best practices</strong><ul>${practices}</ul></div>` : ""}
        ${node.detail.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(node.detail.notes)}</p>` : ""}
      </article>`;
    })
    .join("");
}

export function buildBlueprintHtml(
  context: ProjectContext,
  nodes: StackyNode[],
  integrations: Integration[] = [],
  implementationPartners: ImplementationPartner[] = []
): string {
  const title = context.idea || "Architecture Blueprint";
  const exportedAt = new Date().toLocaleString();
  const hasIntegrations = integrations.length > 0;
  const hasPartners = implementationPartners.length > 0;
  const hasVendors = collectOutreachContacts(nodes).length > 0;

  const summaryItems = [
    context.industry && `<li><strong>Industry</strong> ${escapeHtml(context.industry)}</li>`,
    context.deployment && `<li><strong>Deployment</strong> ${escapeHtml(context.deployment)}</li>`,
    context.facilities && `<li><strong>Sites</strong> ${escapeHtml(context.facilities)}</li>`,
    context.scale && `<li><strong>Scale</strong> ${escapeHtml(context.scale)}</li>`,
    context.budget && `<li><strong>Budget</strong> ${escapeHtml(context.budget)}</li>`,
    context.existingSystems &&
      `<li><strong>Existing systems</strong> ${escapeHtml(context.existingSystems)}</li>`,
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — Stacky Blueprint</title>
  <style>
    :root {
      --bg: #0c0a09;
      --surface: #1c1917;
      --surface-2: #292524;
      --border: #44403c;
      --text: #fafaf9;
      --muted: #a8a29e;
      --accent: #ea580c;
      --accent-soft: rgba(234, 88, 12, 0.12);
      --sky: #38bdf8;
      --violet: #a78bfa;
      --radius: 12px;
      --shadow: 0 4px 24px rgba(0,0,0,0.35);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      font-size: 15px;
    }
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4rem 2rem;
      background: linear-gradient(145deg, #1c1917 0%, #0c0a09 50%, #1a1208 100%);
      border-bottom: 1px solid var(--border);
      page-break-after: always;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      color: var(--accent);
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: var(--accent);
      border-radius: 8px;
      display: grid; place-items: center;
      color: white; font-size: 18px;
    }
    .cover h1 {
      font-size: clamp(2rem, 5vw, 3.25rem);
      font-weight: 700;
      line-height: 1.15;
      max-width: 18ch;
      margin-bottom: 1rem;
    }
    .cover .goal {
      font-size: 1.1rem;
      color: var(--muted);
      max-width: 60ch;
      margin-bottom: 2rem;
    }
    .cover-meta {
      color: var(--muted);
      font-size: 0.9rem;
    }
    .container { max-width: 960px; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
    .toc {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem 2rem;
      margin-bottom: 3rem;
      page-break-after: always;
    }
    .toc h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 1rem; }
    .toc ol { padding-left: 1.25rem; }
    .toc li { margin: 0.4rem 0; }
    .toc a { color: var(--accent); text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    section { margin-bottom: 3.5rem; page-break-inside: avoid; }
    section > h2 {
      font-size: 1.5rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--accent);
      display: inline-block;
    }
    .summary-list { list-style: none; display: grid; gap: 0.5rem; margin-bottom: 1.5rem; }
    .summary-list li { background: var(--surface); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border); }
    .table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; background: var(--surface); }
    th, td { padding: 0.85rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { background: var(--surface-2); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    tr:last-child td { border-bottom: none; }
    .badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-layer { background: var(--accent-soft); color: var(--accent); }
    .badge-product { background: rgba(56,189,248,0.15); color: var(--sky); margin-left: 0.5rem; }
    .badge-partner { background: rgba(167,139,250,0.15); color: var(--violet); }
    .tree { list-style: none; }
    .tree-children { margin-left: 1.5rem; padding-left: 1rem; border-left: 2px solid var(--border); margin-top: 0.35rem; }
    .tree-item { margin: 0.5rem 0; }
    .tree-label { display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow);
    }
    .card-header { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 0.75rem; }
    .card-number {
      flex-shrink: 0;
      width: 2rem; height: 2rem;
      border-radius: 8px;
      background: var(--accent);
      color: white;
      display: grid; place-items: center;
      font-weight: 700; font-size: 0.85rem;
    }
    .card-number.partner { background: var(--violet); }
    .card h3 { font-size: 1.05rem; margin-bottom: 0.15rem; }
    .card-subtitle { color: var(--muted); font-size: 0.9rem; }
    .arrow { color: var(--accent); }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin: 0.75rem 0; }
    .meta-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .meta-value { font-size: 0.9rem; }
    .card-body { color: #d6d3d1; margin: 0.5rem 0; }
    .network-note { font-size: 0.9rem; color: var(--muted); margin-top: 0.5rem; }
    .setup-steps { margin: 0.75rem 0 0 1.25rem; color: #d6d3d1; }
    .setup-steps li { margin: 0.35rem 0; }
    .partner-grid, .vendor-grid { display: grid; gap: 1rem; }
    @media (min-width: 640px) {
      .partner-grid, .vendor-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.75rem 0; }
    .tag { background: var(--surface-2); border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; }
    .contact-links { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; font-size: 0.9rem; }
    .contact-links a { color: var(--accent); text-decoration: none; }
    .contact-links a:hover { text-decoration: underline; }
    .muted { color: var(--muted); }
    .component-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .lead { font-size: 1rem; color: #d6d3d1; margin-bottom: 0.75rem; }
    .pick-box { background: var(--accent-soft); border: 1px solid rgba(234,88,12,0.25); border-radius: 8px; padding: 0.85rem 1rem; margin: 0.75rem 0; }
    .cost, .notes { font-size: 0.9rem; color: var(--muted); margin-top: 0.5rem; }
    .deploys { font-size: 0.9rem; margin-top: 0.5rem; }
    footer {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
    }
    @media print {
      body { background: white; color: #1c1917; }
      .cover { background: white; min-height: auto; }
      .card, .toc, table, .summary-list li { box-shadow: none; background: #f5f5f4; border-color: #d6d3d1; }
      .contact-links a, .toc a { color: #c2410c; }
      section > h2 { color: #1c1917; }
    }
  </style>
</head>
<body>
  <header class="cover">
    <div class="brand">
      <div class="brand-icon">▦</div>
      Stacky Blueprint
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p class="goal">${escapeHtml(context.idea)}</p>
    <p class="cover-meta">Generated ${escapeHtml(exportedAt)}</p>
  </header>

  <div class="container">
    <nav class="toc" aria-label="Table of contents">
      <h2>Contents</h2>
      <ol>
        <li><a href="#summary">Project summary</a></li>
        <li><a href="#stack">Technology stack</a></li>
        <li><a href="#hierarchy">Architecture hierarchy</a></li>
        ${hasIntegrations ? `<li><a href="#integrations">Integration map</a></li>` : ""}
        ${hasPartners ? `<li><a href="#partners">Who can deploy this</a></li>` : ""}
        ${hasVendors ? `<li><a href="#vendors">Vendor outreach</a></li>` : ""}
        <li><a href="#components">Component details</a></li>
      </ol>
    </nav>

    <section id="summary">
      <h2>Project summary</h2>
      ${summaryItems ? `<ul class="summary-list">${summaryItems}</ul>` : ""}
      <p><strong>Goal:</strong> ${escapeHtml(context.idea)}</p>
    </section>

    <section id="stack">
      <h2>Technology stack</h2>
      ${buildStackTableHtml(nodes)}
    </section>

    <section id="hierarchy">
      <h2>Architecture hierarchy</h2>
      ${buildHierarchyHtml(nodes)}
    </section>

    ${
      hasIntegrations
        ? `<section id="integrations">
      <h2>Integration map</h2>
      ${buildIntegrationsHtml(integrations, nodes)}
    </section>`
        : ""
    }

    ${
      hasPartners
        ? `<section id="partners">
      <h2>Who can deploy this</h2>
      ${buildPartnersHtml(implementationPartners)}
    </section>`
        : ""
    }

    ${
      hasVendors
        ? `<section id="vendors">
      <h2>Vendor outreach</h2>
      ${buildVendorHtml(nodes)}
    </section>`
        : ""
    }

    <section id="components">
      <h2>Component details</h2>
      ${buildComponentsHtml(nodes)}
    </section>
  </div>

  <footer>
    <p>Stacky · Industrial software architecture blueprint · ${escapeHtml(exportedAt)}</p>
  </footer>
</body>
</html>`;
}

export function exportBlueprintHtml(
  context: ProjectContext,
  nodes: StackyNode[],
  integrations: Integration[] = [],
  implementationPartners: ImplementationPartner[] = []
) {
  const html = buildBlueprintHtml(context, nodes, integrations, implementationPartners);
  const filename = `${slugify(context.idea || "stacky-blueprint")}.html`;
  downloadFile(html, filename);
}
