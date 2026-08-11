# Stacky Setup Guide

## Add your OpenAI API Key

Stacky needs an OpenAI API key to:
- Generate custom architecture graphs
- Ask intelligent follow-up questions
- **Find real vendors with contact emails, phone numbers, and sales pages**

Without a key, Stacky runs in **template mode** with generic placeholder content.

---

## Option 1. In the app (quickest)

1. Open Stacky at [http://localhost:3000](http://localhost:3000)
2. Click **API Key** in the top-right nav
3. Paste your key (`sk-...`) and click **Save key**
4. You'll see a green **AI** badge when active

Your key is stored in your browser only and sent to Stacky's server routes (never logged).

Get a key: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## Option 2. Server config (recommended for dev)

1. In the project root (`~/stacky`), create a file named `.env.local`:

```bash
cd ~/stacky
cp .env.example .env.local
```

2. Edit `.env.local`:

```env
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
```

3. Restart the dev server:

```bash
npm run dev
```

---

## Edit graphs manually

On the **graph page**:

- **Drag** any node to reposition it
- Bottom-left **Add / Delete / Layout** bar. add a child under the selected node, delete a subtree, or auto-layout
- Open a node → **pencil** icon to edit labels, overview, tech picks, cost, etc.
- Side panel also has **Add child** and **Delete**

## Download graphs & blueprints

Toolbar → **Download**:

| Option | What it downloads |
|--------|-------------------|
| **PNG diagram** | Architecture graph image |
| **SVG diagram** | Vector graph |
| **JSON blueprint** | Full editable data (nodes, context, vendors) |
| **HTML report** | Shareable blueprint page |
| **Markdown report** | Architecture tree + vendor contact list |

The **Markdown report** is your outreach list. every vendor with contact points.

## Deploy to Vercel

See [VERCEL.md](./VERCEL.md). set `OPENAI_API_KEY` on the server so visitors need only an email.

---

## Run Stacky

```bash
cd ~/stacky
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
