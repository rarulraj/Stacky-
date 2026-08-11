# Deploy Stacky to Vercel

No user accounts — visitors only enter an email. Put your OpenAI key on the server so anyone can hop on and generate graphs.

## 1. Push the repo

```bash
cd ~/stacky
git push -u origin main
```

## 2. Import on Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import the Stacky GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.` (repo root)

## 3. Environment variables

In **Project → Settings → Environment Variables**, add:

| Name | Value | Environments |
|------|--------|--------------|
| `OPENAI_API_KEY` | `sk-...` | Production, Preview |
| `OPENAI_MODEL` | `gpt-4o-mini` (or `gpt-4o`) | Production, Preview |
| `STACKY_OWNER_EMAIL` | your email — lead notifications via Resend | Production |
| `RESEND_API_KEY` | optional — required to email leads to you | Production |
| `STACKY_LEAD_WEBHOOK_URL` | optional Slack/Zapier webhook for leads | Production |
| `NEXT_PUBLIC_SHOW_API_KEY_UI` | `false` in production (server key only) | Production |

Redeploy after saving env vars.

## 4. Share the URL

Give your boss / demos the Vercel URL (e.g. `https://stacky.vercel.app`).

Visitors:
1. Enter email (no signup)
2. Pick a historian or describe the stack in natural language
3. Generate / expand the architecture
4. **Manually edit** the graph (drag, add, delete, pencil)
5. **Download** PNG, SVG, JSON, HTML, or Markdown report
