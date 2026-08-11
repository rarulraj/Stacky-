export type HistorianOption = {
  id: string;
  name: string;
  vendor: string;
  blurb: string;
  /** Prefills the architecture idea */
  idea: string;
};

/** Major industrial historians for the planning section */
export const HISTORIANS: HistorianOption[] = [
  {
    id: "tdengine",
    name: "TDengine",
    vendor: "TDengine",
    blurb: "High-ingest industrial TSDB — multi-plant, IoT, and AI analytics.",
    idea:
      "Plan a TDengine Enterprise historian deployment across multiple plants with OT ingest, retention tiers, Grafana/SQL analytics, and alerting.",
  },
  {
    id: "pi-system",
    name: "PI System",
    vendor: "AVEVA",
    blurb: "Enterprise PI AF / PI Vision stack for regulated OT environments.",
    idea:
      "Plan an AVEVA PI System historian architecture with PI Interfaces/Connectors, Asset Framework, PI Vision, and enterprise historian HA.",
  },
  {
    id: "canary",
    name: "Canary Labs",
    vendor: "Canary Labs",
    blurb: "Lightweight enterprise historian with strong OPC UA and Views.",
    idea:
      "Plan a Canary Labs historian deployment with OPC UA collectors, Canary Views, Axiom analytics, and site-to-enterprise replication.",
  },
  {
    id: "ignition",
    name: "Ignition + Historian",
    vendor: "Inductive Automation",
    blurb: "Ignition SCADA with Tag Historian / SQL Bridge patterns.",
    idea:
      "Plan an Inductive Automation Ignition architecture with Tag Historian, MQTT Engine/Transmission, and enterprise SQL/historian backends.",
  },
  {
    id: "influx",
    name: "InfluxDB",
    vendor: "InfluxData",
    blurb: "Cloud-native time series for IIoT and modern analytics stacks.",
    idea:
      "Plan an InfluxDB Cloud or Enterprise historian for IIoT telemetry with Telegraf/OPC collectors, Capstone dashboards, and long-term retention.",
  },
];
