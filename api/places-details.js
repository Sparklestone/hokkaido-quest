// /api/places-details.js
// Proxies Google Places Details (New) API
// Returns rating, hours, address, photos for a place

import { getCached } from './_lib/cache.js';

export default async function handler(req, res) {
  const { placeId, query, lat, lng } = req.query;
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Google API key not configured' });
  
  // If we have a placeId, get details directly
  if (placeId) {
    const cacheKey = `details:${placeId}`;
    const { data } = await getCached(cacheKey, async () => {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'displayName,formattedAddress,rating,userRatingCount,currentOpeningHours,photos,location,googleMapsUri',
          }
        }
      );
      const d = await response.json();
      return formatPlace(d);
    }, 86400); // Cache 24 hours
    
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(data);
  }
  
  // Otherwise, search by text query
  if (query) {
    const cacheKey = `textsearch:${query}:${lat}:${lng}`;
    const { data } = await getCached(cacheKey, async () => {
      const body = {
        textQuery: query + ' Japan',
        languageCode: 'en',
        maxResultCount: 1,
      };
      
      if (lat && lng) {
        body.locationBias = {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: 50000
          }
        };
      }
      
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.currentOpeningHours,places.photos,places.location,places.googleMapsUri',
          },
          body: JSON.stringify(body)
        }
      );
      
      const d = await response.json();
      if (d.places && d.places[0]) return formatPlace(d.places[0]);
      return null;
    }, 86400);
    
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
    return res.status(200).json(data);
  }
  
  return res.status(400).json({ error: 'Provide placeId or query' });
}

function formatPlace(p) {
  if (!p) return null;
  return {
    name: p.displayName?.text || '',
    address: p.formattedAddress || '',
    rating: p.rating || null,
    ratingCount: p.userRatingCount || 0,
    lat: p.location?.latitude || null,
    lng: p.location?.longitude || null,
    mapsUrl: p.googleMapsUri || '',
    isOpen: p.currentOpeningHours?.openNow ?? null,
    hours: p.currentOpeningHours?.weekdayDescriptions || [],
    photoRefs: (p.photos || []).slice(0, 5).map(ph => ph.name),
  };
}
