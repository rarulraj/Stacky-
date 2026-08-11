import type { NodeDetail } from "@/lib/types";
import {
  detailFromPick,
  getTechnologyPickForLabel,
} from "@/lib/mock/vendors";

function detail(partial: Partial<NodeDetail> & Pick<NodeDetail, "overview" | "purpose">): NodeDetail {
  return {
    technologies: [],
    tradeoffs: [],
    risks: [],
    costEstimate: { range: "TBD", notes: "" },
    standards: [],
    bestPractices: [],
    notes: "",
    futureRecommendations: [],
    vendors: [],
    ...partial,
  };
}

export const ROOT_DETAILS: Record<string, NodeDetail> = {
  Edge: detail({
    overview: "The edge layer connects field assets, sensors, equipment, and devices to your software platform.",
    purpose: "Bridges physical operations and software by collecting real-time data at the source with minimal latency.",
    technologies: ["OPC UA", "MQTT", "Modbus TCP", "Edge gateways", "IoT hubs", "Mobile SDKs"],
    tradeoffs: [
      { pro: "Low latency at source", con: "Distributed management complexity" },
      { pro: "Works offline", con: "Edge hardware costs per site" },
    ],
    risks: ["Protocol fragmentation", "Legacy device compatibility", "Edge security exposure"],
    costEstimate: { range: "$20k–$150k per site", notes: "Depends on device count and gateway hardware" },
    standards: ["OPC UA (IEC 62541)", "MQTT Sparkplug B", "ISA-95"],
    bestPractices: ["Standardize on OPC UA where possible", "Deploy edge gateways with local buffering", "Segment OT networks"],
    notes: "Start with a pilot site before rolling out across all {facilities} locations.",
    futureRecommendations: ["Edge ML inference", "Digital twin sync", "5G private networks"],
  }),
  "Data Platform": detail({
    overview: "Central data store for operational telemetry, events, and business data across your industrial software stack.",
    purpose: "Single source of truth for historical and real-time data across {facilities} sites.",
    technologies: ["Time-series DB", "Apache Kafka", "MinIO / S3", "PostgreSQL", "Redis", "Data lake"],
    tradeoffs: [
      { pro: "Massive ingest throughput", con: "Requires capacity planning" },
      { pro: "SQL + time-series unified", con: "Team upskilling needed" },
    ],
    risks: ["Data retention cost at scale", "Single point of failure without HA", "Schema drift across sites"],
    costEstimate: { range: "$50k–$500k", notes: "Varies with {scale} data volume and retention policy" },
    standards: ["ISA-88", "ISA-95", "ISO 27001 for data governance"],
    bestPractices: ["Tiered storage (hot/warm/cold)", "Automated backups with tested restore", "Data quality monitoring"],
    notes: "Right-size storage and retention for {scale} workloads at {deployment} scale.",
    futureRecommendations: ["Data mesh per plant", "Real-time lakehouse", "Cross-plant federation"],
  }),
  Analytics: detail({
    overview: "Turn operational data into insights, dashboards, predictions, and automated actions.",
    purpose: "Enable data-driven decisions across {industry} operations.",
    technologies: ["Grafana", "Python / ML pipelines", "Apache Flink", "Jupyter", "Custom dashboards"],
    tradeoffs: [
      { pro: "High business value", con: "Requires data science talent" },
      { pro: "Real-time alerting", con: "Alert fatigue if not tuned" },
    ],
    risks: ["Garbage-in-garbage-out", "Model drift in production", "Integration complexity"],
    costEstimate: { range: "$30k–$300k", notes: "Build vs buy for ML components" },
    standards: ["OEE calculation (ISO 22400)", "Six Sigma metrics"],
    bestPractices: ["Start with descriptive analytics", "Define KPIs with operations team", "Version ML models"],
    notes: "Phase 1: dashboards. Phase 2: anomaly detection. Phase 3: prescriptive AI.",
    futureRecommendations: ["Copilot for operators", "Automated root cause analysis", "Digital twin simulation"],
  }),
  Security: detail({
    overview: "Defense-in-depth security across OT/IT boundary, identity, and data protection.",
    purpose: "Protect critical infrastructure and sensitive operational data in a {deployment} environment.",
    technologies: ["Zero Trust NAC", "SIEM", "Vault / KMS", "OT firewalls", "Certificate management"],
    tradeoffs: [
      { pro: "Regulatory compliance", con: "Can slow OT agility" },
      { pro: "Breach prevention", con: "Ongoing operational overhead" },
    ],
    risks: ["Ransomware targeting OT", "Insider threats", "Unpatched legacy systems"],
    costEstimate: { range: "$40k–$250k", notes: "Annual security operations included" },
    standards: ["IEC 62443", "NIST CSF", "ISO 27001"],
    bestPractices: ["Network segmentation (Purdue model)", "MFA for all remote access", "Regular penetration testing"],
    notes: "Security is not optional for {industry} — bake it in from day one.",
    futureRecommendations: ["SOC automation", "AI threat detection", "Supply chain security"],
  }),
  Deployment: detail({
    overview: "Infrastructure and CI/CD for reliable, repeatable deployments across sites.",
    purpose: "Standardize how software and configurations roll out to {facilities} facilities.",
    technologies: ["Kubernetes / K3s", "Docker", "Terraform", "Ansible", "GitHub Actions"],
    tradeoffs: [
      { pro: "Reproducible environments", con: "K8s learning curve on-prem" },
      { pro: "GitOps audit trail", con: "Initial setup time" },
    ],
    risks: ["Configuration drift", "Deployment failures in production", "Skill gaps"],
    costEstimate: { range: "$25k–$200k", notes: "Higher for on-prem K8s clusters" },
    standards: ["GitOps principles", "Infrastructure as Code"],
    bestPractices: ["Blue-green deployments", "Environment parity (dev/staging/prod)", "Automated rollback"],
    notes: "For {deployment} deployments, consider managed K8s to reduce ops burden.",
    futureRecommendations: ["Multi-cluster management", "Edge orchestration", "Policy-as-code"],
  }),
  Operations: detail({
    overview: "Day-2 operations: monitoring, incident response, and platform health.",
    purpose: "Keep the platform running reliably with clear ownership and runbooks.",
    technologies: ["Prometheus", "Grafana", "PagerDuty", "Loki", "Runbook automation"],
    tradeoffs: [
      { pro: "High availability", con: "24/7 on-call requirements" },
      { pro: "Proactive detection", con: "Observability tooling costs" },
    ],
    risks: ["Alert fatigue", "Knowledge silos", "Undocumented tribal knowledge"],
    costEstimate: { range: "$20k–$100k/yr", notes: "Ongoing ops and tooling subscriptions" },
    standards: ["ITIL incident management", "SRE practices"],
    bestPractices: ["SLOs for critical services", "Blameless postmortems", "Documented runbooks"],
    notes: "Define SLAs with business stakeholders before go-live.",
    futureRecommendations: ["AIOps", "Self-healing infrastructure", "Chaos engineering"],
  }),
};

export const CHILDREN_MAP: Record<string, string[]> = {
  Edge: ["OPC UA", "MQTT", "Modbus", "PLCs"],
  "Data Platform": ["TSDB", "Historian", "Storage", "Backups"],
  Analytics: ["AI / ML", "Dashboards", "Alerts", "Event Processing"],
  Security: ["Network Segmentation", "Identity & Access", "Encryption", "Audit Logging"],
  Deployment: ["Containers", "CI/CD", "IaC", "Edge Orchestration"],
  Operations: ["Monitoring", "Incident Response", "Capacity Planning", "Runbooks"],
  "OPC UA": ["Server Config", "Address Space", "Certificates"],
  MQTT: ["Broker", "Sparkplug B", "Topic Design"],
  Modbus: ["TCP Gateway", "Register Mapping"],
  PLCs: ["Siemens", "Allen-Bradley", "Mitsubishi"],
  TSDB: ["Time-series Cluster", "Retention Policy", "Replication"],
  Historian: ["Data Archival", "Compression", "Query API"],
  Storage: ["Object Store", "Block Storage"],
  Backups: ["Snapshot Policy", "Disaster Recovery"],
  "AI / ML": ["Anomaly Detection", "Predictive Maintenance", "Computer Vision"],
  Dashboards: ["OEE", "Production KPIs", "Energy"],
  Alerts: ["Threshold Rules", "Escalation", "On-call"],
  "Event Processing": ["Stream Processing", "CEP Rules"],
};

export const CHILD_DETAILS: Record<string, NodeDetail> = {
  "OPC UA": detail({
    overview: "Industry-standard protocol for secure, reliable industrial data exchange.",
    purpose: "Unified connectivity to PLCs, SCADA, and MES systems.",
    technologies: ["open62541", "Prosys OPC UA", "Kepware", "UA Gateway"],
    tradeoffs: [{ pro: "Rich information model", con: "Complex certificate management" }],
    risks: ["Certificate expiry outages", "Namespace inconsistencies"],
    costEstimate: { range: "$5k–$30k", notes: "Per site gateway licensing" },
    standards: ["IEC 62541"],
    bestPractices: ["Auto-renew certificates", "Standardize namespace conventions"],
    notes: "Preferred protocol for greenfield {industry} projects.",
    futureRecommendations: ["OPC UA Pub/Sub over MQTT"],
  }),
  MQTT: detail({
    overview: "Lightweight pub/sub messaging for edge-to-cloud data flow.",
    purpose: "Efficient telemetry transport with store-and-forward capability.",
    technologies: ["EMQX", "Mosquitto", "HiveMQ", "Sparkplug B"],
    tradeoffs: [{ pro: "Low bandwidth", con: "No built-in data model" }],
    risks: ["Topic sprawl", "Broker single point of failure"],
    costEstimate: { range: "$3k–$20k", notes: "Broker HA cluster" },
    standards: ["MQTT 5.0", "Sparkplug B"],
    bestPractices: ["Use Sparkplug B for namespace", "TLS everywhere"],
    notes: "Ideal for {scale} IoT device fleets.",
    futureRecommendations: ["MQTT over QUIC"],
  }),
  Modbus: detail({
    overview: "Legacy serial/TCP protocol still dominant in industrial equipment.",
    purpose: "Connect older devices without native OPC UA support.",
    technologies: ["Modbus TCP gateways", "Serial converters", "Polling engines"],
    tradeoffs: [{ pro: "Universal support", con: "Polling-based, higher latency" }],
    risks: ["No security by design", "Register map documentation gaps"],
    costEstimate: { range: "$2k–$15k", notes: "Gateway hardware per segment" },
    standards: ["Modbus TCP/RTU"],
    bestPractices: ["Document all register maps", "Isolate on dedicated VLAN"],
    notes: "Bridge legacy assets — plan migration to OPC UA.",
    futureRecommendations: ["Protocol conversion at edge"],
  }),
  PLCs: detail({
    overview: "Programmable Logic Controllers — the brains of industrial automation.",
    purpose: "Source of truth for machine state, setpoints, and interlocks.",
    technologies: ["Siemens S7", "Allen-Bradley ControlLogix", "Mitsubishi iQ-R"],
    tradeoffs: [{ pro: "Deterministic control", con: "Vendor lock-in" }],
    risks: ["Firmware vulnerabilities", "Unauthorized program changes"],
    costEstimate: { range: "Included in automation budget", notes: "Connectivity add-ons extra" },
    standards: ["IEC 61131-3"],
    bestPractices: ["Read-only access for data platform", "Change management for logic"],
    notes: "Never write back without rigorous safety review.",
    futureRecommendations: ["Soft-PLC virtualization"],
  }),
  TSDB: detail({
    overview: "Time-series database optimized for high-frequency industrial telemetry.",
    purpose: "Store and query billions of data points with sub-second latency.",
    technologies: ["TimescaleDB", "InfluxDB", "QuestDB", "Apache IoTDB"],
    tradeoffs: [{ pro: "10x compression vs traditional DBs", con: "Specialized query patterns" }],
    risks: ["Cardinality explosion", "Retention cost"],
    costEstimate: { range: "$15k–$100k", notes: "Varies by scale and licensing model" },
    standards: ["SQL / InfluxQL / Flux interfaces"],
    bestPractices: ["Right-size retention policies", "Use aggregation for dashboards"],
    notes: "Right-size storage and retention for {scale} workloads at {deployment} scale.",
    futureRecommendations: ["Multi-region replication"],
  }),
  "AI / ML": detail({
    overview: "Machine learning models for predictive and prescriptive analytics.",
    purpose: "Move from reactive to predictive operations in {industry}.",
    technologies: ["Python", "scikit-learn", "PyTorch", "MLflow", "Edge TPU"],
    tradeoffs: [{ pro: "Significant ROI potential", con: "6-12 month model development" }],
    risks: ["Training data quality", "Model drift", "Explainability requirements"],
    costEstimate: { range: "$50k–$300k", notes: "Per use case" },
    standards: ["MLOps practices"],
    bestPractices: ["Start with one high-value use case", "Monitor model performance"],
    notes: "Predictive maintenance is typically the highest-ROI starting point.",
    futureRecommendations: ["Foundation models for industrial data"],
  }),
};

export function getChildDetail(label: string, vars: Record<string, string>): NodeDetail {
  const pick = getTechnologyPickForLabel(label);
  const template = CHILD_DETAILS[label] ?? detail({
    overview: `${label} component within your ${vars.idea || "platform"} architecture.`,
    purpose: `Supports the ${label} capability required for ${vars.industry} operations at ${vars.scale} scale.`,
    technologies: ["Industry-standard tools"],
    tradeoffs: [{ pro: "Proven approach", con: "Requires integration effort" }],
    risks: ["Integration complexity", "Vendor dependency"],
    costEstimate: { range: "Varies", notes: `Budget context: ${vars.budget}` },
    standards: ["Industry best practices"],
    bestPractices: ["Document architecture decisions", "Plan for {deployment} deployment"],
    notes: `Configured for ${vars.deployment} deployment across ${vars.facilities} facilities.`,
    futureRecommendations: ["Evaluate automation opportunities", "Plan capacity for growth"],
  });

  const fill = (text: string) =>
    Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), text);

  const filled = {
    ...template,
    overview: fill(template.overview),
    purpose: fill(template.purpose),
    notes: fill(template.notes),
    costEstimate: {
      range: fill(template.costEstimate.range),
      notes: fill(template.costEstimate.notes),
    },
    futureRecommendations: template.futureRecommendations.map(fill),
  };

  if (!pick) return filled;

  const fromPick = detailFromPick(pick);
  return {
    ...filled,
    ...fromPick,
    overview: `${filled.overview} Stacky selected ${pick.product} for this layer.`,
  };
}

export function enrichDomainDetail(label: string, base: NodeDetail): NodeDetail {
  const pick = getTechnologyPickForLabel(label);
  if (!pick) return base;
  const fromPick = detailFromPick(pick);
  return {
    ...base,
    ...fromPick,
    overview: `${base.overview} We selected ${pick.product} as the definitive stack for this domain.`,
  };
}
