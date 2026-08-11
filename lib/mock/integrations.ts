import type { Integration, StackyNode } from "@/lib/types";

type IntegrationRule = {
  fromLabel: string;
  toLabel: string;
  label: string;
  protocol: string;
  dataFlow: string;
  description: string;
};

const DOMAIN_RULES: IntegrationRule[] = [
  {
    fromLabel: "Edge",
    toLabel: "Data Platform",
    label: "Telemetry ingest",
    protocol: "MQTT Sparkplug B / OPC UA",
    dataFlow: "Sensor readings, alarms, device state, quality codes",
    description:
      "Edge gateways (Kepware → HiveMQ) publish normalized Sparkplug B topics; Kafka consumers write to TDengine.",
  },
  {
    fromLabel: "Data Platform",
    toLabel: "Analytics",
    label: "Analytics feed",
    protocol: "SQL / REST API / Kafka topics",
    dataFlow: "Aggregated telemetry, events, batch exports",
    description:
      "TDengine SQL queries and Kafka streams feed Grafana dashboards and ML feature pipelines.",
  },
  {
    fromLabel: "Analytics",
    toLabel: "Operations",
    label: "Alerting & KPIs",
    protocol: "Grafana Alerting → PagerDuty webhooks",
    dataFlow: "Threshold breaches, SLO violations, anomaly scores",
    description:
      "Grafana alert rules route to PagerDuty for on-call escalation with runbook links.",
  },
  {
    fromLabel: "Edge",
    toLabel: "Security",
    label: "OT asset discovery",
    protocol: "Passive network monitoring",
    dataFlow: "Device fingerprints, vulnerability data, traffic metadata",
    description:
      "Claroty xDome passively discovers OT assets on edge VLANs and reports to security domain.",
  },
  {
    fromLabel: "Deployment",
    toLabel: "Data Platform",
    label: "Infra provisioning",
    protocol: "Terraform → AWS EKS / on-prem K8s",
    dataFlow: "Cluster configs, secrets, networking",
    description:
      "Terraform provisions EKS clusters and Vault injects credentials for TDengine and Kafka.",
  },
  {
    fromLabel: "Security",
    toLabel: "Data Platform",
    label: "Encrypted transit",
    protocol: "TLS 1.3 + mTLS",
    dataFlow: "Certificate rotation, policy enforcement",
    description:
      "All cross-domain traffic terminates TLS at ingress; Vault manages cert lifecycle.",
  },
];

const COMPONENT_RULES: IntegrationRule[] = [
  {
    fromLabel: "OPC UA",
    toLabel: "MQTT",
    label: "Protocol bridge",
    protocol: "OPC UA → MQTT (Sparkplug B)",
    dataFlow: "PLC tags → normalized MQTT topics",
    description: "Kepware publishes OPC UA address space as Sparkplug B over MQTT to HiveMQ.",
  },
  {
    fromLabel: "MQTT",
    toLabel: "TSDB",
    label: "Time-series write",
    protocol: "MQTT → Kafka → TDengine",
    dataFlow: "High-frequency telemetry inserts",
    description: "Kafka Connect sink batches MQTT payloads into TDengine supertables.",
  },
  {
    fromLabel: "Modbus",
    toLabel: "OPC UA",
    label: "Legacy bridge",
    protocol: "Modbus TCP polling → OPC UA server",
    dataFlow: "Register maps → OPC UA nodes",
    description: "Kepware polls Modbus devices and exposes unified OPC UA namespace.",
  },
  {
    fromLabel: "PLCs",
    toLabel: "OPC UA",
    label: "Control data",
    protocol: "S7 / EtherNet/IP → OPC UA",
    dataFlow: "Machine state, setpoints, interlocks (read-only)",
    description: "PLC drivers in Kepware expose deterministic control data via OPC UA.",
  },
  {
    fromLabel: "TSDB",
    toLabel: "Dashboards",
    label: "Visualization",
    protocol: "TDengine SQL → Grafana",
    dataFlow: "Historical queries, downsampled aggregates",
    description: "Grafana TDengine plugin queries supertables for OEE and KPI dashboards.",
  },
  {
    fromLabel: "Historian",
    toLabel: "TSDB",
    label: "Archival sync",
    protocol: "Batch ETL / replication",
    dataFlow: "Compressed historical archives",
    description: "Long-term historian data replicates to TDengine cold storage tier.",
  },
  {
    fromLabel: "AI / ML",
    toLabel: "Dashboards",
    label: "Model outputs",
    protocol: "REST API / Kafka",
    dataFlow: "Anomaly scores, predictions, recommendations",
    description: "ML inference results published to Grafana annotations and alert channels.",
  },
  {
    fromLabel: "Alerts",
    toLabel: "Monitoring",
    label: "Incident routing",
    protocol: "Webhook",
    dataFlow: "Alert payloads, severity, runbook URLs",
    description: "Alert rules forward to PagerDuty with escalation policies per site.",
  },
];

function findNodeByLabel(nodes: StackyNode[], label: string): StackyNode | undefined {
  return nodes.find((n) => n.label === label);
}

function productFor(node: StackyNode): string {
  return node.detail.technologyPick?.product ?? node.label;
}

function buildDescription(from: StackyNode, to: StackyNode, rule: IntegrationRule): string {
  const fromProduct = productFor(from);
  const toProduct = productFor(to);

  if (from.detail.technologyPick || to.detail.technologyPick) {
    return `${fromProduct} integrates with ${toProduct} via ${rule.protocol}. ${rule.dataFlow}.`;
  }

  return rule.description;
}

function applyRules(nodes: StackyNode[], rules: IntegrationRule[]): Integration[] {
  const integrations: Integration[] = [];

  rules.forEach((rule) => {
    const from = findNodeByLabel(nodes, rule.fromLabel);
    const to = findNodeByLabel(nodes, rule.toLabel);
    if (!from || !to) return;

    integrations.push({
      id: `int-${from.id}-${to.id}`,
      fromNodeId: from.id,
      toNodeId: to.id,
      label: rule.label,
      protocol: rule.protocol,
      dataFlow: rule.dataFlow,
      description: buildDescription(from, to, rule),
    });
  });

  return integrations;
}

export function generateIntegrations(nodes: StackyNode[]): Integration[] {
  const hasDepth2 = nodes.some((n) => n.depth >= 2);
  const rules = hasDepth2
    ? [...DOMAIN_RULES, ...COMPONENT_RULES]
    : DOMAIN_RULES;

  return applyRules(nodes, rules);
}

export function getNodeIntegrations(
  integrations: Integration[],
  nodeId: string
): { outgoing: Integration[]; incoming: Integration[] } {
  return {
    outgoing: integrations.filter((i) => i.fromNodeId === nodeId),
    incoming: integrations.filter((i) => i.toNodeId === nodeId),
  };
}

export function getVisibleIntegrations(
  integrations: Integration[],
  visibleNodeIds: Set<string>
): Integration[] {
  return integrations.filter(
    (i) => visibleNodeIds.has(i.fromNodeId) && visibleNodeIds.has(i.toNodeId)
  );
}
