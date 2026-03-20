// Frontend API client for Hokkaido Quest
// All calls go through Vercel serverless functions (/api/*)
// API keys stay server-side, never exposed to the browser

const API_BASE = '/api';

// ─── Places Autocomplete ───
// Used by the "Edit location" search bar
export async function searchPlaces(input, lat, lng) {
  if (!input || input.length < 2) return [];
  const params = new URLSearchParams({ input });
  if (lat) params.set('lat', lat);
  if (lng) params.set('lng', lng);
  
  try {
    const res = await fetch(`${API_BASE}/places-autocomplete?${params}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ─── Place Details ───
// Get rating, hours, address, photo refs for a place
export async function getPlaceDetails({ placeId, query, lat, lng }) {
  const params = new URLSearchParams();
  if (placeId) params.set('placeId', placeId);
  if (query) params.set('query', query);
  if (lat) params.set('lat', lat);
  if (lng) params.set('lng', lng);
  
  try {
    const res = await fetch(`${API_BASE}/places-details?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Place Photo URL ───
// Returns a URL that serves the actual image through our proxy
export function getPhotoUrl(photoRef, width = 600, height = 400) {
  if (!photoRef) return null;
  return `${API_BASE}/places-photo?ref=${encodeURIComponent(photoRef)}&w=${width}&h=${height}`;
}

// ─── Travel Time ───
// Get real travel duration between two points
export async function getTravelTime(originLat, originLng, destLat, destLng, mode = 'car') {
  const params = new URLSearchParams({
    originLat: String(originLat),
    originLng: String(originLng),
    destLat: String(destLat),
    destLng: String(destLng),
    mode,
  });
  
  try {
    const res = await fetch(`${API_BASE}/routes?${params}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Batch Photo URLs ───
// For an activity, get real Google Place photo URLs
// Falls back to existing Unsplash images if API not configured
export async function getActivityPhotos(activityName, fallbackImages) {
  try {
    const details = await getPlaceDetails({ query: activityName });
    if (details?.photoRefs?.length > 0) {
      return details.photoRefs.map(ref => getPhotoUrl(ref));
    }
  } catch {
    // Fall through to fallback
  }
  return fallbackImages;
}

// ─── Geolocation ───
// Get user's current position from browser
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// ─── Reverse Geocode (via Places Text Search) ───
// Convert lat/lng to a readable address
export async function reverseGeocode(lat, lng) {
  try {
    const details = await getPlaceDetails({ query: `${lat},${lng}` });
    return details?.address || null;
  } catch {
    return null;
  }
}
