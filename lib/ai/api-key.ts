/** Optional browser-dev override — memory only, never localStorage. */
export const API_KEY_CHANGE_EVENT = "stacky-api-key-change";

let memoryApiKey: string | null = null;

function notifyApiKeyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(API_KEY_CHANGE_EVENT));
}

export function getStoredApiKey(): string | null {
  return memoryApiKey;
}

export function setStoredApiKey(key: string): void {
  memoryApiKey = key.trim() || null;
  notifyApiKeyChange();
}

export function clearStoredApiKey(): void {
  memoryApiKey = null;
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
