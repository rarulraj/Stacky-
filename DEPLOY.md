# Deploy Stacky to Vercel

No user accounts. visitors only enter an email. Your OpenAI key lives on the server so anyone can hop on and generate graphs.

## 1. Push the repo

```bash
cd ~/stacky
git add .
git commit -m "feat: historian planning, email gate, graph builder"
git push -u origin main
```

Repo: https://github.com/rarulraj/Stacky-.git

## 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `rarulraj/Stacky-`
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `.`
5. Click **Deploy** once, then add env vars and redeploy

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Required | Value |
|------|----------|--------|
| `OPENAI_API_KEY` | **Yes** | Your OpenAI key. powers questions, graphs, expand |
| `OPENAI_MODEL` | No | `gpt-4o-mini` (default) |
| `OPENAI_RESEARCH_MODEL` | No | `gpt-4o` (web research for vendors) |
| `OPENAI_WEB_SEARCH` | No | `true` |
| `NEXT_PUBLIC_SHOW_API_KEY_UI` | Recommended | `false`. hide per-user API key UI in prod |
| `STACKY_OWNER_EMAIL` | Recommended | Your email. receive each lead’s address |
| `STACKY_LEAD_WEBHOOK_URL` | Optional | Slack/Zapier/Make webhook for leads |
| `RESEND_API_KEY` | Optional | Needed to email leads to `STACKY_OWNER_EMAIL` |
| `RESEND_FROM_EMAIL` | Optional | `Stacky <outreach@yourdomain.com>` |

After saving env vars: **Deployments → … → Redeploy**.

## 4. What visitors experience

1. Open the Vercel URL  
2. Type a system description **or** pick a historian (TDengine, PI, Canary, Ignition, InfluxDB)  
3. Enter **work email only** (no password / signup)  
4. Answer a few questions (or natural language) → interactive architecture graph  
5. Drag nodes, add/delete children, rebuild, export PNG/JSON/report  

You get their email via Resend (`STACKY_OWNER_EMAIL`) and/or `STACKY_LEAD_WEBHOOK_URL`. Vercel function logs also print `[stacky-lead]`.

## 5. CLI alternative

```bash
npm i -g vercel
cd ~/stacky
vercel
vercel env add OPENAI_API_KEY
vercel env add STACKY_OWNER_EMAIL
vercel env add NEXT_PUBLIC_SHOW_API_KEY_UI   # value: false
vercel --prod
```

## 6. Local check before deploy

```bash
cp .env.example .env.local
# set OPENAI_API_KEY and STACKY_OWNER_EMAIL
npm run build
npm run start
```
