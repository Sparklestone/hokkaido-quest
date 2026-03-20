// /api/routes.js
// Proxies Google Routes API (replacement for legacy Directions API)
// Returns travel duration and distance between two points

import { getCached } from './_lib/cache.js';

export default async function handler(req, res) {
  const { originLat, originLng, destLat, destLng, mode = 'DRIVE' } = req.query;
  
  if (!originLat || !originLng || !destLat || !destLng) {
    return res.status(400).json({ error: 'Origin and destination coordinates required' });
  }
  
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Google API key not configured' });
  
  // Map our app modes to Google Routes API travel modes
  const travelMode = {
    'DRIVE': 'DRIVE',
    'WALK': 'WALK',
    'TRANSIT': 'TRANSIT',
    'car': 'DRIVE',
    'walking': 'WALK',
    'bus': 'TRANSIT',
  }[mode] || 'DRIVE';
  
  const cacheKey = `route:${originLat},${originLng}:${destLat},${destLng}:${travelMode}`;
  
  const { data } = await getCached(cacheKey, async () => {
    const body = {
      origin: {
        location: {
          latLng: {
            latitude: parseFloat(originLat),
            longitude: parseFloat(originLng)
          }
        }
      },
      destination: {
        location: {
          latLng: {
            latitude: parseFloat(destLat),
            longitude: parseFloat(destLng)
          }
        }
      },
      travelMode,
      routingPreference: travelMode === 'DRIVE' ? 'TRAFFIC_AWARE' : undefined,
      computeAlternativeRoutes: false,
      languageCode: 'en',
    };
    
    // Remove undefined fields
    Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
    
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify(body)
      }
    );
    
    const d = await response.json();
    
    if (!d.routes || !d.routes[0]) {
      return { durationMinutes: null, distanceKm: null, error: 'No route found' };
    }
    
    const route = d.routes[0];
    const durationSec = parseInt(route.duration?.replace('s', '') || '0');
    const distanceM = route.distanceMeters || 0;
    
    return {
      durationMinutes: Math.round(durationSec / 60),
      distanceKm: +(distanceM / 1000).toFixed(1),
      durationText: formatDuration(durationSec),
    };
  }, 3600); // Cache 1 hour (traffic changes)
  
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json(data);
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
