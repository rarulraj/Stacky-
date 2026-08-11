# Vercel env vars (copy into the deploy form)

## Required

| Name | Value |
|------|--------|
| `OPENAI_API_KEY` | your `sk-...` key |
| `NEXT_PUBLIC_SHOW_API_KEY_UI` | `false` |

## Recommended

| Name | Value |
|------|--------|
| `STACKY_OWNER_EMAIL` | your email (gets each visitor’s email) |
| `OPENAI_MODEL` | `gpt-4o-mini` |

## Optional

| Name | When |
|------|------|
| `OPENAI_RESEARCH_MODEL` | `gpt-4o` for better vendor research |
| `OPENAI_WEB_SEARCH` | `true` (default) |
| `RESEND_API_KEY` | if you want lead emails delivered to `STACKY_OWNER_EMAIL` |
| `RESEND_FROM_EMAIL` | e.g. `Stacky <onboarding@resend.dev>` |
| `STACKY_LEAD_WEBHOOK_URL` | Slack/Zapier webhook instead of/in addition to email |

Nothing is saved in the visitor’s browser (no localStorage). Graphs live in memory for the tab session; they can **export/download** files.
