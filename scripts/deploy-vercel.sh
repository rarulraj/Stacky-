#!/usr/bin/env bash
# Instant deploy: push main → Vercel production (uses local .env.local for env sync)
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local — copy .env.example and add OPENAI_API_KEY first."
  exit 1
fi

echo "→ Pushing to GitHub…"
git push -u origin HEAD:main

echo "→ Deploying to Vercel (production)…"
npx --yes vercel@latest pull --yes --environment=production 2>/dev/null || true
npx --yes vercel@latest --prod --yes

echo ""
echo "Done. Set env vars in the Vercel dashboard if this is the first deploy:"
echo "  OPENAI_API_KEY, STACKY_OWNER_EMAIL, NEXT_PUBLIC_SHOW_API_KEY_UI=false"
echo "Then: npx vercel --prod --yes"
