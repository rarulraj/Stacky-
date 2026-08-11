import type { StackyNode, TechnologyPick, Vendor } from "@/lib/types";

export type OutreachContact = Vendor & {
  nodeLabel: string;
  product?: string;
  role?: string;
};

export function collectOutreachContacts(nodes: StackyNode[]): OutreachContact[] {
  const seen = new Set<string>();
  const contacts: OutreachContact[] = [];

  const add = (vendor: Vendor, nodeLabel: string, product?: string, role?: string) => {
    const key = `${vendor.name}-${vendor.contactEmail ?? vendor.contactPage ?? vendor.website}`;
    if (seen.has(key)) return;
    seen.add(key);
    contacts.push({ ...vendor, nodeLabel, product, role });
  };

  nodes.forEach((node) => {
    const pick = node.detail.technologyPick;
    if (pick) {
      add(pick.vendor, node.label, pick.product, pick.role);
    }
    node.detail.vendors?.forEach((vendor) => {
      if (pick && vendor.name === pick.vendor.name) return;
      add(vendor, node.label);
    });
  });

  return contacts;
}

export function formatMailtoSubject(idea: string, product?: string): string {
  const subject = product
    ? `Inquiry: ${product} for ${idea}`
    : `Architecture inquiry: ${idea}`;
  return encodeURIComponent(subject.slice(0, 120));
}

export function formatMailtoBody(
  idea: string,
  nodeLabel: string,
  product?: string,
  role?: string
): string {
  const lines = [
    "Hi,",
    "",
    `I'm evaluating an industrial software architecture for: ${idea}.`,
    "",
    `Stacky selected your solution for the "${nodeLabel}" component`,
    product ? `— specifically ${product}.` : ".",
    role ? `Intended role: ${role}` : "",
    "",
    "Could we schedule a brief call to discuss licensing and deployment for our rollout?",
    "",
    "Thank you,",
  ].filter(Boolean);

  return encodeURIComponent(lines.join("\n"));
}

export function buildOutreachMailto(
  contact: OutreachContact,
  projectIdea: string
): string | null {
  if (!contact.contactEmail) return null;
  const subject = formatMailtoSubject(projectIdea, contact.product);
  const body = formatMailtoBody(
    projectIdea,
    contact.nodeLabel,
    contact.product,
    contact.role
  );
  return `mailto:${contact.contactEmail}?subject=${subject}&body=${body}`;
}

export function getNodeTechnologyPick(node: StackyNode): TechnologyPick | undefined {
  return node.detail.technologyPick;
}
