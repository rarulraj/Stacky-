"use client";

import { useEffect, useRef } from "react";
import { saveEmailMemory } from "@/lib/memory/client";
import { useStackyStore } from "@/lib/store";

/**
 * Debounced sync of the current session into email-keyed server memory.
 * No browser persistence — only the email locker on the server.
 */
export function MemorySync() {
  const userEmail = useStackyStore((s) => s.userEmail);
  const context = useStackyStore((s) => s.context);
  const messages = useStackyStore((s) => s.messages);
  const nodes = useStackyStore((s) => s.nodes);
  const integrations = useStackyStore((s) => s.integrations);
  const implementationPartners = useStackyStore((s) => s.implementationPartners);
  const deployments = useStackyStore((s) => s.deployments);
  const activeDeploymentId = useStackyStore((s) => s.activeDeploymentId);
  const outreachProfile = useStackyStore((s) => s.outreachProfile);
  const memoryNotes = useStackyStore((s) => s.memoryNotes);
  const memoryHydrated = useStackyStore((s) => s.memoryHydrated);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (!userEmail || !memoryHydrated) return;

    // Avoid writing empty shell immediately after hydrate
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const note =
        context.idea && nodes.length > 0
          ? `Blueprint: ${context.idea.slice(0, 120)} (${nodes.length} nodes)`
          : undefined;

      void saveEmailMemory({
        email: userEmail,
        context,
        messages,
        nodes,
        integrations,
        implementationPartners,
        deployments,
        activeDeploymentId,
        outreachProfile: { ...outreachProfile, email: userEmail },
        notes: memoryNotes,
        note,
      }).catch(() => {
        // best-effort
      });
    }, 1200);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [
    userEmail,
    memoryHydrated,
    context,
    messages,
    nodes,
    integrations,
    implementationPartners,
    deployments,
    activeDeploymentId,
    outreachProfile,
    memoryNotes,
  ]);

  // Reset skip when email changes
  useEffect(() => {
    skipFirst.current = true;
  }, [userEmail]);

  return null;
}
