"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  collectDescendantIds,
  createChildNode,
  createIntegration,
  createStandaloneNode,
  removeNodesAndIntegrations,
  withRelayout,
} from "./graph/builder";
import { syncGraphAfterNodeUpdate } from "./graph/sync";
import type {
  Integration,
  ImplementationPartner,
  IntakeMessage,
  NodeKind,
  OutreachProfile,
  ProjectContext,
  SavedDeployment,
  StackyNode,
  UploadedFile,
} from "./types";

const initialOutreachProfile: OutreachProfile = {
  name: "",
  email: "",
  company: "",
  calendlyUrl: "",
};

type StackyState = {
  /** Email-only access — no accounts */
  userEmail: string | null;
  context: ProjectContext;
  messages: IntakeMessage[];
  nodes: StackyNode[];
  integrations: Integration[];
  implementationPartners: ImplementationPartner[];
  outreachProfile: OutreachProfile;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  panelOpen: boolean;
  outreachOpen: boolean;
  deployments: SavedDeployment[];
  activeDeploymentId: string | null;
  graphRevision: number;
  setUserEmail: (email: string | null) => void;
  setIdea: (idea: string) => void;
  updateContext: (partial: Partial<ProjectContext>) => void;
  addAttachment: (file: UploadedFile) => void;
  removeAttachment: (id: string) => void;
  setAttachments: (files: UploadedFile[]) => void;
  addMessage: (message: IntakeMessage) => void;
  clearMessages: () => void;
  setNodes: (nodes: StackyNode[]) => void;
  setIntegrations: (integrations: Integration[]) => void;
  setGraphData: (
    nodes: StackyNode[],
    integrations: Integration[],
    implementationPartners?: ImplementationPartner[]
  ) => void;
  updateNode: (id: string, partial: Partial<StackyNode>) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  addChildNode: (parentId: string, label?: string) => string | null;
  addStandaloneNode: (opts: {
    label: string;
    kind?: NodeKind;
    zone?: string;
    parentId?: string | null;
  }) => string | null;
  deleteNode: (id: string) => void;
  relayoutGraph: () => void;
  applyNodeUpdate: (
    updatedNode: StackyNode,
    options?: { previousProduct?: string }
  ) => void;
  addIntegration: (
    fromNodeId: string,
    toNodeId: string,
    partial?: Partial<Integration>
  ) => string | null;
  deleteIntegration: (id: string) => void;
  updateIntegration: (id: string, partial: Partial<Integration>) => void;
  selectEdge: (id: string | null) => void;
  updateImplementationPartner: (
    id: string,
    partial: Partial<ImplementationPartner>
  ) => void;
  selectNode: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;
  setOutreachOpen: (open: boolean) => void;
  setOutreachProfile: (profile: Partial<OutreachProfile>) => void;
  resetProject: () => void;
  saveDeployment: () => string;
  loadDeployment: (id: string) => void;
  deleteDeployment: (id: string) => void;
  updateActiveDeployment: () => void;
};

const initialContext: ProjectContext = { idea: "" };

export const useStackyStore = create<StackyState>()(
  persist(
    (set, get) => ({
      userEmail: null,
      context: initialContext,
      messages: [],
      nodes: [],
      integrations: [],
      implementationPartners: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      panelOpen: false,
      outreachOpen: false,
      outreachProfile: initialOutreachProfile,
      deployments: [],
      activeDeploymentId: null,
      graphRevision: 0,

      setUserEmail: (email) =>
        set((state) => ({
          userEmail: email,
          outreachProfile: email
            ? {
                ...state.outreachProfile,
                email: state.outreachProfile.email || email,
              }
            : state.outreachProfile,
        })),

      setIdea: (idea) =>
        set((state) => ({
          context: { ...state.context, idea },
          activeDeploymentId: null,
        })),

      updateContext: (partial) =>
        set((state) => ({
          context: { ...state.context, ...partial },
        })),

      addAttachment: (file) =>
        set((state) => ({
          context: {
            ...state.context,
            attachments: [...(state.context.attachments ?? []), file],
          },
        })),

      removeAttachment: (id) =>
        set((state) => ({
          context: {
            ...state.context,
            attachments: (state.context.attachments ?? []).filter((f) => f.id !== id),
          },
        })),

      setAttachments: (files) =>
        set((state) => ({
          context: { ...state.context, attachments: files },
        })),

      addMessage: (message) =>
        set((state) => {
          const last = state.messages[state.messages.length - 1];
          if (
            last?.role === message.role &&
            last.content === message.content
          ) {
            return state;
          }
          return { messages: [...state.messages, message] };
        }),

      clearMessages: () => set({ messages: [] }),

      setNodes: (nodes) => set({ nodes }),

      setIntegrations: (integrations) => set({ integrations }),

      setGraphData: (nodes, integrations, implementationPartners) =>
        set((state) => ({
          nodes,
          integrations,
          implementationPartners:
            implementationPartners ?? state.implementationPartners,
          graphRevision: state.graphRevision + 1,
        })),

      updateNode: (id, partial) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, ...partial } : node
          ),
          graphRevision: state.graphRevision + 1,
        })),

      updateNodePosition: (id, position) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === id ? { ...node, position } : node
          ),
        })),

      addChildNode: (parentId, label) => {
        const { nodes, integrations, graphRevision } = get();
        const parent = nodes.find((n) => n.id === parentId);
        if (!parent) return null;

        const child = createChildNode(
          parent,
          label ?? "New component",
          new Set(nodes.map((n) => n.id))
        );
        const updated = nodes.map((n) =>
          n.id === parentId
            ? { ...n, expanded: true, collapsed: false }
            : n
        );
        const intent = get().context.intent;
        const next = withRelayout([...updated, child], intent);
        set({
          nodes: next,
          integrations,
          selectedNodeId: child.id,
          selectedEdgeId: null,
          panelOpen: true,
          graphRevision: graphRevision + 1,
        });
        return child.id;
      },

      addStandaloneNode: ({ label, kind, zone, parentId }) => {
        const { nodes, integrations, graphRevision } = get();
        const parent = parentId
          ? nodes.find((n) => n.id === parentId) ?? null
          : nodes.find((n) => n.depth === 0) ?? null;
        const node = createStandaloneNode(
          label,
          new Set(nodes.map((n) => n.id)),
          {
            parentId: parent?.id ?? null,
            depth: parent ? parent.depth + 1 : 1,
            kind: kind ?? "component",
            zone: zone ?? parent?.zone,
            position: parent
              ? { x: parent.position.x + 220, y: parent.position.y + 40 }
              : { x: 200 + nodes.length * 40, y: 180 },
          }
        );
        const updatedParents = parent
          ? nodes.map((n) =>
              n.id === parent.id
                ? { ...n, expanded: true, collapsed: false }
                : n
            )
          : nodes;
        set({
          nodes: [...updatedParents, node],
          integrations,
          selectedNodeId: node.id,
          selectedEdgeId: null,
          panelOpen: true,
          graphRevision: graphRevision + 1,
        });
        return node.id;
      },

      deleteNode: (id) => {
        const { nodes, integrations, graphRevision, selectedNodeId } = get();
        const target = nodes.find((n) => n.id === id);
        if (!target || target.depth === 0) return;

        const removeIds = collectDescendantIds(nodes, id);
        const cleaned = removeNodesAndIntegrations(nodes, integrations, removeIds);
        const intent = get().context.intent;
        set({
          nodes: withRelayout(cleaned.nodes, intent),
          integrations: cleaned.integrations,
          selectedNodeId:
            selectedNodeId && removeIds.has(selectedNodeId)
              ? null
              : selectedNodeId,
          panelOpen:
            selectedNodeId && removeIds.has(selectedNodeId)
              ? false
              : get().panelOpen,
          graphRevision: graphRevision + 1,
        });
      },

      relayoutGraph: () => {
        const { nodes, integrations, graphRevision, context } = get();
        set({
          nodes: withRelayout(nodes, context.intent),
          integrations,
          graphRevision: graphRevision + 1,
        });
      },

      applyNodeUpdate: (updatedNode, options) => {
        const { nodes, integrations, graphRevision } = get();
        const synced = syncGraphAfterNodeUpdate(
          nodes,
          integrations,
          updatedNode,
          options?.previousProduct
        );
        set({
          nodes: synced.nodes,
          integrations: synced.integrations,
          graphRevision: graphRevision + 1,
        });
      },

      addIntegration: (fromNodeId, toNodeId, partial) => {
        const { nodes, integrations, graphRevision } = get();
        if (
          !nodes.some((n) => n.id === fromNodeId) ||
          !nodes.some((n) => n.id === toNodeId) ||
          fromNodeId === toNodeId
        ) {
          return null;
        }
        const exists = integrations.some(
          (i) => i.fromNodeId === fromNodeId && i.toNodeId === toNodeId
        );
        if (exists) return null;
        const edge = createIntegration(fromNodeId, toNodeId, partial);
        set({
          integrations: [...integrations, edge],
          selectedEdgeId: edge.id,
          selectedNodeId: null,
          panelOpen: false,
          graphRevision: graphRevision + 1,
        });
        return edge.id;
      },

      deleteIntegration: (id) =>
        set((state) => ({
          integrations: state.integrations.filter((i) => i.id !== id),
          selectedEdgeId:
            state.selectedEdgeId === id ? null : state.selectedEdgeId,
          graphRevision: state.graphRevision + 1,
        })),

      updateIntegration: (id, partial) =>
        set((state) => ({
          integrations: state.integrations.map((int) =>
            int.id === id ? { ...int, ...partial } : int
          ),
          graphRevision: state.graphRevision + 1,
        })),

      updateImplementationPartner: (id, partial) =>
        set((state) => ({
          implementationPartners: state.implementationPartners.map((p) =>
            p.id === id ? { ...p, ...partial } : p
          ),
        })),

      selectNode: (id) =>
        set({
          selectedNodeId: id,
          selectedEdgeId: null,
          panelOpen: id !== null,
        }),

      selectEdge: (id) =>
        set({
          selectedEdgeId: id,
          selectedNodeId: null,
          panelOpen: false,
        }),

      setPanelOpen: (open) => set({ panelOpen: open }),

      setOutreachOpen: (open) => set({ outreachOpen: open }),

      setOutreachProfile: (profile) =>
        set((state) => ({
          outreachProfile: { ...state.outreachProfile, ...profile },
        })),

      resetProject: () =>
        set({
          context: initialContext,
          messages: [],
          nodes: [],
          integrations: [],
          implementationPartners: [],
          selectedNodeId: null,
          selectedEdgeId: null,
          panelOpen: false,
          outreachOpen: false,
          activeDeploymentId: null,
        }),

      saveDeployment: () => {
        const { context, nodes, integrations, implementationPartners, messages, activeDeploymentId, deployments } =
          get();
        const now = new Date().toISOString();
        const title = context.idea || "Untitled deployment";

        if (activeDeploymentId) {
          set({
            deployments: deployments.map((d) =>
              d.id === activeDeploymentId
                ? { ...d, title, context, nodes, integrations, implementationPartners, messages, updatedAt: now }
                : d
            ),
          });
          return activeDeploymentId;
        }

        const id = crypto.randomUUID();
        const deployment: SavedDeployment = {
          id,
          title,
          context,
          nodes,
          integrations,
          implementationPartners,
          messages,
          createdAt: now,
          updatedAt: now,
        };

        set({
          deployments: [deployment, ...deployments],
          activeDeploymentId: id,
        });
        return id;
      },

      loadDeployment: (id) => {
        const deployment = get().deployments.find((d) => d.id === id);
        if (!deployment) return;

        set((state) => ({
          context: deployment.context,
          nodes: deployment.nodes,
          integrations: deployment.integrations ?? [],
          implementationPartners: deployment.implementationPartners ?? [],
          messages: deployment.messages,
          activeDeploymentId: id,
          selectedNodeId: null,
          panelOpen: false,
          graphRevision: state.graphRevision + 1,
        }));
      },

      deleteDeployment: (id) =>
        set((state) => ({
          deployments: state.deployments.filter((d) => d.id !== id),
          activeDeploymentId:
            state.activeDeploymentId === id ? null : state.activeDeploymentId,
        })),

      updateActiveDeployment: () => {
        const {
          activeDeploymentId,
          context,
          nodes,
          integrations,
          implementationPartners,
          messages,
          deployments,
        } = get();
        if (!activeDeploymentId || nodes.length === 0) return;

        const now = new Date().toISOString();
        set({
          deployments: deployments.map((d) =>
            d.id === activeDeploymentId
              ? {
                  ...d,
                  title: context.idea || d.title,
                  context,
                  nodes,
                  integrations,
                  implementationPartners,
                  messages,
                  updatedAt: now,
                }
              : d
          ),
        });
      },
    }),
    {
      name: "stacky-storage",
      partialize: (state) => ({
        userEmail: state.userEmail,
        context: {
          ...state.context,
          attachments: state.context.attachments?.map((a) =>
            a.type === "image" ? { ...a, content: "" } : a
          ),
        },
        messages: state.messages,
        nodes: state.nodes,
        integrations: state.integrations,
        implementationPartners: state.implementationPartners,
        outreachProfile: state.outreachProfile,
        deployments: state.deployments.map((d) => ({
          ...d,
          integrations: d.integrations ?? [],
          implementationPartners: d.implementationPartners ?? [],
          context: {
            ...d.context,
            attachments: d.context.attachments?.map((a) =>
              a.type === "image" ? { ...a, content: "" } : a
            ),
          },
        })),
        activeDeploymentId: state.activeDeploymentId,
      }),
    }
  )
);
