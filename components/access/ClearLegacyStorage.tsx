"use client";

import { useEffect } from "react";
import { clearLegacyBrowserStorage } from "@/lib/access/email";

/** One-shot cleanup of old localStorage keys from earlier builds. */
export function ClearLegacyStorage() {
  useEffect(() => {
    clearLegacyBrowserStorage();
  }, []);
  return null;
}
