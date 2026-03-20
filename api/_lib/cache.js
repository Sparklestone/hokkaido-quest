// Shared cache utility for Vercel serverless functions
// Uses Upstash Redis for caching Google API responses

let redis = null;

async function getRedis() {
  if (redis) return redis;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Upstash Redis not configured — caching disabled');
    return null;
  }
  
  // Use fetch-based REST client (works in all Vercel runtimes)
  redis = {
    async get(key) {
      const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.result ? JSON.parse(data.result) : null;
    },
    async set(key, value, ttl = 86400) {
      await fetch(`${url}/set/${encodeURIComponent(key)}/ex/${ttl}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(JSON.stringify(value))
      });
    }
  };
  
  return redis;
}

export async function getCached(key, fetchFn, ttlSeconds = 86400) {
  const r = await getRedis();
  
  if (r) {
    try {
      const cached = await r.get(key);
      if (cached) return { data: cached, fromCache: true };
    } catch (e) {
      console.warn('Cache read failed:', e.message);
    }
  }
  
  const fresh = await fetchFn();
  
  if (r && fresh) {
    try {
      await r.set(key, fresh, ttlSeconds);
    } catch (e) {
      console.warn('Cache write failed:', e.message);
    }
  }
  
  return { data: fresh, fromCache: false };
}
