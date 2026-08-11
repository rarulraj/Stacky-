import type { TechnologyPick } from "@/lib/types";

const GENERIC_PRODUCT_PATTERNS = [
  /^see child/i,
  /^industry[- ]standard/i,
  /^tbd$/i,
  /^varies$/i,
  /^n\/?a$/i,
  /^mqtt$/i,
  /^opc ua$/i,
  /^modbus$/i,
  /^time[- ]series/i,
  /^data platform$/i,
  /^cloud$/i,
  /^kubernetes$/i,
  /^docker$/i,
  /^grafana$/i,
  /^kafka$/i,
  /^postgresql$/i,
  /^generic/i,
  /^various/i,
  /^multiple/i,
];

export function hasVendorContact(pick: TechnologyPick): boolean {
  const v = pick.vendor;
  return Boolean(v.contactEmail || v.contactPhone || v.contactPage);
}

export function isGenericProduct(product: string, nodeLabel?: string): boolean {
  const trimmed = product.trim();
  if (trimmed.length < 4) return true;
  if (nodeLabel && trimmed.toLowerCase() === nodeLabel.toLowerCase()) return true;
  return GENERIC_PRODUCT_PATTERNS.some((p) => p.test(trimmed));
}

export function isValidTechnologyPick(
  pick: TechnologyPick | undefined,
  nodeLabel?: string
): boolean {
  if (!pick?.product || !pick.vendor?.name || !pick.vendor?.website) return false;
  if (!pick.role || pick.role.length < 10) return false;
  if (!hasVendorContact(pick)) return false;
  if (isGenericProduct(pick.product, nodeLabel)) return false;
  return true;
}
