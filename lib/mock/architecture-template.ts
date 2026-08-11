import { layoutGraph } from "@/lib/layout-graph";
import type { Integration, ProjectContext, StackyNode } from "@/lib/types";
import { emptyNodeDetail } from "@/lib/graph/builder";

function node(
  id: string,
  label: string,
  parentId: string | null,
  depth: number,
  extras: Partial<StackyNode> & { overview?: string; purpose?: string }
): StackyNode {
  const detail = emptyNodeDetail(label);
  return {
    id,
    label,
    parentId,
    depth,
    collapsed: false,
    expanded: depth <= 1,
    position: { x: 0, y: 0 },
    kind: extras.kind,
    zone: extras.zone,
    roleTag: extras.roleTag,
    detail: {
      ...detail,
      overview: extras.overview ?? detail.overview,
      purpose: extras.purpose ?? detail.purpose,
      technologies: extras.roleTag ? [extras.roleTag] : [],
      standards: ["IEC 62443", "ISA-95"],
      notes: extras.zone ? `Zone: ${extras.zone}` : "",
    },
  };
}

function edge(
  from: string,
  to: string,
  label: string,
  ports: string,
  protocol: string,
  direction: Integration["direction"] = "outbound"
): Integration {
  return {
    id: `int-${from}-${to}`,
    fromNodeId: from,
    toNodeId: to,
    label,
    protocol,
    dataFlow: label,
    description: `${label} across security boundary`,
    ports,
    direction,
    networkNote: `Allow ${ports} through firewall (${direction})`,
    setupSteps: [
      `Open firewall for ${ports}`,
      `Validate ${protocol} connectivity`,
      "Document change in OT change control",
    ],
  };
}

/** High-fidelity fallback when LLM is unavailable — multi-zone OT historian pattern */
export function generateArchitectureTemplate(ctx: ProjectContext): {
  nodes: StackyNode[];
  integrations: Integration[];
} {
  const title = ctx.idea || "Real-Time Plant Information System";
  const root = node("arch-root", title, null, 0, {
    kind: "system",
    overview: `Network architecture for: ${title}`,
    purpose: "Editable multi-zone OT/IT diagram with firewalls and ports.",
  });

  const zones = [
    node("zone-control", "Control / Plant Network", root.id, 1, {
      kind: "zone",
      zone: "Control Network",
      overview: "OT sources and plant-floor servers",
    }),
    node("zone-dmz", "Plant DMZ", root.id, 1, {
      kind: "zone",
      zone: "DMZ",
      overview: "Interface / agent tier between plant and WAN",
    }),
    node("zone-wan", "MPLS / WAN", root.id, 1, {
      kind: "zone",
      zone: "MPLS",
      overview: "Customer MPLS backbone between sites and central",
    }),
    node("zone-central", "Central Server Room", root.id, 1, {
      kind: "zone",
      zone: "Central Server Room",
      overview: "Production historian, IDMP, backup, NAS",
    }),
    node("zone-corp", "IT / Enterprise Network", root.id, 1, {
      kind: "zone",
      zone: "Corporate",
      overview: "Analytics, visualization, and third-party systems",
    }),
  ];

  const components: StackyNode[] = [
    node("ds-opc", "OPC DA/UA Server", "zone-control", 2, {
      kind: "datasource",
      zone: "Control Network",
      roleTag: "Plant tags",
      overview: "Local OPC server on plant network",
    }),
    node("ds-ems", "EMS OPC Server", "zone-control", 2, {
      kind: "datasource",
      zone: "Control Network",
      roleTag: "EMS",
    }),
    node("fw-plant", "Existing FW", "zone-control", 2, {
      kind: "firewall",
      zone: "Control Network",
      roleTag: "Plant ↔ DMZ",
    }),
    node("sw-plant", "Plant Switch", "zone-control", 2, {
      kind: "network",
      zone: "Control Network",
      roleTag: "SW",
    }),
    node("fw-dmz-in", "Firewall Make 1", "zone-dmz", 2, {
      kind: "firewall",
      zone: "DMZ",
      roleTag: "Plant side",
    }),
    node("agent-taosx", "TDengine Interface: taosX agent", "zone-dmz", 2, {
      kind: "component",
      zone: "DMZ",
      roleTag: "S / P",
      overview: "Site collection agent in DMZ",
    }),
    node("fw-dmz-out", "Firewall Make 2", "zone-dmz", 2, {
      kind: "firewall",
      zone: "DMZ",
      roleTag: "WAN side",
    }),
    node("mpls", "MPLS By Customer", "zone-wan", 2, {
      kind: "network",
      zone: "MPLS",
      roleTag: "WAN bus",
    }),
    node("fw-central", "Firewall Make 2", "zone-central", 2, {
      kind: "firewall",
      zone: "Central Server Room",
      roleTag: "Enterprise edge",
    }),
    node("sw-central", "Network Switch", "zone-central", 2, {
      kind: "network",
      zone: "Central Server Room",
    }),
    node("td-tsdb", "TDengine TSDB", "zone-central", 2, {
      kind: "component",
      zone: "Central Server Room",
      roleTag: "Production",
    }),
    node("td-idmp", "TDengine IDMP", "zone-central", 2, {
      kind: "component",
      zone: "Central Server Room",
      roleTag: "Production",
    }),
    node("td-backup", "TDengine Cold-backup", "zone-central", 2, {
      kind: "component",
      zone: "Central Server Room",
      roleTag: "DR",
    }),
    node("nas", "NAS Storage", "zone-central", 2, {
      kind: "component",
      zone: "Central Server Room",
    }),
    node("fw-it", "Firewall Make 2", "zone-corp", 2, {
      kind: "firewall",
      zone: "Corporate",
      roleTag: "IT edge",
    }),
    node("viz", "Analytics & Visualization", "zone-corp", 2, {
      kind: "client",
      zone: "Corporate",
      roleTag: "Users",
    }),
    node("api", "Third Party Systems (API)", "zone-corp", 2, {
      kind: "client",
      zone: "Corporate",
      roleTag: "API",
    }),
  ];

  const integrations: Integration[] = [
    edge("ds-opc", "fw-plant", "OPC tags", "4840", "OPC UA", "outbound"),
    edge("fw-plant", "sw-plant", "Plant LAN", "—", "Ethernet", "bidirectional"),
    edge("sw-plant", "fw-dmz-in", "To DMZ", "6041, 6030", "TCP", "outbound"),
    edge("fw-dmz-in", "agent-taosx", "Agent ingest", "6041", "taosX", "inbound"),
    edge("agent-taosx", "fw-dmz-out", "Site uplink", "443, 6041", "TLS", "outbound"),
    edge("fw-dmz-out", "mpls", "MPLS handoff", "443, 6041", "IP", "outbound"),
    edge("mpls", "fw-central", "Central ingress", "443, 6041", "IP", "inbound"),
    edge("fw-central", "sw-central", "Server room", "—", "Ethernet", "bidirectional"),
    edge("sw-central", "td-tsdb", "Write path", "6030, 6041", "TDengine", "outbound"),
    edge("sw-central", "td-idmp", "IDMP API", "443, 6041", "HTTPS", "bidirectional"),
    edge("td-tsdb", "td-backup", "Replication", "6030", "TDengine", "outbound"),
    edge("td-tsdb", "nas", "Cold tier", "2049", "NFS/SMB", "outbound"),
    edge("sw-central", "fw-it", "To enterprise", "443, 6041", "HTTPS", "outbound"),
    edge("fw-it", "viz", "Dashboards", "443", "HTTPS", "bidirectional"),
    edge("fw-it", "api", "Third-party API", "443", "REST", "bidirectional"),
  ];

  const nodes = layoutGraph([root, ...zones, ...components], "architecture");
  return { nodes, integrations };
}
