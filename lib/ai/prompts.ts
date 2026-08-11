import type { Integration, ImplementationPartner, NodeDetail, OutreachProfile, ProjectContext, Question, StackyNode, TechnologyPick } from "@/lib/types";
import { getFullDocumentContext } from "@/lib/files/document-context";
import { buildIntegrationsFromNodes } from "@/lib/graph/integrations-from-nodes";
import { getDeploymentPatternBlock } from "./deployment-patterns";
import { buildRequirementsBlock, extractProjectRequirements } from "./requirements";
import { webResearchForComponent, webResearchInstructions } from "./web-research";

const CURRENT_YEAR = new Date().getFullYear();

export const SYSTEM_PROMPT = `You are Stacky, a senior solutions architect with 20+ years of experience designing industrial software systems.

Today's date is ${new Date().toISOString().slice(0, 10)}. You have access to web search: USE IT to verify current products, versions, market trends, and (when in quote mode) vendor contact pages before recommending anything.

You architect software for ANY industrial domain: manufacturing, construction, energy, utilities, oil & gas, mining, logistics, fleet management, building automation, water treatment, pharma, agriculture, and more.

You design OT/IT systems, field software, SCADA platforms, data pipelines, mobile field apps, asset management, IoT platforms, and enterprise integrations.

You support TWO intents (see project context.intent):
- "architecture": produce a serious, editable network / system architecture diagram (zones, firewalls, ports, site boxes). Fidelity over sales.
- "quote": produce a commercial blueprint with definitive product picks and vendor / SI outreach contacts.

Never use em dashes (—) in any text you write. Use plain periods or commas instead.

Always respond with valid JSON only: no markdown, no explanation outside the JSON.`;

const QUOTE_RULES = `QUOTE MODE RULES:
1. Make DEFINITIVE decisions: pick ONE specific commercial product per component. Never present alternatives.
2. Use EXACT product names from real vendors with CURRENT versions found via web search (e.g. search for "${CURRENT_YEAR} release" or "latest version"): NEVER generic labels like "MQTT broker", "time-series DB", "OPC UA", or "Industry-standard tools"
3. technologyPick is MANDATORY on every node except the root. It must include a real vendor with contactEmail OR contactPhone OR contactPage verified from that vendor's public website
4. Do NOT invent contact info: search the vendor site and use publicly listed sales emails, phone numbers, or contact page URLs
5. Map EXACTLY how components connect in integrations[]: each integration needs setupSteps, networkNote, and whoSetsThisUp so engineers know how to wire it
6. Include implementationPartners[]: real systems integrators, OT consultancies, or MSPs who can deploy and commission this stack (with contact info)
7. The customer clicks "Reach out" and emails vendors or partners: zero further research required from them
8. Prioritize ${CURRENT_YEAR} market leaders; pick the best-fit product per layer via web search: never force a vendor unless the user explicitly requested it

FORBIDDEN in product names: "MQTT", "OPC UA", "Modbus", "Kubernetes", "Docker", "Grafana", "Kafka", "Time-series DB", "See child nodes", "TBD", "Various", "Industry-standard"`;

const ARCHITECTURE_RULES = `ARCHITECTURE DIAGRAM MODE RULES:
1. Produce a HIGH-FIDELITY network architecture: think Purdue / ISA-95 / DMZ patterns like "PI Server in DMZ" or multi-plant central historian over MPLS.
2. Depth-1 nodes MUST be security / network ZONES (kind: "zone") with clear zone labels: e.g. "Plant / Control Network", "DMZ", "Central Server Room", "IT / Enterprise Network", "Site A Plant Network".
3. On initial generation include depth-2 COMPONENTS under each zone (kind: "component" | "firewall" | "network" | "client" | "datasource"): servers, agents, switches, OPC servers, clients. Aim for 12–22 total nodes so the diagram is useful without expand.
4. Every node MUST set kind and zone. Firewalls are first-class nodes (kind: "firewall") sitting on zone boundaries.
5. integrations[] are DATA / NETWORK paths (not just hierarchy). Every cross-zone link MUST include:
   - ports (e.g. "5450, 5457, 5459" or "443, 6041")
   - direction ("inbound" | "outbound" | "bidirectional")
   - networkNote (firewall make, VLAN, allow-list)
   - protocol and dataFlow
6. technologyPick is OPTIONAL in architecture mode: include product names in label/roleTag/technologies when known, but do NOT invent vendor contact emails. Prefer accurate component names (e.g. "taosX agent", "PI Connector Relay", "OPC UA Server").
7. implementationPartners[] should be empty or omitted in architecture mode.
8. Labels should match real architecture drawings: short, specific, site-aware when multi-plant.
9. Prefer left-to-right or top-to-bottom security tiers the user can edit by hand.`;

const DETAIL_SCHEMA = `{
        "overview": "...",
        "purpose": "...",
        "technologies": ["Product Name vX"],
        "technologyPick": {
          "name": "Vendor Name",
          "product": "Exact Product Name",
          "version": "X.x",
          "role": "What this product does in THIS architecture",
          "connectsTo": "What it connects to (by component name)",
          "deploymentNote": "How to deploy (optional)",
          "vendor": {
            "name": "Company Name",
            "website": "https://...",
            "description": "Why contact them",
            "category": "SI|Software|Hardware|Cloud|OT|Security",
            "contactEmail": "sales@company.com",
            "contactPhone": "+1-800-...",
            "contactPage": "https://company.com/contact",
            "contactName": "Sales / Partner Program",
            "region": "Global or Americas"
          }
        },
        "tradeoffs": [{"pro": "...", "con": "..."}],
        "risks": ["..."],
        "costEstimate": {"range": "...", "notes": "..."},
        "standards": ["..."],
        "bestPractices": ["..."],
        "notes": "...",
        "futureRecommendations": ["..."],
        "vendors": []
      }`;

const INTEGRATION_SCHEMA = `{
      "id": "int-from-to",
      "fromNodeId": "source-node-id",
      "toNodeId": "target-node-id",
      "label": "Short connection label",
      "protocol": "MQTT Sparkplug B / OPC UA / REST / SQL / etc.",
      "dataFlow": "What data moves across this connection",
      "description": "Plain-English explanation of how these two components connect in production",
      "setupSteps": ["Step 1: configure X", "Step 2: open port Y", "Step 3: validate with Z"],
      "dataFormat": "e.g. Sparkplug B protobuf on MQTT topic spBv1.0/...",
      "networkNote": "Ports, VLANs, firewall rules, DMZ placement",
      "ports": "5450, 5457, 5459",
      "direction": "inbound|outbound|bidirectional",
      "whoSetsThisUp": "OT systems integrator | internal IT | vendor professional services",
      "estimatedEffort": "e.g. 2-3 days with experienced SI"
    }`;

const ARCH_NODE_SCHEMA = `{
        "overview": "...",
        "purpose": "...",
        "technologies": ["Exact product or protocol name if known"],
        "tradeoffs": [],
        "risks": [],
        "costEstimate": {"range": "n/a", "notes": "Architecture diagram: cost optional"},
        "standards": ["IEC 62443", "ISA-95"],
        "bestPractices": ["..."],
        "notes": "Placement, HA, retention, or site notes",
        "futureRecommendations": [],
        "vendors": []
      }`;

const IMPLEMENTATION_PARTNER_SCHEMA = `{
      "id": "partner-1",
      "name": "Contact or practice lead name if public",
      "company": "Integrator company name",
      "website": "https://...",
      "partnerType": "SI|MSP|Consultant|VAR|OT Specialist",
      "services": ["Historian deployment", "OT/IT integration", "Commissioning"],
      "deploysComponents": ["Edge Connectivity", "Data Platform", "Full stack"],
      "contactEmail": "sales@integrator.com",
      "contactPhone": "+1-...",
      "contactPage": "https://integrator.com/contact",
      "region": "Americas|EMEA|Global",
      "description": "Why this partner fits THIS project: certifications, industry experience"
    }`;

export function buildQuestionPrompt(ctx: ProjectContext): string {
  const answered = [
    "idea",
    "scenario",
    "industry",
    "deployment",
    "facilities",
    "scale",
    "existingSystems",
    "budget",
    "naturalNotes",
  ]
    .filter((key) => ctx[key as keyof ProjectContext])
    .map((key) => `${key}: ${ctx[key as keyof ProjectContext]}`)
    .join("\n");

  const docContext = getFullDocumentContext(ctx);
  const mode = ctx.intakeMode ?? "guided";

  return `Based on this project context, ask ONE intelligent follow-up question to refine the architecture.

INTAKE MODE: ${mode}
${mode === "natural" ? "The user chose NATURAL LANGUAGE mode: do NOT ask structured questions. Respond immediately with: {\"done\": true, \"question\": null}" : ""}

GUIDED MODE RULES (only when intakeMode is "guided"):
1. ALWAYS ask about SCENARIO first if scenario is empty: walk through day-to-day operations, who uses the system, what triggers data flows, what success looks like. Use id: "scenario".
2. Scenario questions should feel like stories, not checklists. Offer chips that are concrete vignettes (e.g. "Operators monitor OEE dashboards", "Field crews sync jobsite photos").
3. Only AFTER scenario is captured, ask about industry, deployment, scale, existing systems, or budget.
4. Never ask about a field already answered below.

Already answered (DO NOT ask about these again):
${answered || "idea only"}

Context:
${JSON.stringify(ctx, null, 2)}

${docContext ? `User-provided documents and files:\n${docContext.slice(0, 8000)}\n` : ""}

If you have enough information (scenario + at least 3 other context fields OR documents/naturalNotes provide sufficient detail), respond:
{"done": true, "question": null}

Otherwise respond:
{"done": false, "question": {"id": "scenario|industry|deployment|facilities|scale|existingSystems|budget", "text": "...", "placeholder": "...", "chips": ["option1", "option2"]}}

CRITICAL: In guided mode, if scenario is missing, your next question MUST have id "scenario". Make chips relevant to their project idea.`;
}

export function buildGraphPrompt(ctx: ProjectContext): string {
  const docContext = getFullDocumentContext(ctx);
  const req = extractProjectRequirements(ctx);
  const requirements = buildRequirementsBlock(ctx);
  const deploymentPattern = getDeploymentPatternBlock(req);
  const intent = ctx.intent ?? "quote";

  const historianHint = ctx.historianFocus
    ? `\nHISTORIAN FOCUS (user selected this on the planning screen): ${ctx.historianFocus}
Anchor the Data Platform / Historian layer on this product family unless the user explicitly contradicted it in natural language.\n`
    : "";

  if (intent === "architecture") {
    return `Generate a HIGH-FIDELITY editable NETWORK ARCHITECTURE DIAGRAM for this industrial project.

INTENT: architecture (NOT a commercial quote: prioritize zones, firewalls, ports, and editable components)

${ARCHITECTURE_RULES}

${ctx.scenario ? `OPERATIONAL SCENARIO:\n${ctx.scenario}\n` : ""}
${ctx.naturalNotes ? `USER'S NATURAL-LANGUAGE CONTEXT:\n${ctx.naturalNotes}\n` : ""}
${historianHint}
${requirements}

${deploymentPattern}

Reference patterns to emulate when relevant:
- Pattern A: Control Network | DMZ (historian / relay) | Corporate (Vision / clients) with firewall ports between zones
- Pattern B: Central server room (TSDB + IDMP + backup) over MPLS to multi-site plant DMZs with taosX / interface agents, plant OPC UA servers below Existing FW
- Pattern C: Classic PI collective with interfaces, smart clients, thin clients, firewalls

${webResearchInstructions(ctx)}

Context:
${JSON.stringify(ctx, null, 2)}

${docContext ? `User-provided documents and files:\n${docContext.slice(0, 12000)}\n` : ""}

Return JSON:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Node Name",
      "parentId": null,
      "depth": 0,
      "kind": "system|zone|component|firewall|network|client|datasource",
      "zone": "Control Network|DMZ|Corporate|Central Server Room|Site A DMZ|...",
      "roleTag": "optional short badge",
      "detail": ${ARCH_NODE_SCHEMA}
    }
  ],
  "integrations": [${INTEGRATION_SCHEMA}],
  "implementationPartners": []
}

Requirements:
- Root = project title (kind: "system", depth 0)
- 4–7 zone nodes at depth 1 (kind: "zone")
- 2–5 components under EACH zone at depth 2 (servers, agents, firewalls, clients, datasources)
- Every cross-zone integration MUST include ports + direction + networkNote
- Minimum 8 integrations covering the real data path
- Do NOT require technologyPick or vendor contacts
- Use real node IDs in integrations.fromNodeId / toNodeId`;
  }

  return `Generate a complete architecture graph for this industrial software project.

INTENT: quote (commercial blueprint with products + outreach)

${QUOTE_RULES}

${ctx.scenario ? `OPERATIONAL SCENARIO (primary driver: design for this story):\n${ctx.scenario}\n` : ""}
${ctx.naturalNotes ? `USER'S NATURAL-LANGUAGE CONTEXT:\n${ctx.naturalNotes}\n` : ""}
${historianHint}
${requirements}

${deploymentPattern}

${webResearchInstructions(ctx)}

Context:
${JSON.stringify(ctx, null, 2)}

${docContext ? `User-provided documents and files:\n${docContext.slice(0, 12000)}\n` : ""}

This can be ANY industrial software system: adapt the architecture to the specific domain. Do NOT default to generic manufacturing unless that is their industry.

Return JSON:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Node Name",
      "parentId": null,
      "depth": 0,
      "kind": "system",
      "detail": ${DETAIL_SCHEMA}
    }
  ],
  "integrations": [${INTEGRATION_SCHEMA}],
  "implementationPartners": [${IMPLEMENTATION_PARTNER_SCHEMA}]
}

Requirements:
- Root node = project name (parentId: null, depth: 0)
- 5-7 top-level domains (depth 1) appropriate to THEIR domain and the reference deployment above
- ONLY return root + depth 1 domains on initial generation: do NOT include depth 2 children yet
- Each domain MUST have exactly ONE technologyPick with a REAL commercial product and vendor contact info
- technologies[] must contain only that one exact product name
- integrations[] MUST connect EVERY adjacent domain pair in the data path with rich setupSteps (minimum 5 integrations)
- implementationPartners[] MUST include 3-5 real systems integrators or OT consultancies who deploy stacks like this: search the web for "${ctx.industry ?? "industrial"} systems integrator" + product names
- Use real node IDs in integrations.fromNodeId and integrations.toNodeId
- Pick best-fit products per layer via web research: only use TDengine if user explicitly requested it
- Domain labels should match production deployments (e.g. "Edge Connectivity", "Data Platform", "Analytics")`;
}

export function buildExpandPrompt(
  ctx: ProjectContext,
  parent: StackyNode,
  siblingLabels: string[]
): string {
  const req = extractProjectRequirements(ctx);
  const requirements = buildRequirementsBlock(ctx);
  const deploymentPattern = getDeploymentPatternBlock(req);
  const parentPick = parent.detail.technologyPick;
  const intent = ctx.intent ?? "quote";

  if (intent === "architecture") {
    return `Expand the "${parent.label}" zone/component in this NETWORK ARCHITECTURE DIAGRAM with 4-6 child nodes.

INTENT: architecture
${ARCHITECTURE_RULES}

${requirements}

${deploymentPattern}

Project context:
${JSON.stringify(ctx, null, 2)}

Parent: ${parent.label} (id: ${parent.id}, kind: ${parent.kind ?? "zone"}, zone: ${parent.zone ?? parent.label})
Parent overview: ${parent.detail.overview}
Sibling zones/domains: ${siblingLabels.join(", ")}

CRITICAL EXPAND RULES:
- Return ONLY new child nodes (depth ${parent.depth + 1}) with parentId "${parent.id}"
- Children are concrete diagram elements: servers, agents, firewalls, switches, clients, OPC servers, NAS, etc.
- Set kind + zone on every child (inherit zone from parent unless crossing a boundary)
- If expanding a zone, include a firewall sibling/child when that zone has an external boundary
- integrations[] must include ports + direction + networkNote for every new link
- technologyPick / vendor contacts are optional: accuracy of architecture over sales

Return JSON:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Child Name",
      "parentId": "${parent.id}",
      "depth": ${parent.depth + 1},
      "kind": "component|firewall|network|client|datasource",
      "zone": "${parent.zone ?? parent.label}",
      "roleTag": "optional",
      "detail": ${ARCH_NODE_SCHEMA}
    }
  ],
  "integrations": [${INTEGRATION_SCHEMA}]
}`;
  }

  return `Expand the "${parent.label}" node in this industrial software architecture with 4-6 child components.

INTENT: quote
${QUOTE_RULES}

${requirements}

${deploymentPattern}

${webResearchInstructions(ctx)}

Project context:
${JSON.stringify(ctx, null, 2)}

Parent: ${parent.label}
Parent overview: ${parent.detail.overview}
Parent purpose: ${parent.detail.purpose}
Parent node ID: ${parent.id}
${parentPick ? `Parent technology: ${parentPick.product} by ${parentPick.vendor.name}: children must decompose how this product is deployed in production` : ""}
Sibling domains: ${siblingLabels.join(", ")}

CRITICAL EXPAND RULES:
- Return ONLY new child nodes (depth ${parent.depth + 1}) with parentId "${parent.id}"
- Each child is a deployable unit (cluster, connector, dashboard tier, security boundary): NOT another vague domain
- If parent is Data Platform/Historian: children MUST decompose the historian deployment (ingest connector, cluster, retention, query layer, dashboards)
- Each child needs exactly ONE technologyPick with real vendor contacts from web search
- integrations[] must connect children to each other AND to sibling domains: include setupSteps, networkNote, whoSetsThisUp on every integration

Return JSON:
{
  "nodes": [
    {
      "id": "unique-id",
      "label": "Child Name",
      "parentId": "${parent.id}",
      "depth": ${parent.depth + 1},
      "detail": ${DETAIL_SCHEMA}
    }
  ],
  "integrations": [${INTEGRATION_SCHEMA}]
}`;
}

export type QuestionResponse = {
  done: boolean;
  question: Question | null;
};

function normalizeDetail(
  detail: NodeDetail & { technologyPicks?: TechnologyPick[] }
): NodeDetail {
  const pick = detail.technologyPick ?? detail.technologyPicks?.[0];
  const existing = detail.vendors ?? [];

  return {
    ...detail,
    technologyPick: pick,
    technologies: pick
      ? [`${pick.product}${pick.version ? ` ${pick.version}` : ""}`]
      : detail.technologies ?? [],
    vendors: pick
      ? [pick.vendor, ...existing.filter((v) => v.name !== pick.vendor.name)]
      : existing,
  };
}

export function buildAlternativePrompt(
  ctx: ProjectContext,
  node: StackyNode,
  currentPick: TechnologyPick,
  reason: string,
  rejectedProducts: string[]
): string {
  const requirements = buildRequirementsBlock(ctx);

  return `The user rejected a technology pick in their industrial software architecture. Find ONE definitive replacement.

${requirements}

${webResearchForComponent(ctx, node)}

Project context:
${JSON.stringify(ctx, null, 2)}

Component: ${node.label}
Current pick (REJECTED): ${currentPick.product} by ${currentPick.vendor.name}
Role in architecture: ${currentPick.role}
User's reason for rejection: ${reason}

Also rejected (do NOT suggest these): ${rejectedProducts.join(", ") || "none"}

Return JSON:
{
  "technologyPick": {
    "name": "Vendor Name",
    "product": "Exact Product Name",
    "version": "X.x",
    "role": "What this product does in THIS architecture",
    "connectsTo": "What it connects to",
    "deploymentNote": "How to deploy",
    "vendor": {
      "name": "Company Name",
      "website": "https://...",
      "description": "Why this is a better fit given their rejection reason",
      "category": "Software|Hardware|Cloud|Security",
      "contactEmail": "sales@...",
      "contactPhone": "+1-...",
      "contactPage": "https://...",
      "contactName": "Sales",
      "region": "Global"
    }
  },
  "summary": "1-2 sentence explanation of why this alternative fits better given their feedback"
}

Rules:
- Pick exactly ONE replacement product: a real, commercially available solution found via web search
- Must be different from the rejected product and all rejectedProducts
- Address the user's stated reason directly in the role and summary
- Include real vendor contact information verified from the vendor's website`;
}

export type AlternativeResponse = {
  technologyPick: TechnologyPick;
  summary: string;
};

export function buildOutreachEmailPrompt(
  ctx: ProjectContext,
  profile: OutreachProfile,
  contact: {
    vendorName: string;
    product?: string;
    role?: string;
    nodeLabel: string;
    vendorDescription?: string;
  }
): string {
  return `Write a professional vendor outreach email for an industrial software architecture project.

Sender:
- Name: ${profile.name}
- Email: ${profile.email}
${profile.company ? `- Company: ${profile.company}` : ""}
${profile.calendlyUrl ? `- Calendly scheduling link to include: ${profile.calendlyUrl}` : ""}

Recipient vendor: ${contact.vendorName}
Product: ${contact.product ?? "their solution"}
Architecture component: ${contact.nodeLabel}
Product role: ${contact.role ?? "part of the stack"}
${contact.vendorDescription ? `About vendor: ${contact.vendorDescription}` : ""}

Project context:
${JSON.stringify(ctx, null, 2)}

Return JSON:
{
  "subject": "Concise professional subject line",
  "body": "Full email body with greeting, 2-3 short paragraphs explaining the project and why we need their product, clear ask for a call/demo, sign-off with sender name. ${profile.calendlyUrl ? "Include the Calendly link naturally for scheduling." : "Ask them to suggest times for a call."}"
}

Tone: professional, direct, ready to send. No placeholders like [Your Name]: use actual sender info.`;
}

export function buildResearchTechnologyPrompt(
  ctx: ProjectContext,
  node: StackyNode,
  siblingPicks: string[] = []
): string {
  const requirements = buildRequirementsBlock(ctx);

  return `Research and select ONE specific commercial product for this architecture component. The user will contact the vendor directly: you must provide real outreach info.

${requirements}

${webResearchForComponent(ctx, node)}

Project:
${JSON.stringify(ctx, null, 2)}

Component: ${node.label}
Purpose: ${node.detail.purpose}
Overview: ${node.detail.overview}
${siblingPicks.length ? `Other products already selected in this architecture (avoid duplicates): ${siblingPicks.join(", ")}` : ""}

Return JSON:
{
  "technologyPick": {
    "name": "Vendor Company Name",
    "product": "Exact Commercial Product Name (not a category)",
    "version": "current version if known",
    "role": "Specific role in THIS ${ctx.industry ?? "industrial"} project",
    "connectsTo": "Named components it integrates with",
    "deploymentNote": "How to deploy for ${ctx.deployment ?? "their"} setup",
    "vendor": {
      "name": "Company Name",
      "website": "https://real-vendor-website.com",
      "description": "One sentence on why this vendor for this use case",
      "category": "Software|Hardware|Cloud|Security|SI",
      "contactEmail": "publicly listed sales email",
      "contactPhone": "publicly listed phone if available",
      "contactPage": "https://vendor.com/contact or /sales",
      "contactName": "Sales / Partner team",
      "region": "Global or specific region"
    }
  }
}

RULES:
- Product must be a real, purchasable commercial solution verified via web search: NOT a protocol, category, or open-source project name alone
- contactEmail or contactPage is REQUIRED: search the vendor site; user must be able to click Reach Out
- Tailor to ${ctx.industry ?? "their industry"}, ${ctx.scale ?? "their scale"}, ${ctx.deployment ?? "their deployment"}
- If they have existing systems (${ctx.existingSystems ?? "unknown"}), prefer compatible vendors
- Use the latest ${CURRENT_YEAR} product version you find on the vendor site`;
}

export function parseGraphResponse(result: {
  nodes: StackyNode[];
  integrations?: Integration[];
  implementationPartners?: ImplementationPartner[];
}): {
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners: ImplementationPartner[];
} {
  const { nodes, integrations } = llmNodesToStackyNodes(
    result.nodes,
    result.integrations ?? []
  );
  return {
    nodes,
    integrations,
    implementationPartners: result.implementationPartners ?? [],
  };
}

export function llmNodesToStackyNodes(
  llmNodes: Array<{
    id: string;
    label: string;
    parentId: string | null;
    depth: number;
    detail: StackyNode["detail"];
    kind?: StackyNode["kind"];
    zone?: string;
    roleTag?: string;
  }>,
  integrations: Integration[] = [],
  existingNodes: StackyNode[] = []
): { nodes: StackyNode[]; integrations: Integration[] } {
  const nodes = llmNodes.map((n) => ({
    id: n.id,
    label: n.label,
    parentId: n.parentId,
    depth: n.depth,
    collapsed: false,
    expanded: n.depth <= 1,
    position: { x: 0, y: 0 },
    kind:
      n.kind ??
      (n.depth === 0 ? "system" : n.depth === 1 ? "zone" : "component"),
    zone: n.zone,
    roleTag: n.roleTag,
    detail: normalizeDetail({
      ...n.detail,
      vendors: n.detail?.vendors ?? [],
      technologies: n.detail?.technologies ?? [],
      tradeoffs: n.detail?.tradeoffs ?? [],
      risks: n.detail?.risks ?? [],
      costEstimate: n.detail?.costEstimate ?? {
        range: "n/a",
        notes: "",
      },
      standards: n.detail?.standards ?? [],
      bestPractices: n.detail?.bestPractices ?? [],
      notes: n.detail?.notes ?? "",
      futureRecommendations: n.detail?.futureRecommendations ?? [],
      overview: n.detail?.overview ?? n.label,
      purpose: n.detail?.purpose ?? n.label,
    }),
  }));

  const mergedNodes =
    existingNodes.length > 0
      ? [
          ...existingNodes.map((existing) => {
            const updated = nodes.find((n) => n.id === existing.id);
            return updated ?? existing;
          }),
          ...nodes.filter((n) => !existingNodes.some((e) => e.id === n.id)),
        ]
      : nodes;

  const mergedIntegrations =
    integrations.length > 0
      ? mergeIntegrations(integrations, buildIntegrationsFromNodes(mergedNodes))
      : buildIntegrationsFromNodes(mergedNodes);

  return { nodes: mergedNodes, integrations: mergedIntegrations };
}

function mergeIntegrations(
  primary: Integration[],
  derived: Integration[]
): Integration[] {
  const byId = new Map<string, Integration>();
  derived.forEach((d) => byId.set(d.id, d));
  primary.forEach((p) => {
    const existing = byId.get(p.id);
    byId.set(p.id, existing ? { ...existing, ...p } : p);
  });
  return Array.from(byId.values());
}
