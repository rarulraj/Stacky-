/** Client no longer carries API keys — server uses OPENAI_API_KEY from env. */
export const API_KEY_CHANGE_EVENT = "stacky-api-key-change";

export function getStoredApiKey(): string | null {
  return null;
}

export function setStoredApiKey(_key: string): void {
  // no-op — keys are not stored in the browser
}

export function clearStoredApiKey(): void {
  // no-op
}

export function getApiHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

export function getApiHeadersPlain(): Record<string, string> {
  return {};
}
