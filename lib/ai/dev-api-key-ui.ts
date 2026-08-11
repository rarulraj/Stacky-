/** Dev-only UI for entering an OpenAI key in the browser. Remove for production. */
export function showDevApiKeyUi(): boolean {
  return process.env.NEXT_PUBLIC_SHOW_API_KEY_UI !== "false";
}
