import type { ProjectContext, StackyNode, TechnologyPick, Vendor } from "@/lib/types";
import { VENDORS } from "./vendors";

const ALTERNATIVES: Record<string, TechnologyPick> = {
  tdengine: {
    name: "Timescale",
    product: "TimescaleDB Cloud",
    version: "2.x",
    role: "PostgreSQL-compatible time-series store with SQL analytics",
    connectsTo: "Grafana dashboards, Kafka consumers",
    deploymentNote: "Managed cloud or self-hosted on existing Postgres ops",
    vendor: {
      name: "Timescale",
      website: "https://www.timescale.com",
      description: "Time-series on PostgreSQL: familiar SQL, strong ecosystem",
      category: "Software",
      contactEmail: "sales@timescale.com",
      contactPage: "https://www.timescale.com/contact",
      contactName: "Sales",
      region: "Global",
    },
  },
  hivemq: {
    name: "EMQ Technologies",
    product: "EMQX Enterprise",
    version: "5.x",
    role: "High-throughput MQTT broker with rule engine and Sparkplug B",
    connectsTo: "Edge gateways → TSDB ingest",
    vendor: {
      name: "EMQ Technologies",
      website: "https://www.emqx.com",
      description: "Open-core MQTT platform with enterprise HA and clustering",
      category: "Software",
      contactEmail: "contact@emqx.com",
      contactPage: "https://www.emqx.com/en/contact",
      contactName: "Sales",
      region: "Global",
    },
  },
  kepware: {
    name: "Prosys OPC",
    product: "Prosys OPC UA Client + Converter",
    role: "OPC UA connectivity with lightweight edge deployment",
    connectsTo: "PLCs → MQTT publish",
    vendor: VENDORS.prosys,
  },
  grafana: {
    name: "Datadog",
    product: "Datadog Industrial Monitoring",
    role: "Unified observability: metrics, logs, traces, and alerting",
    connectsTo: "TSDB / Kafka → on-call routing",
    vendor: {
      name: "Datadog",
      website: "https://www.datadoghq.com",
      description: "Full-stack observability with industrial integrations",
      category: "Software",
      contactPage: "https://www.datadoghq.com/partner/contact/",
      contactEmail: "info@datadoghq.com",
      contactName: "Sales",
      region: "Global",
    },
  },
  claroty: {
    name: "Nozomi Networks",
    product: "Guardian",
    role: "OT/ICS visibility, threat detection, and asset inventory",
    connectsTo: "OT network span ports",
    vendor: {
      name: "Nozomi Networks",
      website: "https://www.nozominetworks.com",
      description: "OT cybersecurity and network monitoring for critical infrastructure",
      category: "Security",
      contactPage: "https://www.nozominetworks.com/contact",
      contactEmail: "info@nozominetworks.com",
      contactName: "Sales",
      region: "Global",
    },
  },
  hashicorp: {
    name: "Pulumi",
    product: "Pulumi Cloud",
    role: "Infrastructure-as-code using TypeScript/Python: multi-cloud",
    connectsTo: "AWS / Azure / on-prem K8s",
    vendor: {
      name: "Pulumi",
      website: "https://www.pulumi.com",
      description: "Modern IaC with real programming languages and policy-as-code",
      category: "Software",
      contactPage: "https://www.pulumi.com/contact/",
      contactEmail: "sales@pulumi.com",
      contactName: "Sales",
      region: "Global",
    },
  },
  pagerduty: {
    name: "Atlassian",
    product: "Opsgenie",
    role: "Incident management and on-call scheduling",
    connectsTo: "Grafana / monitoring webhooks → Slack/Teams",
    vendor: {
      name: "Atlassian",
      website: "https://www.atlassian.com/software/opsgenie",
      description: "Enterprise incident response integrated with Jira and Confluence",
      category: "Software",
      contactPage: "https://www.atlassian.com/company/contact",
      contactName: "Sales",
      region: "Global",
    },
  },
  siemens: {
    name: "Rockwell Automation",
    product: "ControlLogix 5580",
    role: "Allen-Bradley PLC platform for North American industrial sites",
    connectsTo: "Kepware / OPC UA driver",
    vendor: VENDORS.rockwell,
  },
  influxdb: {
    name: "TDengine",
    product: "TDengine Enterprise",
    version: "3.x",
    role: "High-compression industrial time-series database",
    connectsTo: "Kafka ingest → Grafana",
    vendor: VENDORS.tdengine,
  },
};

function matchAlternativeKey(product: string): string | null {
  const lower = product.toLowerCase();
  for (const key of Object.keys(ALTERNATIVES)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

function tailorRole(pick: TechnologyPick, nodeLabel: string, reason: string): TechnologyPick {
  const reasonNote = reason.trim().slice(0, 120);
  return {
    ...pick,
    role: `${pick.role} (selected because: ${reasonNote || "better fit for your constraints"})`,
    connectsTo: pick.connectsTo?.replace(/TDengine|HiveMQ|Grafana|Kepware/gi, (m) => {
      const alt = matchAlternativeKey(m);
      return alt ? ALTERNATIVES[alt].product.split(" ")[0] : m;
    }),
  };
}

export type AlternativeResult = {
  technologyPick: TechnologyPick;
  summary: string;
  updatedOverview?: string;
};

export function findAlternativeTechnology(
  node: StackyNode,
  currentPick: TechnologyPick,
  reason: string,
  ctx: ProjectContext,
  rejectedProducts: string[] = []
): AlternativeResult {
  const key = matchAlternativeKey(currentPick.product);
  let alt = key ? ALTERNATIVES[key] : null;

  // If primary alt was already rejected, try secondary keys
  if (alt && rejectedProducts.some((r) => r.toLowerCase().includes(alt!.product.toLowerCase()))) {
    const fallbacks = Object.values(ALTERNATIVES).filter(
      (a) =>
        !rejectedProducts.some((r) => r.toLowerCase().includes(a.product.toLowerCase())) &&
        a.product !== currentPick.product
    );
    alt = fallbacks[0] ?? null;
  }

  if (!alt) {
    alt = {
      name: "Confluent",
      product: "Confluent Cloud",
      version: "Kafka 3.x",
      role: `Enterprise-grade replacement for ${currentPick.product} in the ${node.label} layer`,
      connectsTo: currentPick.connectsTo,
      vendor: VENDORS.confluent,
    };
  }

  const tailored = tailorRole(alt, node.label, reason);
  const summary = `Replaced ${currentPick.product} with ${tailored.product} for ${node.label}. ${
    reason.trim()
      ? `Based on your feedback: "${reason.trim().slice(0, 200)}"`
      : "Selected the next-best fit for your architecture."
  }`;

  return {
    technologyPick: tailored,
    summary,
    updatedOverview: `${node.detail.overview} Swapped ${currentPick.product} → ${tailored.product} per your requirements.`,
  };
}

export function applyTechnologyPick(
  node: StackyNode,
  pick: TechnologyPick,
  summary?: string
): StackyNode {
  const techLabel = `${pick.product}${pick.version ? ` ${pick.version}` : ""}`;
  const vendors: Vendor[] = [pick.vendor];

  return {
    ...node,
    detail: {
      ...node.detail,
      technologyPick: pick,
      technologies: [techLabel],
      vendors,
      notes: summary
        ? `${node.detail.notes}\n\nSwap note: ${summary}`.trim()
        : node.detail.notes,
    },
  };
}
