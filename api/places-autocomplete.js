// /api/places-autocomplete.js
// Proxies Google Places Autocomplete (New) API
// Used by the "Edit location" search bar

import { getCached } from './_lib/cache.js';

export default async function handler(req, res) {
  const { input, lat, lng } = req.query;
  
  if (!input || input.length < 2) {
    return res.status(400).json({ error: 'Input too short' });
  }
  
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Google API key not configured' });
  
  const cacheKey = `autocomplete:${input}:${lat}:${lng}`;
  
  const { data } = await getCached(cacheKey, async () => {
    const body = {
      input,
      languageCode: 'en',
      includedRegionCodes: ['jp'],
    };
    
    // Bias results toward user's location if provided
    if (lat && lng) {
      body.locationBias = {
        circle: {
          center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          radius: 50000 // 50km radius
        }
      };
    }
    
    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
        },
        body: JSON.stringify(body)
      }
    );
    
    const data = await response.json();
    
    if (!data.suggestions) return [];
    
    return data.suggestions
      .filter(s => s.placePrediction)
      .map(s => ({
        placeId: s.placePrediction.placeId,
        text: s.placePrediction.text?.text || '',
        mainText: s.placePrediction.structuredFormat?.mainText?.text || '',
        secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
      }))
      .slice(0, 5);
  }, 3600); // Cache 1 hour
  
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json(data);
}
