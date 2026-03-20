// /api/places-photo.js
// Proxies Google Places Photos API
// Returns the actual image binary so the API key stays server-side
// Usage: <img src="/api/places-photo?ref=PHOTO_REF&w=600" />

export default async function handler(req, res) {
  const { ref, w = '600', h = '400' } = req.query;
  
  if (!ref) return res.status(400).json({ error: 'Photo ref required' });
  
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: 'Google API key not configured' });
  
  try {
    // Places API (New) photo endpoint
    const response = await fetch(
      `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${w}&maxHeightPx=${h}&key=${key}`,
      { redirect: 'follow' }
    );
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Photo fetch failed' });
    }
    
    const buffer = await response.arrayBuffer();
    
    // Cache aggressively - photos don't change
    res.setHeader('Cache-Control', 'public, max-age=2592000, s-maxage=2592000, immutable');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Content-Length', buffer.byteLength);
    
    return res.send(Buffer.from(buffer));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
