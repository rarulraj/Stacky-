import type { ProjectRequirements } from "./requirements";

const YEAR = new Date().getFullYear();

export function getDeploymentPatternBlock(req: ProjectRequirements): string {
  switch (req.architecturePattern) {
    case "historian":
      return `REFERENCE DEPLOYMENT — Industrial Historian / IA Data Platform (${YEAR} production pattern):
Search the web for "industrial historian reference architecture ${YEAR}" and "IIoT data platform deployment case study ${YEAR}".

Typical real deployment layers (use as domain names or depth-2 children when expanding):
1. **Edge Connectivity** — OPC UA/MQTT/Sparkplug collectors at the plant edge
2. **Stream Ingest** — MQTT broker or Kafka cluster buffering high-frequency telemetry
3. **Time-Series Historian** — commercial historian cluster (pick best fit: TDengine, AVEVA PI, Timescale, etc.)
4. **Analytics & Visualization** — Grafana, factory OEE/IA dashboards, or BI layer
5. **Alerting & Operations** — Grafana Alerting, PagerDuty, or Opsgenie for on-call
6. **Security & Identity** — OT segmentation, TLS/mTLS, secrets management
7. **Implementation & Services** — OT systems integrator or MSP to deploy and commission the stack

When expanding "Data Platform" or "Historian", children should be concrete deployable units:
- Ingest Connector (MQTT bridge, Kafka Connect, vendor adapter)
- Historian / TSDB Cluster (retention policy, HA layout)
- Cold Storage / Backup tier
- Query & API layer
- Dashboards & alert rules

For ARCHITECTURE DIAGRAM intent, prefer security-zone layouts:
- Control / Plant Network (OPC servers, PLC/DCS, existing FW)
- Plant DMZ (PI Interface / Connector Relay / taosX agent, dual firewalls)
- MPLS / WAN
- Central Server Room (TSDB, AF/IDMP, cold backup, NAS, switch)
- IT / Corporate (Vision / Web API / ProcessBook / Analytics clients)
Cross-zone edges MUST show firewall ports (e.g. PI 5450/5457/5459, HTTPS 443, historian 6030/6041).

Integrations must include setupSteps, networkNote, ports, direction, and whoSetsThisUp for every connection.
Example flow: OPC UA → MQTT Sparkplug B → Kafka → historian adapter → Grafana SQL.`;

    case "scada":
      return `REFERENCE DEPLOYMENT — SCADA / OT Control (${YEAR}):
Search for "modern SCADA architecture ${YEAR}". Layers: PLCs → OPC UA server → SCADA/HMI → historian → enterprise analytics.
Include an OT systems integrator in implementationPartners.`;

    case "iot-platform":
      return `REFERENCE DEPLOYMENT — IIoT Platform (${YEAR}):
Edge gateways → message bus → time-series store → digital twin / analytics. Include SI partners for edge + cloud rollout.`;

    case "fleet":
      return `REFERENCE DEPLOYMENT — Fleet / Telematics (${YEAR}):
Devices → ingest API → stream processing → time-series + GIS dashboards.`;

    default:
      return `Model this architecture after real ${YEAR} production deployments in the user's industry — search for case studies and reference architectures before picking products.`;
  }
}
