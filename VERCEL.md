# Vercel env vars

No in-app API key UI — paste these in **Vercel → Project → Settings → Environment Variables**, then redeploy.

## Required

| Name | Value |
|------|--------|
| `OPENAI_API_KEY` | your `sk-...` key |

## Recommended

| Name | Value |
|------|--------|
| `STACKY_OWNER_EMAIL` | your email (visitor leads) |
| `OPENAI_MODEL` | `gpt-4o-mini` |

## Optional

`OPENAI_RESEARCH_MODEL`, `OPENAI_WEB_SEARCH`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STACKY_LEAD_WEBHOOK_URL`
