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

## Email memories (no accounts)

| Name | Value |
|------|--------|
| `UPSTASH_REDIS_REST_URL` | from [Upstash](https://upstash.com) Redis (free tier) |
| `UPSTASH_REDIS_REST_TOKEN` | same |

Without Upstash, local/dev uses `.data/memories` (not durable on Vercel).

## Optional

`OPENAI_RESEARCH_MODEL`, `OPENAI_WEB_SEARCH`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STACKY_LEAD_WEBHOOK_URL`
