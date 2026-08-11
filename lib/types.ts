export type DeploymentType = "cloud" | "on-prem" | "hybrid";

export type IntakeMode = "guided" | "natural";

/** architecture = serious network/system diagrams; quote = vendor/partner commercial path */
export type ProjectIntent = "architecture" | "quote";

/** Visual / semantic role of a node on the canvas */
export type NodeKind =
  | "system"
  | "zone"
  | "component"
  | "firewall"
  | "network"
  | "client"
  | "datasource";

export type Vendor = {
  name: string;
  website: string;
  description: string;
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPage?: string;
  contactName?: string;
  region?: string;
};

/** A specific product the user can procure — tied to a vendor with outreach contacts */
export type TechnologyPick = {
  name: string;
  product: string;
  version?: string;
  role: string;
  connectsTo?: string;
  deploymentNote?: string;
  vendor: Vendor;
};

/** How two architecture components connect in production */
export type Integration = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  protocol: string;
  dataFlow: string;
  description: string;
  /** Step-by-step how engineers wire this up */
  setupSteps?: string[];
  /** e.g. JSON over REST, Sparkplug B protobuf */
  dataFormat?: string;
  /** Ports, VLANs, firewall rules */
  networkNote?: string;
  /** Explicit firewall/allowed ports shown on the edge, e.g. "5450, 5457, 5459" */
  ports?: string;
  /** Traffic direction across the security boundary */
  direction?: "inbound" | "outbound" | "bidirectional";
  /** Who typically configures this — SI, internal OT team, vendor PS */
  whoSetsThisUp?: string;
  /** Rough sizing e.g. "2-3 days with SI" */
  estimatedEffort?: string;
};

/** Systems integrator / consultant who can deploy part or all of the stack */
export type ImplementationPartner = {
  id: string;
  name: string;
  company: string;
  website: string;
  partnerType: "SI" | "MSP" | "Consultant" | "VAR" | "OT Specialist";
  services: string[];
  /** Architecture components they deploy or manage */
  deploysComponents: string[];
  contactEmail?: string;
  contactPhone?: string;
  contactPage?: string;
  region?: string;
  description: string;
};

export type UploadedFile = {
  id: string;
  name: string;
  type: "pdf" | "md" | "txt" | "image";
  content: string;
  mimeType: string;
  size: number;
};

export type OutreachProfile = {
  name: string;
  email: string;
  company?: string;
  calendlyUrl?: string;
};

export type OutreachSendResult = {
  sent: boolean;
  subject: string;
  body: string;
  mailtoUrl?: string;
  message: string;
};

export type ProjectContext = {
  idea: string;
  /**
   * architecture = high-fidelity editable diagram (zones, firewalls, ports)
   * quote = commercial product picks + vendor / SI outreach
   */
  intent?: ProjectIntent;
  /** guided = scenario-first Q&A; natural = free-form, skip structured prompts */
  intakeMode?: IntakeMode;
  /** Selected historian planning focus (tdengine, pi-system, canary, …) */
  historianFocus?: string;
  /** Day-to-day operational scenario — asked first in guided mode */
  scenario?: string;
  /** Accumulated free-form notes in natural language mode */
  naturalNotes?: string;
  industry?: string;
  deployment?: DeploymentType;
  facilities?: string;
  scale?: string;
  existingSystems?: string;
  budget?: string;
  documents?: string;
  attachments?: UploadedFile[];
};

export type Tradeoff = {
  pro: string;
  con: string;
};

export type NodeDetail = {
  overview: string;
  purpose: string;
  technologies: string[];
  /** The one product Stacky selected for this component — no alternatives */
  technologyPick?: TechnologyPick;
  tradeoffs: Tradeoff[];
  risks: string[];
  costEstimate: { range: string; notes: string };
  standards: string[];
  bestPractices: string[];
  notes: string;
  futureRecommendations: string[];
  vendors: Vendor[];
};

export type StackyNode = {
  id: string;
  label: string;
  parentId: string | null;
  depth: number;
  collapsed: boolean;
  expanded: boolean;
  position: { x: number; y: number };
  detail: NodeDetail;
  /** Diagram role — zone, firewall, server component, etc. */
  kind?: NodeKind;
  /** Security / network zone label, e.g. "Control Network", "DMZ", "Corporate" */
  zone?: string;
  /** Short badge under the title, e.g. "OPC UA", "taosX agent" */
  roleTag?: string;
};

export type Question = {
  id:
    | "scenario"
    | "industry"
    | "deployment"
    | "facilities"
    | "scale"
    | "existingSystems"
    | "budget";
  text: string;
  placeholder?: string;
  chips?: string[];
};

export type IntakeMessage = {
  id: string;
  role: "stacky" | "user";
  content: string;
};

export type SavedDeployment = {
  id: string;
  title: string;
  context: ProjectContext;
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners?: ImplementationPartner[];
  messages: IntakeMessage[];
  createdAt: string;
  updatedAt: string;
};

export type LLMGraphResponse = {
  nodes: LLMGraphNode[];
  integrations: Integration[];
};

export type TemplateId =
  | "industrial-ai-platform"
  | "tdengine-deployment"
  | "autonomous-warehouse"
  | "generic-platform";

export type LLMGraphNode = {
  id: string;
  label: string;
  parentId: string | null;
  depth: number;
  detail: NodeDetail;
  children?: string[];
};
