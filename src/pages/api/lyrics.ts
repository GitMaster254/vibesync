import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = parseInt(process.env.LYRICS_CACHE_TTL || '300000'); // 5 minutes default

// Rate limiting: simple in-memory store (not suitable for multi-instance, but ok for Vercel)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = parseInt(process.env.LYRICS_RATE_LIMIT_WINDOW || '60000'); // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.LYRICS_RATE_LIMIT_MAX || '10'); // 10 requests per window

function getCacheKey(artist: string, title: string): string {
  return `${artist.trim().toLowerCase()}||${title.trim().toLowerCase()}`;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

async function fetchLyrics(artist: string, title: string) {
  const encodedArtist = encodeURIComponent(artist.trim());
  const encodedTitle = encodeURIComponent(title.trim());
  const url = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), parseInt(process.env.LYRICS_UPSTREAM_TIMEOUT || '10000')); // 10s timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VibeSync/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If not JSON, treat as not found
        console.warn('Upstream returned non-JSON response:', parseError);
        return {
          found: false,
          lyrics: '',
          message: 'Lyrics not found',
          source: 'lyrics.ovh',
          cached: false
        };
      }
      return {
        found: true,
        lyrics: data.lyrics || '',
        message: 'Lyrics found',
        source: 'lyrics.ovh',
        cached: false
      };
    } else if (response.status === 404) {
      return {
        found: false,
        lyrics: '',
        message: 'Lyrics not found',
        source: 'lyrics.ovh',
        cached: false
      };
    } else {
      throw new Error(`Upstream error: ${response.status}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Upstream timeout');
    }
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist, title } = req.query;

  if (!artist || !title || typeof artist !== 'string' || typeof title !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid artist/title parameters' });
  }

  const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                   (req.headers['x-real-ip'] as string) ||
                   req.connection?.remoteAddress ||
                   'unknown';

  // Check rate limit
  if (isRateLimited(clientIP)) {
    console.log(`Rate limit exceeded for IP: ${clientIP}, artist: ${artist}, title: ${title}`);
    return res.status(429).json({
      found: false,
      lyrics: '',
      message: 'Rate limit exceeded. Please try again later.',
      source: 'lyrics.ovh',
      cached: false
    });
  }

  const cacheKey = getCacheKey(artist, title);
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`Cache hit for ${cacheKey}`);
    return res.status(200).json({ ...cached.data, cached: true });
  }

  try {
    console.log(`Fetching lyrics for artist: ${artist}, title: ${title}, IP: ${clientIP}`);
    const result = await fetchLyrics(artist, title);

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: now });

    // Clean up old cache entries periodically (simple cleanup)
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
          cache.delete(key);
        }
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`Error fetching lyrics for ${artist} - ${title}:`, error.message);

    // Return error response
    return res.status(502).json({
      found: false,
      lyrics: '',
      message: 'Temporary error fetching lyrics. Please try again.',
      source: 'lyrics.ovh',
      cached: false
    });
  }
}