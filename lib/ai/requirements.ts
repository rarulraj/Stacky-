import type { ProjectContext } from "@/lib/types";
import { getFullDocumentContext } from "@/lib/files/document-context";

export type ArchitecturePattern =
  | "historian"
  | "scada"
  | "iot-platform"
  | "fleet"
  | "generic";

export type ProjectRequirements = {
  architecturePattern: ArchitecturePattern;
  wantsTDengine: boolean;
  wantsHistorian: boolean;
  wantsIndustrialAnalytics: boolean;
  mandatoryProducts: string[];
  preferredVendors: string[];
  webSearchQueries: string[];
};

function projectText(ctx: ProjectContext): string {
  const docContext = getFullDocumentContext(ctx);
  return [
    ctx.idea,
    ctx.historianFocus,
    ctx.scenario,
    ctx.naturalNotes,
    ctx.industry,
    ctx.deployment,
    ctx.facilities,
    ctx.scale,
    ctx.existingSystems,
    ctx.budget,
    ctx.documents,
    docContext,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const HISTORIAN_FOCUS_VENDORS: Record<string, { product: string; vendor: string }> =
  {
    tdengine: { product: "TDengine Enterprise", vendor: "TDengine" },
    "pi-system": { product: "AVEVA PI System", vendor: "AVEVA" },
    canary: { product: "Canary Labs Historian", vendor: "Canary Labs" },
    ignition: { product: "Ignition Tag Historian", vendor: "Inductive Automation" },
    influx: { product: "InfluxDB Enterprise", vendor: "InfluxData" },
  };

export function extractProjectRequirements(
  ctx: ProjectContext
): ProjectRequirements {
  const text = projectText(ctx);
  const year = new Date().getFullYear();
  const focus = ctx.historianFocus
    ? HISTORIAN_FOCUS_VENDORS[ctx.historianFocus]
    : undefined;

  const wantsTDengine =
    /tdengine|taos\s*data/i.test(text) || ctx.historianFocus === "tdengine";
  const wantsHistorian =
    Boolean(focus) ||
    /historian|time.?series|tsdb|data historian|plant data|operational data store/i.test(
      text
    );
  const wantsIndustrialAnalytics =
    /industrial analytics|\bia[\s-]level\b|oee|predictive maintenance|industrial ai|manufacturing analytics/i.test(
      text
    );

  let architecturePattern: ArchitecturePattern = "generic";
  if (wantsTDengine || wantsHistorian || wantsIndustrialAnalytics) {
    architecturePattern = "historian";
  } else if (/scada|hmi|plc|dcs/i.test(text)) {
    architecturePattern = "scada";
  } else if (/fleet|logistics|telematics|asset track/i.test(text)) {
    architecturePattern = "fleet";
  } else if (/iot platform|iiot|edge platform|digital twin/i.test(text)) {
    architecturePattern = "iot-platform";
  }

  const mandatoryProducts: string[] = [];
  const preferredVendors: string[] = [];

  if (focus) {
    mandatoryProducts.push(focus.product);
    preferredVendors.push(focus.vendor);
  } else if (wantsTDengine) {
    // Only force TDengine when the user explicitly names it (no card pick)
    mandatoryProducts.push("TDengine Enterprise");
    preferredVendors.push("TDengine");
  }

  if (/grafana/i.test(text)) preferredVendors.push("Grafana Labs");
  if (/kepware|ptc/i.test(text)) preferredVendors.push("PTC");
  if (/hivemq|mqtt/i.test(text)) preferredVendors.push("HiveMQ");
  if (/kafka|confluent/i.test(text)) preferredVendors.push("Confluent");
  if (/aveva|pi system|osisoft/i.test(text)) preferredVendors.push("AVEVA");
  if (/canary/i.test(text)) preferredVendors.push("Canary Labs");
  if (/influx/i.test(text)) preferredVendors.push("InfluxData");
  if (/timescale/i.test(text)) preferredVendors.push("Timescale");

  const industry = ctx.industry ?? "industrial";
  const webSearchQueries = [
    `${industry} historian reference architecture ${year}`,
    `${industry} OT IT integration deployment case study ${year}`,
    `${industry} systems integrator industrial data platform ${year}`,
    `industrial analytics time series stack comparison ${year}`,
  ];

  if (focus) {
    webSearchQueries.unshift(
      `${focus.product} deployment architecture ${industry} ${year}`
    );
  } else if (wantsTDengine) {
    webSearchQueries.unshift(
      `TDengine enterprise deployment ${industry} ${year}`
    );
  }

  return {
    architecturePattern,
    wantsTDengine,
    wantsHistorian,
    wantsIndustrialAnalytics,
    mandatoryProducts,
    preferredVendors,
    webSearchQueries,
  };
}

export function buildRequirementsBlock(ctx: ProjectContext): string {
  const req = extractProjectRequirements(ctx);
  const lines: string[] = [
    "USER REQUIREMENTS (HIGHEST PRIORITY: override generic defaults):",
  ];

  if (req.mandatoryProducts.length > 0) {
    lines.push(
      `- MANDATORY products (must appear as technologyPick on the matching domain): ${req.mandatoryProducts.join(", ")}`
    );
  }

  if (req.preferredVendors.length > 0) {
    lines.push(`- Preferred vendors when compatible: ${req.preferredVendors.join(", ")}`);
  }

  if (req.wantsHistorian || req.wantsIndustrialAnalytics) {
    lines.push(
      "- User wants an IA-level industrial data historian: architecture MUST include: Edge/OT ingest → stream/bus → time-series store → analytics/dashboards → alerting"
    );
    if (!req.wantsTDengine) {
      lines.push(
        "- Pick the BEST FIT commercial historian for their industry, scale, and deployment via web search (e.g. TDengine, AVEVA PI, Timescale, InfluxDB Enterprise, Canary Labs): do NOT default to one vendor"
      );
    }
    lines.push(
      '- Include a top-level domain labeled "Data Platform" or "Historian" with a researched technologyPick'
    );
  }

  if (ctx.historianFocus && req.mandatoryProducts.length > 0) {
    lines.push(
      `- User selected historian planning focus "${ctx.historianFocus}": use ${req.mandatoryProducts[0]} for the historian/time-series layer`
    );
  } else if (req.wantsTDengine) {
    lines.push(
      "- User explicitly asked for TDengine: use TDengine Enterprise for the historian/time-series layer"
    );
  }

  lines.push(
    `- Architecture pattern: ${req.architecturePattern}: model real production deployments, not generic boxes`
  );

  lines.push(
    `- Web search these deployment references before answering:\n${req.webSearchQueries.map((q) => `  • "${q}"`).join("\n")}`
  );

  return lines.join("\n");
}
