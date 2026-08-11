# Deploy Stacky to Vercel (instant)

Repo is live: https://github.com/rarulraj/Stacky-

## Fastest path (one click)

**[Deploy to Vercel →](https://vercel.com/new/clone?repository-url=https://github.com/rarulraj/Stacky-&project-name=stacky&env=OPENAI_API_KEY,OPENAI_MODEL,STACKY_OWNER_EMAIL,NEXT_PUBLIC_SHOW_API_KEY_UI&envDescription=Server%20OpenAI%20key%20+%20your%20email%20for%20leads.%20Set%20NEXT_PUBLIC_SHOW_API_KEY_UI%20to%20false.&envLink=https://github.com/rarulraj/Stacky-/blob/main/.env.example)**

When prompted, set:

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | your `sk-...` key (same as local `.env.local`) |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `STACKY_OWNER_EMAIL` | `arun@tdengine.com` (or your inbox) |
| `NEXT_PUBLIC_SHOW_API_KEY_UI` | `false` |

Deploy → share the `*.vercel.app` URL. Visitors only enter email.

## CLI (after `npx vercel login`)

```bash
cd ~/stacky
npx vercel login          # once — opens browser
npx vercel link --yes
npx vercel env add OPENAI_API_KEY production
npx vercel env add STACKY_OWNER_EMAIL production
npx vercel env add NEXT_PUBLIC_SHOW_API_KEY_UI production   # false
npx vercel --prod --yes
# or:
npm run deploy
```

## Local already configured

`.env.local` is set on this machine (not committed). Dev server: http://localhost:3000
