// /api/verify-activities.js
// Batch-checks activities against Google Places API
// Returns fresh hours, ratings, open/closed status
// Cached in Redis for 24h to avoid hammering the API

import { getCached } from './_lib/cache.js';

export default async function handler(req, res) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Google API key not configured' });

  // Accept POST with array of activities to verify
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  const { activities, location } = req.body;
  if (!activities || !Array.isArray(activities)) {
    return res.status(400).json({ error: 'activities array required' });
  }

  const results = {};
  const BATCH_SIZE = 5;
  const CACHE_TTL = 86400; // 24 hours

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < activities.length; i += BATCH_SIZE) {
    const batch = activities.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (activity) => {
      const cacheKey = `verify:${activity.mapQuery}`;

      const { data } = await getCached(cacheKey, async () => {
        try {
          // Search for the place
          const searchQuery = activity.name + ' ' + (activity.nameJp || '') + ' ' + (location || 'Hokkaido') + ' Japan';
          const response = await fetch(
            'https://places.googleapis.com/v1/places:searchText',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': key,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.currentOpeningHours,places.businessStatus,places.googleMapsUri',
              },
              body: JSON.stringify({
                textQuery: searchQuery,
                languageCode: 'en',
                maxResultCount: 1,
              }),
            }
          );

          const d = await response.json();
          if (d.error) {
            return { status: 'error', error: d.error.message };
          }

          const place = d.places?.[0];
          if (!place) {
            return { status: 'not_found' };
          }

          const businessStatus = place.businessStatus || 'OPERATIONAL';
          const isOpen = place.currentOpeningHours?.openNow ?? null;
          const hours = place.currentOpeningHours?.weekdayDescriptions || [];
          const rating = place.rating || null;
          const ratingCount = place.userRatingCount || 0;

          // Parse opening hours into openH/closeH if available
          let openH = null;
          let closeH = null;
          if (place.currentOpeningHours?.periods) {
            const periods = place.currentOpeningHours.periods;
            // Get today's hours
            const today = new Date().getDay(); // 0=Sun
            const todayPeriod = periods.find(p => p.open?.day === today);
            if (todayPeriod) {
              openH = todayPeriod.open?.hour ?? null;
              closeH = todayPeriod.close?.hour ?? null;
              // Handle midnight closing
              if (closeH === 0) closeH = 24;
            }
          }

          return {
            status: businessStatus === 'OPERATIONAL' ? 'open' :
                    businessStatus === 'CLOSED_TEMPORARILY' ? 'temp_closed' :
                    businessStatus === 'CLOSED_PERMANENTLY' ? 'perm_closed' :
                    'unknown',
            isOpenNow: isOpen,
            rating,
            ratingCount,
            openH,
            closeH,
            hours,
            mapsUrl: place.googleMapsUri || null,
            address: place.formattedAddress || null,
            verifiedAt: new Date().toISOString(),
          };
        } catch (e) {
          return { status: 'error', error: e.message };
        }
      }, CACHE_TTL);

      results[activity.mapQuery] = data;
    });

    await Promise.all(promises);

    // Small delay between batches to be respectful of rate limits
    if (i + BATCH_SIZE < activities.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json({
    verified: Object.keys(results).length,
    total: activities.length,
    timestamp: new Date().toISOString(),
    results,
  });
}
