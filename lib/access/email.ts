/** Session-only email helpers. nothing written to the browser. */

export const EMAIL_CHANGE_EVENT = "stacky-email-change";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let sessionEmail: string | null = null;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function getStoredUserEmail(): string | null {
  return sessionEmail;
}

export function setStoredUserEmail(email: string): void {
  sessionEmail = email.trim().toLowerCase();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EMAIL_CHANGE_EVENT));
  }
}

export function clearStoredUserEmail(): void {
  sessionEmail = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EMAIL_CHANGE_EVENT));
  }
}

/** Wipe any leftover keys from older Stacky builds */
export function clearLegacyBrowserStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("stacky-storage");
    localStorage.removeItem("stacky-user-email");
    localStorage.removeItem("stacky-openai-api-key");
  } catch {
    // ignore
  }
}
