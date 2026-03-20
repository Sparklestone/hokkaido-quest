// /api/health.js
// Tests every API connection and returns a status report
// Hit this at: https://your-app.vercel.app/api/health

export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    checks: {},
    allPassed: true,
  };

  const GKEY = process.env.GOOGLE_MAPS_API_KEY;
  const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  // ── 1. Environment Variables ──
  results.checks.env = {
    name: "Environment Variables",
    GOOGLE_MAPS_API_KEY: GKEY ? `✅ Set (${GKEY.slice(0, 8)}...${GKEY.slice(-4)})` : "❌ MISSING",
    UPSTASH_REDIS_REST_URL: REDIS_URL ? `✅ Set (${REDIS_URL.slice(0, 30)}...)` : "⚠️ Not set (caching disabled)",
    UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN ? "✅ Set" : "⚠️ Not set (caching disabled)",
    passed: !!GKEY,
  };

  // ── 2. Google Places Text Search ──
  try {
    if (!GKEY) throw new Error("No API key");
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GKEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.photos",
      },
      body: JSON.stringify({ textQuery: "Sapporo Ramen Yokocho", languageCode: "en", maxResultCount: 1 }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
    const place = d.places?.[0];
    results.checks.placesSearch = {
      name: "Google Places Text Search",
      status: place ? "✅ Working" : "⚠️ No results",
      testQuery: "Sapporo Ramen Yokocho",
      result: place ? {
        name: place.displayName?.text,
        address: place.formattedAddress,
        rating: place.rating,
        photoCount: place.photos?.length || 0,
      } : null,
      passed: !!place,
    };
  } catch (e) {
    results.checks.placesSearch = { name: "Google Places Text Search", status: `❌ ${e.message}`, passed: false };
    results.allPassed = false;
  }

  // ── 3. Google Places Autocomplete ──
  try {
    if (!GKEY) throw new Error("No API key");
    const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GKEY },
      body: JSON.stringify({ input: "Niseko", includedRegionCodes: ["jp"] }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
    const count = d.suggestions?.length || 0;
    results.checks.placesAutocomplete = {
      name: "Google Places Autocomplete",
      status: count > 0 ? "✅ Working" : "⚠️ No suggestions",
      testInput: "Niseko",
      suggestionCount: count,
      firstSuggestion: d.suggestions?.[0]?.placePrediction?.text?.text || null,
      passed: count > 0,
    };
  } catch (e) {
    results.checks.placesAutocomplete = { name: "Google Places Autocomplete", status: `❌ ${e.message}`, passed: false };
    results.allPassed = false;
  }

  // ── 4. Google Places Photos ──
  try {
    if (!GKEY) throw new Error("No API key");
    // First get a photo ref from the search above
    const searchResult = results.checks.placesSearch?.result;
    const photoRef = results.checks.placesSearch?.passed
      ? await (async () => {
          const r2 = await fetch("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": GKEY,
              "X-Goog-FieldMask": "places.photos",
            },
            body: JSON.stringify({ textQuery: "Sapporo Ramen Yokocho", languageCode: "en", maxResultCount: 1 }),
          });
          const d2 = await r2.json();
          return d2.places?.[0]?.photos?.[0]?.name || null;
        })()
      : null;

    if (!photoRef) throw new Error("No photo ref available (Places Search must work first)");

    const photoUrl = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=200&maxHeightPx=200&key=${GKEY}`;
    const pr = await fetch(photoUrl, { redirect: "follow" });
    const contentType = pr.headers.get("content-type") || "";

    results.checks.placesPhotos = {
      name: "Google Places Photos",
      status: pr.ok && contentType.includes("image") ? "✅ Working" : `❌ Status ${pr.status}`,
      photoRef: photoRef.slice(0, 40) + "...",
      contentType,
      imageSize: pr.headers.get("content-length") || "unknown",
      passed: pr.ok && contentType.includes("image"),
    };
  } catch (e) {
    results.checks.placesPhotos = { name: "Google Places Photos", status: `❌ ${e.message}`, passed: false };
    results.allPassed = false;
  }

  // ── 5. Google Routes API ──
  try {
    if (!GKEY) throw new Error("No API key");
    // Sapporo Station → Nijo Market (short known route)
    const r = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GKEY,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: 43.0687, longitude: 141.3508 } } },
        destination: { location: { latLng: { latitude: 43.0589, longitude: 141.3561 } } },
        travelMode: "DRIVE",
      }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
    const route = d.routes?.[0];
    results.checks.routes = {
      name: "Google Routes API",
      status: route ? "✅ Working" : "⚠️ No route returned",
      testRoute: "Sapporo Station → Nijo Market",
      duration: route?.duration || null,
      distanceMeters: route?.distanceMeters || null,
      passed: !!route,
    };
  } catch (e) {
    results.checks.routes = { name: "Google Routes API", status: `❌ ${e.message}`, passed: false };
    results.allPassed = false;
  }

  // ── 6. Upstash Redis ──
  try {
    if (!REDIS_URL || !REDIS_TOKEN) throw new Error("Not configured (optional)");
    const testKey = "healthcheck:ping";
    const testVal = Date.now().toString();

    // Write
    const wr = await fetch(`${REDIS_URL}/set/${testKey}/${testVal}/ex/60`, {
      method: "POST",
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const wrd = await wr.json();
    if (wrd.error) throw new Error(wrd.error);

    // Read back
    const rr = await fetch(`${REDIS_URL}/get/${testKey}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const rrd = await rr.json();

    results.checks.redis = {
      name: "Upstash Redis Cache",
      status: rrd.result === testVal ? "✅ Working" : "⚠️ Write/read mismatch",
      wrote: testVal,
      readBack: rrd.result,
      passed: rrd.result === testVal,
    };
  } catch (e) {
    const isOptional = e.message.includes("Not configured");
    results.checks.redis = {
      name: "Upstash Redis Cache",
      status: isOptional ? "⚠️ Not configured (app works without it, but no caching)" : `❌ ${e.message}`,
      passed: isOptional, // not a failure if just not configured
    };
  }

  // ── Summary ──
  results.allPassed = Object.values(results.checks).every(c => c.passed !== false);
  results.summary = results.allPassed
    ? "🎉 All systems operational!"
    : "⚠️ Some checks failed — see details above";

  const failedCount = Object.values(results.checks).filter(c => c.passed === false).length;
  const passedCount = Object.values(results.checks).filter(c => c.passed === true).length;
  results.score = `${passedCount}/${passedCount + failedCount} checks passed`;

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(results);
}
