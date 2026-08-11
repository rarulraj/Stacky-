const STORAGE_KEY = "stacky-openai-api-key";
export const API_KEY_CHANGE_EVENT = "stacky-api-key-change";

function notifyApiKeyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(API_KEY_CHANGE_EVENT));
}

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  notifyApiKeyChange();
}

export function clearStoredApiKey(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  notifyApiKeyChange();
}

export function getApiHeaders(): Record<string, string> {
  const key = getStoredApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key) {
    headers["x-stacky-api-key"] = key;
  }
  return headers;
}

export function getApiHeadersPlain(): Record<string, string> {
  const key = getStoredApiKey();
  if (!key) return {};
  return { "x-stacky-api-key": key };
}
