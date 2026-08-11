/** Always off. OpenAI key comes only from server env (Vercel / .env.local). */
export function showDevApiKeyUi(): boolean {
  return false;
}
