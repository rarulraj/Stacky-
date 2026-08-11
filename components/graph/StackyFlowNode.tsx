"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Shield,
  Network,
  Server,
  Monitor,
  Database,
  Layers,
} from "lucide-react";
import {
  getKindLabel,
  getNodeAccent,
  getNodeColor,
} from "@/lib/layout-graph";
import type { NodeKind, StackyNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export type StackyNodeData = {
  stackyNode: StackyNode;
  childCount: number;
  canExpand: boolean;
  selected: boolean;
  isExpanding?: boolean;
  onToggleCollapse: (id: string) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
};

function KindIcon({ kind }: { kind?: NodeKind }) {
  const cls = "size-2.5";
  switch (kind) {
    case "firewall":
      return <Shield className={cls} />;
    case "network":
      return <Network className={cls} />;
    case "client":
      return <Monitor className={cls} />;
    case "datasource":
      return <Database className={cls} />;
    case "zone":
      return <Layers className={cls} />;
    default:
      return <Server className={cls} />;
  }
}

function StackyFlowNodeComponent({ data }: NodeProps) {
  const {
    stackyNode,
    childCount,
    canExpand: canExpandNode,
    selected,
    isExpanding,
    onToggleCollapse,
    onExpand,
    onSelect,
  } = data as unknown as StackyNodeData;

  const { depth, label, detail, expanded, collapsed, kind, zone, roleTag } =
    stackyNode;
  const isRoot = depth === 0;
  const isZone = kind === "zone" || depth === 1;
  const isFirewall = kind === "firewall";
  const hasChildren = childCount > 0;
  const canExpand = canExpandNode;
  const hasVisibleChildren = expanded && hasChildren;

  const purposePreview =
    detail.purpose?.slice(0, 72) +
    (detail.purpose?.length > 72 ? "…" : "");

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!h-2.5 !w-2.5 !border-orange-500/50 !bg-orange-500/40"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!h-2 !w-2 !border-orange-500/40 !bg-orange-500/30"
      />
      <div
        onClick={() => onSelect(stackyNode.id)}
        className={cn(
          "group relative cursor-grab overflow-hidden rounded-xl border transition-all duration-200 active:cursor-grabbing",
          getNodeColor(stackyNode),
          isFirewall
            ? "w-[168px] px-3 py-2.5"
            : isRoot
              ? "w-[300px] px-5 py-4"
              : isZone
                ? "w-[232px] px-4 py-3.5"
                : "w-[200px] px-3.5 py-3",
          selected && "shadow-xl shadow-orange-500/15 ring-2 ring-orange-400/60",
          "hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/10"
        )}
      >
        <div
          className={cn("absolute top-0 left-0 h-full w-1", getNodeAccent(stackyNode))}
        />

        <div className="flex items-start justify-between gap-2 pl-2">
          <div className="min-w-0 flex-1">
            <span className="mb-1 flex items-center gap-1 text-[9px] font-medium tracking-wider text-orange-400/70 uppercase">
              <KindIcon kind={kind} />
              {getKindLabel(kind, depth)}
              {zone && kind !== "zone" && (
                <span className="normal-case tracking-normal text-muted-foreground/70">
                  · {zone}
                </span>
              )}
            </span>
            <p
              className={cn(
                "leading-tight font-semibold",
                isRoot ? "text-base" : isFirewall ? "text-xs" : "text-sm"
              )}
            >
              {label}
            </p>
            {roleTag && (
              <p className="mt-1 truncate text-[10px] font-medium text-sky-300/90">
                {roleTag}
              </p>
            )}
            {(isRoot || isZone) && purposePreview && !roleTag && (
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {purposePreview}
              </p>
            )}
            {!isRoot && !isFirewall && detail.technologyPick && (
              <p className="mt-1.5 truncate text-[11px] font-medium text-orange-300/90">
                {detail.technologyPick.product}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {isExpanding && (
              <Loader2 className="size-4 animate-spin text-orange-400" />
            )}
            {canExpand && !isExpanding && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand(stackyNode.id);
                }}
                className="flex size-6 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 transition-colors hover:bg-orange-500/35"
                title="Expand components"
              >
                <Plus className="size-3.5" />
              </button>
            )}
            {hasVisibleChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(stackyNode.id);
                }}
                className="flex size-6 items-center justify-center rounded-lg bg-white/5 text-muted-foreground transition-colors hover:bg-white/10"
                title={collapsed ? "Show children" : "Hide children"}
              >
                {collapsed ? (
                  <ChevronRight className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {canExpandNode && (
          <div className="mt-2 flex items-center gap-1.5 pl-2">
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9px] text-muted-foreground">
              {hasChildren
                ? `${childCount} nested${
                    !expanded ? " · click + to expand" : ""
                  }`
                : "Click + to drill into components"}
            </span>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2.5 !w-2.5 !border-sky-500/50 !bg-sky-500/40"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!h-2 !w-2 !border-orange-500/40 !bg-orange-500/30"
      />
    </>
  );
}

export const StackyFlowNode = memo(StackyFlowNodeComponent);
