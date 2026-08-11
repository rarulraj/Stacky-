# Stacky

AI systems architect for industrial historians and OT platforms — living architecture graphs, no account required.

## What it does

1. **Intent gate** — architectural diagram (zones/firewalls/ports) **or** commercial quote (products + outreach)
2. **Email gate** — visitors enter a work email only (no signup)
3. **Historian planning** — TDengine, AVEVA PI, Canary Labs, Ignition, InfluxDB (or free-form natural language)
4. **Intake** — guided Q&A or natural language
5. **Architecture graph** — high-fidelity editable blueprint: drag nodes, connect edges, edit ports, add zones/firewalls, expand, rebuild, export
6. **Leads** — your inbox / webhook gets their email when they start

## Stack

- Next.js (App Router) + TypeScript + Tailwind + React Flow
- OpenAI on the **server** (`OPENAI_API_KEY`) so users just hop on
- Zustand + localStorage for drafts/deployments

## Local

```bash
npm install
cp .env.example .env.local
# set OPENAI_API_KEY (and STACKY_OWNER_EMAIL if you want lead emails)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without an API key, Stacky still builds a **template** architecture so you can demo the graph editor.

## Production (Vercel)

See **[DEPLOY.md](./DEPLOY.md)** for the full path:

- Import GitHub repo → set `OPENAI_API_KEY` + `STACKY_OWNER_EMAIL`
- Set `NEXT_PUBLIC_SHOW_API_KEY_UI=false`
- Redeploy — share the Vercel URL; users only enter email

## Project layout

```
app/
  api/architect/   # LLM routes (question, graph, expand)
  api/leads/       # Email capture → owner notify / webhook
  build/           # Intake
  graph/           # Architecture canvas
components/
  access/          # Email gate
  landing/         # Hero + historian planning
lib/
  historians.ts    # TDengine, PI, Canary, Ignition, InfluxDB
  ai/              # Server LLM client
  mock/            # Template fallback
```
