import type {
  ImplementationPartner,
  Integration,
  IntakeMessage,
  OutreachProfile,
  ProjectContext,
  SavedDeployment,
  StackyNode,
} from "@/lib/types";

/** Server-side state keyed by email. not an account, just a memory locker */
export type EmailMemory = {
  email: string;
  updatedAt: string;
  /** Short rolling notes about what this email has built / preferred */
  notes: string[];
  context: ProjectContext;
  messages: IntakeMessage[];
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners: ImplementationPartner[];
  deployments: SavedDeployment[];
  activeDeploymentId: string | null;
  outreachProfile: OutreachProfile;
};

export function emptyMemory(email: string): EmailMemory {
  return {
    email: email.trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
    notes: [],
    context: { idea: "" },
    messages: [],
    nodes: [],
    integrations: [],
    implementationPartners: [],
    deployments: [],
    activeDeploymentId: null,
    outreachProfile: { name: "", email: email.trim().toLowerCase() },
  };
}
