import type { TechnologyPick, Vendor } from "@/lib/types";

export function vendor(
  partial: Vendor & { name: string; website: string; description: string; category: string }
): Vendor {
  return partial;
}

export const VENDORS = {
  hivemq: vendor({
    name: "HiveMQ",
    website: "https://www.hivemq.com",
    description: "Enterprise MQTT platform for industrial IoT and Sparkplug B deployments",
    category: "Software",
    contactEmail: "sales@hivemq.com",
    contactPage: "https://www.hivemq.com/contact/",
    contactName: "Sales Team",
    region: "Global",
  }),
  kepware: vendor({
    name: "PTC (Kepware)",
    website: "https://www.ptc.com/en/products/kepware",
    description: "Industrial connectivity suite — 150+ drivers for OPC UA, Modbus, PLCs",
    category: "Software",
    contactPage: "https://www.ptc.com/en/contact",
    contactPhone: "+1-800-477-6832",
    contactName: "Sales / Licensing",
    region: "Americas",
  }),
  tdengine: vendor({
    name: "TDengine",
    website: "https://www.tdengine.com",
    description: "High-performance time-series database for industrial telemetry at scale",
    category: "Software",
    contactEmail: "support@tdengine.com",
    contactPage: "https://www.tdengine.com/contact/",
    contactName: "Sales & Support",
    region: "Global",
  }),
  grafana: vendor({
    name: "Grafana Labs",
    website: "https://grafana.com",
    description: "Observability stack — dashboards, alerting, and Grafana Cloud",
    category: "Software",
    contactPage: "https://grafana.com/contact/",
    contactEmail: "hello@grafana.com",
    contactName: "Sales",
    region: "Global",
  }),
  confluent: vendor({
    name: "Confluent",
    website: "https://www.confluent.io",
    description: "Managed Apache Kafka for real-time data pipelines and stream processing",
    category: "Cloud",
    contactPage: "https://www.confluent.io/contact/",
    contactEmail: "sales@confluent.io",
    contactName: "Sales",
    region: "Global",
  }),
  aws: vendor({
    name: "Amazon Web Services",
    website: "https://aws.amazon.com",
    description: "Cloud infrastructure — IoT Core, MSK, S3, EKS for hybrid deployments",
    category: "Cloud",
    contactPage: "https://aws.amazon.com/contact-us/",
    contactPhone: "+1-206-266-4064",
    contactName: "Enterprise Sales",
    region: "Global",
  }),
  claroty: vendor({
    name: "Claroty",
    website: "https://www.claroty.com",
    description: "OT/ICS cybersecurity — asset discovery, segmentation, threat detection",
    category: "Security",
    contactPage: "https://www.claroty.com/contact",
    contactEmail: "info@claroty.com",
    contactName: "Sales",
    region: "Global",
  }),
  siemens: vendor({
    name: "Siemens Digital Industries",
    website: "https://www.siemens.com/industrial-automation",
    description: "PLC, SCADA, and industrial automation — S7-1500, WinCC, MindSphere",
    category: "Hardware",
    contactPage: "https://www.siemens.com/global/en/company/about/contact.html",
    contactName: "Regional Sales",
    region: "Global",
  }),
  rockwell: vendor({
    name: "Rockwell Automation",
    website: "https://www.rockwellautomation.com",
    description: "Allen-Bradley PLCs, FactoryTalk, and industrial control systems",
    category: "Hardware",
    contactPage: "https://www.rockwellautomation.com/en-us/company/about-us/contact-us.html",
    contactPhone: "+1-440-646-3434",
    contactName: "Sales",
    region: "Americas",
  }),
  prosys: vendor({
    name: "Prosys OPC",
    website: "https://www.prosysopc.com",
    description: "OPC UA SDK, simulation servers, and connectivity tooling",
    category: "Software",
    contactEmail: "sales@prosysopc.com",
    contactPage: "https://www.prosysopc.com/contact/",
    contactName: "Sales",
    region: "Global",
  }),
  hashicorp: vendor({
    name: "HashiCorp",
    website: "https://www.hashicorp.com",
    description: "Terraform, Vault, and infrastructure automation for secure deployments",
    category: "Software",
    contactPage: "https://www.hashicorp.com/contact",
    contactEmail: "sales@hashicorp.com",
    contactName: "Sales",
    region: "Global",
  }),
  pagerduty: vendor({
    name: "PagerDuty",
    website: "https://www.pagerduty.com",
    description: "Incident management and on-call orchestration for operations teams",
    category: "Software",
    contactPage: "https://www.pagerduty.com/contact-us/",
    contactEmail: "sales@pagerduty.com",
    contactName: "Sales",
    region: "Global",
  }),
};

/** One definitive product pick per domain — Stacky decides, no alternatives */
export const DOMAIN_TECH_PICK: Record<string, TechnologyPick> = {
  Edge: {
    name: "PTC (Kepware)",
    product: "KEPServerEX",
    version: "6.16+",
    role: "Plant-edge connectivity hub — OPC UA, Modbus, and PLC aggregation",
    connectsTo: "HiveMQ Cloud (MQTT publish)",
    deploymentNote: "One instance per site on DMZ VLAN",
    vendor: VENDORS.kepware,
  },
  "Data Platform": {
    name: "TDengine",
    product: "TDengine Enterprise",
    version: "3.x",
    role: "Primary time-series store for all sensor telemetry",
    connectsTo: "Grafana dashboards, ML pipelines",
    deploymentNote: "3-node HA cluster",
    vendor: VENDORS.tdengine,
  },
  Analytics: {
    name: "Grafana Labs",
    product: "Grafana Cloud",
    version: "11.x",
    role: "Operational dashboards, OEE KPIs, and alerting",
    connectsTo: "TDengine data source → PagerDuty",
    vendor: VENDORS.grafana,
  },
  Security: {
    name: "Claroty",
    product: "xDome Platform",
    role: "OT asset discovery, vulnerability management, and network segmentation",
    connectsTo: "OT core switch span ports",
    vendor: VENDORS.claroty,
  },
  Deployment: {
    name: "HashiCorp",
    product: "Terraform + Vault",
    role: "Infrastructure-as-code and secrets management for all environments",
    connectsTo: "AWS EKS / on-prem K8s clusters",
    vendor: VENDORS.hashicorp,
  },
  Operations: {
    name: "PagerDuty",
    product: "PagerDuty AIOps",
    role: "On-call routing and incident escalation from platform alerts",
    connectsTo: "Grafana alerting → Slack/Teams",
    vendor: VENDORS.pagerduty,
  },
};

export const CHILD_TECH_PICK: Record<string, TechnologyPick> = {
  "OPC UA": {
    name: "PTC (Kepware)",
    product: "KEPServerEX OPC UA Client",
    role: "Production OPC UA connectivity to PLCs and SCADA",
    connectsTo: "Plant PLCs → MQTT bridge",
    vendor: VENDORS.kepware,
  },
  MQTT: {
    name: "HiveMQ",
    product: "HiveMQ Cloud Enterprise",
    version: "4.x",
    role: "Central MQTT broker with Sparkplug B namespace",
    connectsTo: "Edge gateways → TDengine ingest",
    vendor: VENDORS.hivemq,
  },
  Modbus: {
    name: "PTC (Kepware)",
    product: "KEPServerEX Modbus Suite",
    role: "Modbus TCP/RTU polling and register mapping",
    connectsTo: "Legacy devices → OPC UA namespace",
    vendor: VENDORS.kepware,
  },
  PLCs: {
    name: "Siemens Digital Industries",
    product: "SIMATIC S7-1500",
    role: "Primary PLC platform for machine control and data source",
    connectsTo: "Kepware OPC UA driver",
    vendor: VENDORS.siemens,
  },
  TSDB: {
    name: "TDengine",
    product: "TDengine Enterprise",
    version: "3.x",
    role: "Industrial time-series database for high-frequency telemetry",
    connectsTo: "Kafka ingest → Grafana queries",
    vendor: VENDORS.tdengine,
  },
  Historian: {
    name: "TDengine",
    product: "TDengine Enterprise",
    version: "3.x",
    role: "Long-term historian and archival storage tier",
    connectsTo: "Hot TSDB → cold storage tier",
    vendor: VENDORS.tdengine,
  },
  "AI / ML": {
    name: "Grafana Labs",
    product: "Grafana ML (built on Grafana Cloud)",
    role: "Anomaly detection and forecasting on operational metrics",
    connectsTo: "TDengine metrics → alert rules",
    vendor: VENDORS.grafana,
  },
  Dashboards: {
    name: "Grafana Labs",
    product: "Grafana Cloud",
    version: "11.x",
    role: "OEE, production KPI, and energy dashboards",
    connectsTo: "TDengine SQL data source",
    vendor: VENDORS.grafana,
  },
  Monitoring: {
    name: "Grafana Labs",
    product: "Grafana Cloud (LGTM stack)",
    role: "Platform health metrics, logs, and SLO monitoring",
    connectsTo: "Prometheus exporters → alert routing",
    vendor: VENDORS.grafana,
  },
};

export function getTechnologyPickForLabel(label: string): TechnologyPick | undefined {
  return DOMAIN_TECH_PICK[label] ?? CHILD_TECH_PICK[label];
}

export function detailFromPick(pick: TechnologyPick): {
  technologyPick: TechnologyPick;
  technologies: string[];
  vendors: Vendor[];
} {
  return {
    technologyPick: pick,
    technologies: [`${pick.product}${pick.version ? ` ${pick.version}` : ""}`],
    vendors: [pick.vendor],
  };
}
