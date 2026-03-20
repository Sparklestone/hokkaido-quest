# 北海道 Hokkaido Quest

A PWA for finding adventures in Rusutsu, Niseko, and Sapporo. Built with React + Vite, Vercel Serverless Functions, Google Maps Platform, and Upstash Redis.

---

## Quick Deploy (3 steps)

### Step 1 — Push to GitHub
```bash
cd hokkaido-quest
git init && git add . && git commit -m "Initial commit"
gh repo create hokkaido-quest --public --push
```

### Step 2 — Set up APIs (see detailed guide below)

### Step 3 — Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `hokkaido-quest` repo
3. Add environment variables (see below)
4. Deploy

---

## API Setup Guide

You need **one Google API key** and **one Upstash Redis database**. Total cost: **$0** for this use case (well within free tiers).

### A. Google Maps Platform (one key powers everything)

1. **Go to** [console.cloud.google.com](https://console.cloud.google.com)

2. **Create a new project** (or select existing):
   - Click the project dropdown at top → "New Project"
   - Name it `hokkaido-quest` → Create

3. **Enable billing** (required even for free tier):
   - Navigation menu → Billing → Link a billing account
   - You won't be charged — free tier covers this app easily

4. **Enable these 3 APIs:**
   - Go to: APIs & Services → Library
   - Search and enable each:
     - ✅ **Places API (New)** — autocomplete, details, photos
     - ✅ **Routes API** — travel time calculations
     - ✅ **Geocoding API** — reverse geocode user location

5. **Create an API key:**
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy the key — this is your `GOOGLE_MAPS_API_KEY`

6. **Restrict the key** (important for security):
   - Click the key → "Edit"
   - Under "Application restrictions":
     - Select "HTTP referrers"
     - Add: `your-app.vercel.app/*` and `localhost:5173/*`
   - Under "API restrictions":
     - Select "Restrict key"
     - Choose: Places API (New), Routes API, Geocoding API
   - Save

**What this costs:** The new pricing model gives per-SKU free monthly caps. For a small app like this you'll stay well within free limits. Places Essentials gets ~5,000 free calls/month, Routes Essentials gets ~5,000 free, Geocoding gets ~10,000 free.

### B. Upstash Redis (caching layer — optional but recommended)

Caching saves you from hitting Google's API repeatedly for the same data. A place's details don't change hour to hour.

1. **Go to** [console.upstash.com](https://console.upstash.com) and create an account

2. **Create a Redis database:**
   - Click "Create Database"
   - Name: `hokkaido-quest`
   - Region: **Japan (Tokyo)** for lowest latency
   - Type: Regional
   - Plan: Free (500K commands/month)

3. **Get credentials:**
   - Click into your database
   - Go to the **REST API** section
   - Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**What this costs:** Free. 500K commands/month, 256MB storage, no credit card needed.

### C. Add Environment Variables to Vercel

1. Go to your project on Vercel → Settings → Environment Variables
2. Add these three:

| Variable | Value | Where to get it |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | `AIza...` | Google Cloud Console → Credentials |
| `UPSTASH_REDIS_REST_URL` | `https://...upstash.io` | Upstash Console → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | `AXxx...` | Upstash Console → REST API |

3. Click "Redeploy" to pick up the new variables

---

## Architecture

```
Browser (React PWA)
  │
  ├── /api/places-autocomplete  → Google Places Autocomplete (New)
  ├── /api/places-details       → Google Places Details (New) + Text Search
  ├── /api/places-photo         → Google Places Photos (proxied binary)
  ├── /api/routes               → Google Routes API (travel times)
  │
  └── All API routes use:
      └── Upstash Redis cache (24h for details, 1h for routes)
```

**Why serverless proxy?** Google API keys must stay server-side. Vercel serverless functions handle each request, check the Redis cache first, and only call Google if needed. Photos are proxied as binary so the key never touches the browser.

---

## Local Development

```bash
npm install

# Copy env template and fill in your keys
cp .env.example .env

# Run locally (API routes work via Vercel CLI)
npx vercel dev
```

Note: `npm run dev` (Vite only) works for the frontend but API routes won't function without `vercel dev`.

---

## Project Structure
```
hokkaido-quest/
├── api/                         # Vercel Serverless Functions
│   ├── _lib/
│   │   └── cache.js             # Upstash Redis caching utility
│   ├── places-autocomplete.js   # Location search suggestions
│   ├── places-details.js        # Place ratings, hours, photos
│   ├── places-photo.js          # Photo binary proxy
│   └── routes.js                # Travel time calculations
├── public/
│   ├── favicon.svg              # App icon
│   ├── pwa-*.png                # PWA icons
│   ├── apple-touch-icon.png     # iOS icon
│   └── splash-*.png             # iOS splash screens
├── src/
│   ├── api-client.js            # Frontend API client
│   ├── App.jsx                  # Full app component
│   └── main.jsx                 # React entry
├── .env.example                 # Environment variable template
├── index.html                   # HTML with PWA meta tags
├── package.json
├── vercel.json                  # Vercel routing config
└── vite.config.js               # Vite + PWA plugin
```

## Install on iPhone
1. Open the Vercel URL in **Safari**
2. Tap **Share** (square with arrow) → **Add to Home Screen**
3. Launches full-screen like a native app
