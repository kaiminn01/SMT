# Emerge Intel — Social Intelligence Tool

A production-ready internal web app for Web3 social media teams, powered by **xAI Grok**.

Built with Next.js 14 App Router + Tailwind CSS. No Twitter/X API required.

---

## Features

| Tab | What it does |
|-----|-------------|
| **Trends** | Scan keyword clusters for trending narratives, reply angles, and post angles |
| **Replies** | Paste a tweet → get 5 labelled reply options (safe/balanced/aggressive) with tone variants |
| **KOL Search** | Find relevant KOLs by niche with engagement strategy per account |
| **Partners** | Discover partnership opportunities with BD-ready outreach angles |
| **Assistant** | Multi-turn Grok chat for any ad-hoc research question |

---

## Quick Start

### 1. Clone or unzip the project

```bash
cd grok-social-tool
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your xAI API key:

```env
XAI_API_KEY=xai-your-key-here
```

Get your API key at: **https://console.x.ai/**

### 4. Run in development

```bash
npm run dev
```

Open **http://localhost:3000**

### 5. Build for production

```bash
npm run build
npm start
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `XAI_API_KEY` | ✅ Yes | — | Your xAI API key |
| `GROK_MODEL` | No | `grok-3` | Override the Grok model |
| `GROK_DEBUG` | No | `false` | Log API calls to console |

**Model options** (set via `GROK_MODEL`):
- `grok-3` — best reasoning and prompt following (recommended)
- `grok-3-mini` — faster, cheaper, good for most tasks

---

## File Structure

```
grok-social-tool/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── trends/route.ts       # Trend Scanner API
│   │   │   ├── replies/route.ts      # Reply Generator API
│   │   │   ├── kol/route.ts          # KOL Search API
│   │   │   ├── partners/route.ts     # Partner Search API
│   │   │   └── assistant/route.ts    # General Assistant API
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Tab shell / main page
│   ├── components/
│   │   ├── ui.tsx                    # Shared atomic components
│   │   ├── TrendsTab.tsx
│   │   ├── RepliesTab.tsx
│   │   ├── KOLTab.tsx
│   │   ├── PartnersTab.tsx
│   │   └── AssistantTab.tsx
│   └── lib/
│       └── grok.ts                   # xAI Grok API helper (core)
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API Routes Reference

All routes accept `POST` with JSON body and return JSON.

### `POST /api/trends`
```json
{ "keywords": ["crypto", "Base", "prediction markets"] }
```

### `POST /api/replies`
```json
{
  "tweet_text": "the tweet to reply to",
  "tones": ["casual", "crypto-native", "non-shilly", "witty"]
}
```

### `POST /api/kol`
```json
{
  "niche": "DeFi / prediction markets",
  "account_list": "@handle1, @handle2"
}
```

### `POST /api/partners`
```json
{
  "niche": "prediction markets",
  "ecosystem": "Base",
  "category": "DEX"
}
```

### `POST /api/assistant`
```json
{
  "messages": [
    { "role": "user", "content": "your question" }
  ]
}
```

---

## Deployment

### Vercel (recommended — zero config)

```bash
npm i -g vercel
vercel deploy
```

Set `XAI_API_KEY` in the Vercel dashboard under **Project → Settings → Environment Variables**.

### Railway / Render / Fly.io

1. Connect your repo
2. Set `XAI_API_KEY` as an environment variable in the platform dashboard
3. Build command: `npm run build`
4. Start command: `npm start`
5. Port: `3000`

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t emerge-intel .
docker run -p 3000:3000 -e XAI_API_KEY=xai-xxx emerge-intel
```

---

## Adding Scheduled Trend Checks (optional, future)

The tool is designed to work on-demand without cron. To add scheduled checks:

1. Add a `/api/cron/trends` route that calls the trends logic with your default keywords
2. Use **Vercel Cron Jobs** (add to `vercel.json`):
   ```json
   { "crons": [{ "path": "/api/cron/trends", "schedule": "0 9 * * *" }] }
   ```
3. Or use an external scheduler (GitHub Actions, Railway cron, EasyCron) to `POST` to the endpoint

---

## Future Improvements

See `FUTURE.md` or the notes below.
