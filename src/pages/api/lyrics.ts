import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuration
const CACHE_TTL = parseInt(process.env.LYRICS_CACHE_TTL || '300000'); // 5 minutes default
const UPSTREAM_TIMEOUT = parseInt(process.env.LYRICS_UPSTREAM_TIMEOUT || '3000'); // 3s default
const RATE_LIMIT_WINDOW = parseInt(process.env.LYRICS_RATE_LIMIT_WINDOW || '60000'); // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.LYRICS_RATE_LIMIT_MAX || '10'); // 10 requests per window
const ALLOW_SCRAPING = process.env.LYRICS_ALLOW_SCRAPING === 'true'; // false by default
const LOGGING_ENABLED = process.env.LYRICS_LOGGING_ENABLED !== 'false'; // true by default

// API Keys
const API_NINJAS_KEY = process.env.API_NINJAS_KEY || 'T5EfLUpjJsIQPTjmYyYyMQ==R0GQHeQ7wuzWHlrv';

// In-memory cache with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// Rate limiting: simple in-memory store (not suitable for multi-instance, but ok for Vercel)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Metrics
const metrics = {
  requests_total: 0,
  cache_hits: 0,
  cache_misses: 0,
  upstream_failures_by_source: {} as Record<string, number>
};

interface LyricsResult {
  found: boolean;
  lyrics: string;
  message: string;
  source: string;
  cached: boolean;
  durationMs: number;
  errors: Array<{ source: string; status?: number; message: string }>;
}

interface SourceResult {
  found: boolean;
  lyrics: string;
  message: string;
  source: string;
}

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

async function fetchFromLyricsOvh(artist: string, title: string): Promise<SourceResult> {
  const encodedArtist = encodeURIComponent(artist.trim());
  const encodedTitle = encodeURIComponent(title.trim());
  const url = `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

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
        if (LOGGING_ENABLED) console.warn('lyrics.ovh returned non-JSON response:', parseError);
        return {
          found: false,
          lyrics: '',
          message: 'Lyrics not found',
          source: 'lyrics.ovh'
        };
      }
      return {
        found: true,
        lyrics: data.lyrics || '',
        message: 'Lyrics found',
        source: 'lyrics.ovh'
      };
    } else if (response.status === 404) {
      return {
        found: false,
        lyrics: '',
        message: 'Lyrics not found',
        source: 'lyrics.ovh'
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout');
    }
    throw error;
  }
}

async function fetchFromApiNinjas(artist: string, title: string): Promise<SourceResult> {
  const encodedArtist = encodeURIComponent(artist.trim());
  const encodedTitle = encodeURIComponent(title.trim());
  const url = `https://api.api-ninjas.com/v1/lyrics?artist=${encodedArtist}&title=${encodedTitle}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'X-Api-Key': API_NINJAS_KEY,
        'User-Agent': 'VibeSync/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      const data = await response.json();
      return {
        found: true,
        lyrics: data[0]?.lyrics || '',
        message: 'Lyrics found',
        source: 'api-ninjas'
      };
    } else if (response.status === 404) {
      return {
        found: false,
        lyrics: '',
        message: 'Lyrics not found',
        source: 'api-ninjas'
      };
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout');
    }
    throw error;
  }
}

async function fetchFromGenius(artist: string, title: string): Promise<SourceResult> {
  // Placeholder for Genius scraper - implement as needed
  // This is unofficial and should be opt-in
  if (!ALLOW_SCRAPING) {
    return {
      found: false,
      lyrics: '',
      message: 'Scraping disabled',
      source: 'genius'
    };
  }

  // Implement Genius scraping logic here
  // For now, return not found
  return {
    found: false,
    lyrics: '',
    message: 'Lyrics not found',
    source: 'genius'
  };
}

export async function fetchLyrics(artist: string, title: string): Promise<LyricsResult> {
  const startTime = Date.now();
  const errors: Array<{ source: string; status?: number; message: string }> = [];

  // Define sources in priority order
  const sources = [
    { name: 'lyrics.ovh', fetcher: fetchFromLyricsOvh },
    { name: 'api-ninjas', fetcher: fetchFromApiNinjas },
    ...(ALLOW_SCRAPING ? [{ name: 'genius', fetcher: fetchFromGenius }] : [])
  ];

  for (const { name, fetcher } of sources) {
    try {
      if (LOGGING_ENABLED) console.log(`Trying source: ${name} for ${artist} - ${title}`);
      const result = await fetcher(artist, title);
      if (result.found) {
        const durationMs = Date.now() - startTime;
        return {
          ...result,
          cached: false,
          durationMs,
          errors
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      errors.push({ source: name, message: errorMessage });
      metrics.upstream_failures_by_source[name] = (metrics.upstream_failures_by_source[name] || 0) + 1;
      if (LOGGING_ENABLED) console.warn(`Source ${name} failed: ${errorMessage}`);
    }
  }

  // All sources failed
  const durationMs = Date.now() - startTime;
  return {
    found: false,
    lyrics: '',
    message: `LYRICS NOT FOUND 🔜\nYou can still search "${title}" by ${artist} for this song's lyrics online.`,
    source: '',
    cached: false,
    durationMs,
    errors
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  metrics.requests_total++;

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
    if (LOGGING_ENABLED) console.log(`Rate limit exceeded for IP: ${clientIP}, artist: ${artist}, title: ${title}`);
    return res.status(429).json({
      found: false,
      lyrics: '',
      message: 'Rate limit exceeded. Please try again later.',
      source: '',
      cached: false,
      durationMs: Date.now() - startTime,
      errors: []
    });
  }

  const cacheKey = getCacheKey(artist, title);
  const now = Date.now();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    metrics.cache_hits++;
    if (LOGGING_ENABLED) console.log(`Cache hit for ${cacheKey}`);
    return res.status(200).json({ ...cached.data, cached: true, durationMs: Date.now() - startTime });
  }

  metrics.cache_misses++;

  try {
    if (LOGGING_ENABLED) console.log(`Fetching lyrics for artist: ${artist}, title: ${title}, IP: ${clientIP}`);
    const result = await fetchLyrics(artist, title);

    // Cache the result (even failures to avoid repeated failures)
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
    if (LOGGING_ENABLED) console.error(`Unexpected error fetching lyrics for ${artist} - ${title}:`, error.message);

    // Return error response
    return res.status(502).json({
      found: false,
      lyrics: '',
      message: 'Temporary error fetching lyrics. Please try again.',
      source: '',
      cached: false,
      durationMs: Date.now() - startTime,
      errors: [{ source: 'internal', message: 'Internal server error' }]
    });
  }
}