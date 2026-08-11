const EMAIL_KEY = "stacky-user-email";
export const EMAIL_CHANGE_EVENT = "stacky-email-change";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function getStoredUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY);
}

export function setStoredUserEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  window.dispatchEvent(new Event(EMAIL_CHANGE_EVENT));
}

export function clearStoredUserEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(EMAIL_KEY);
  window.dispatchEvent(new Event(EMAIL_CHANGE_EVENT));
}
