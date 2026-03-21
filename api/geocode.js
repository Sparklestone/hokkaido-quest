// /api/geocode.js
// Reverse geocodes lat/lng to a readable address using Google Geocoding API
// Used by the "Use My Location" button

import { getCached } from './_lib/cache.js';

export default async function handler(req, res) {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Google API key not configured' });

  const cacheKey = `geocode:${parseFloat(lat).toFixed(4)},${parseFloat(lng).toFixed(4)}`;

  const { data } = await getCached(cacheKey, async () => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&language=en&result_type=street_address|point_of_interest|premise|establishment`;

    const response = await fetch(url);
    const d = await response.json();

    if (d.status !== 'OK' || !d.results?.length) {
      // Try again without result_type filter for broader match
      const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&language=en`;
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();

      if (fallbackData.status === 'OK' && fallbackData.results?.length) {
        return {
          address: fallbackData.results[0].formatted_address,
          placeId: fallbackData.results[0].place_id,
          types: fallbackData.results[0].types,
        };
      }
      return null;
    }

    return {
      address: d.results[0].formatted_address,
      placeId: d.results[0].place_id,
      types: d.results[0].types,
    };
  }, 86400); // Cache 24 hours — addresses don't change

  if (!data) {
    return res.status(404).json({ error: 'No address found for these coordinates' });
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  return res.status(200).json(data);
}
