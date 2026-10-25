# Telegram Mini App — Meme Coin Tracker

React + Vite + TypeScript Mini App for the owner dashboard.

## Screens

| Route | Purpose |
|-------|---------|
| `/` | Dashboard: service status, providers, discovery, recent tokens |
| `/tokens` | Evaluate address + filter stored tokens |
| `/tokens/:chain/:address` | Scores, reasons, re-evaluate |
| `/service` | Desired vs actual scanner state, readiness, providers |
| `/settings` | Versions, chains, Telegram session info |

## Rules

- **No secrets in the browser.** Only public/API calls.
- Qualification is **server-side only**.
- Live trading remains **OFF**.
- Telegram `initData` must be validated on the backend before trusting user IDs.

## Develop

```bash
cd apps/miniapp
npm install
# API on :8000
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api`, `/health`, `/ready` to the API.

Optional: `VITE_API_BASE_URL=https://your-api.example.com`

## Build for static host / Telegram Web App

```bash
npm run build
# output: dist/
```

Serve `dist/` over **HTTPS**. Set Telegram Bot menu button / Web App URL to that origin.

## Env

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Absolute API origin when not same-host |
