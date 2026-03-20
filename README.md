# 北海道 Hokkaido Quest

A PWA for finding adventures in Rusutsu, Niseko, and Sapporo while your family skis. Built with React + Vite, deployed on Vercel.

## Quick Deploy

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create hokkaido-quest --public --push
```

### 2. Deploy to Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import your `hokkaido-quest` repo
- Framework Preset: **Vite** (auto-detected)
- Click **Deploy**
- Done. You'll get a URL like `hokkaido-quest.vercel.app`

### 3. Install on iPhone
- Open the Vercel URL in **Safari** on iPhone
- Tap the **Share** button (square with arrow)
- Tap **Add to Home Screen**
- It now appears as a native app with its own icon

## Local Development
```bash
npm install
npm run dev
```

## Project Structure
```
hokkaido-quest/
├── public/
│   ├── favicon.svg          # App icon (SVG)
│   ├── pwa-192x192.png      # PWA icon small
│   ├── pwa-512x512.png      # PWA icon large
│   ├── apple-touch-icon.png  # iOS home screen icon
│   └── splash-*.png          # iOS splash screens
├── src/
│   ├── main.jsx              # React entry point
│   └── App.jsx               # Full app component
├── index.html                # HTML with iOS PWA meta tags
├── vite.config.js            # Vite + PWA plugin config
└── package.json
```

## Future API Integrations

When ready to add real data, you'll need these APIs:

### Google Places API (ratings, photos, hours)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable **Places API** and **Places Photos API**
3. Create an API key → Restrict to your Vercel domain
4. Add `VITE_GOOGLE_PLACES_KEY` to Vercel env vars

### Google Maps Directions API (real travel times)
1. Enable **Directions API** in the same Google Cloud project
2. Same API key works — real walking/driving/transit times replace estimates

### Google Maps Geocoding API (auto-detect location)
1. Enable **Geocoding API** in same project
2. Enables the location bar to auto-detect which city the user is in

### Google Places Autocomplete (address search)
1. Enable **Places Autocomplete** in same project
2. Powers the "Edit location" search bar with real address suggestions

### Unsplash API (better photos)
1. Register at [unsplash.com/developers](https://unsplash.com/developers)
2. Free tier: 50 requests/hour
3. Search by place name for location-specific photos

### Upstash Redis (caching)
1. Create a free database at [upstash.com](https://upstash.com)
2. Cache API responses to avoid rate limits
3. Add `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` to Vercel env vars
