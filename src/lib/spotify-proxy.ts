// jamendoProxy.ts
const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0/';
const CLIENT_ID = 'c760f716';

/**
 * Create a proxied stream URL that goes through the streaming proxy endpoint
 * This ensures proper headers and CORS handling for audio streaming
 */
function createStreamUrl(originalUrl: string, baseUrl?: string): string {
  // Use provided baseUrl or try to detect it from the current environment
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
  const proxyUrl = new URL('/api/spotify/stream', origin);
  proxyUrl.searchParams.set('url', originalUrl);
  return proxyUrl.toString();
}

export interface ExplorerTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverArt?: string;
  previewUrl?: string;
  duration?: number;
  externalUrl?: string;
}

export interface Genre {
  id: string;
  name: string;
  cover?: string;
}

async function jamendoFetch(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${JAMENDO_BASE_URL}${endpoint}`);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('format', 'json');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Jamendo API error: ${response.status} - ${text}`);
  }

  const json = await response.json();
  return json;
}

function transformSpotifyTrack(track: any): ExplorerTrack {
  if (!track || typeof track !== 'object') {
    console.error('Invalid track data:', track);
    throw new Error('Invalid track data received from Spotify');
  }

  // Validate required fields
  if (!track.id || !track.name) {
    console.error('Missing required fields in track:', track);
    throw new Error('Missing required track information');
  }

  // Get the best available image
  const coverArt = track.album?.images?.[0]?.url || 
                  track.images?.[0]?.url ||
                  undefined;

  // Get preview URL and create proxied URL if available
  const previewUrl = track.preview_url;
  const streamUrl = previewUrl ? createStreamUrl(previewUrl) : undefined;

  // Log preview URL status for debugging
  if (!previewUrl) {
    console.log(`No preview URL available for track: ${track.name}`);
  }

  const transformedTrack = {
    id: track.id,
    title: track.name,
    artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: track.album?.name,
    coverArt,
    previewUrl: streamUrl, // Use the proxied URL
    duration: track.duration_ms,
    externalUrl: track.external_urls?.spotify,
  };

  // Log transformed track for debugging
  console.log('Transformed track:', transformedTrack);
  
  return transformedTrack;
}

export const spotifyProxy = {
  async getFeaturedTracks(limit: number = 50): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
      limit: limit.toString(),
      order: 'popularity_total',
      include: 'musicinfo',
      // Prioritize African content in featured tracks
      geotags: 'africa,kenya,nigeria,south africa,ghana,uganda,tanzania',
    });

    const results = data.results ?? [];
    return results.map((track: any) => ({
      id: String(track.id),
      title: track.name,
      artist: track.artist_name,
      album: track.album_name,
      coverArt: track.image || track.album_image || undefined,
      previewUrl: track.audiodownload_allowed ? track.audiodownload : track.audio,
      duration: track.duration,
      externalUrl: track.shareurl || track.url,
    }));
  },

  async getGenres(): Promise<Genre[]> {
    return [
      // Kenyan Music Genres
      { id: 'benga', name: 'Benga' },
      { id: 'gengetone', name: 'Gengetone' },
      { id: 'afro-pop', name: 'Afro-Pop' },
      { id: 'afro-fusion', name: 'Afro-Fusion' },
      { id: 'gospel', name: 'Gospel' },
      { id: 'taarab', name: 'Taarab' },
      { id: 'genge', name: 'Genge' },
      { id: 'kapuka', name: 'Kapuka' },
      { id: 'mugithi', name: 'Mugithi' },
      { id: 'ohangla', name: 'Ohangla' },
      { id: 'reggae', name: 'Reggae' },
      { id: 'amapiano', name: 'Amapiano' },
      { id: 'drill', name: 'Drill' },
      { id: 'electronic', name: 'Electronic' },

      // Popular Global Genres with Kenyan Influence
      { id: 'hiphop', name: 'Hip Hop' },
      { id: 'rap', name: 'Rap' },
      { id: 'pop', name: 'Pop' },
      { id: 'rnb', name: 'R&B' },
      { id: 'afrobeat', name: 'Afrobeat' },
      { id: 'highlife', name: 'Highlife' },
      { id: 'jazz', name: 'Jazz' },
      { id: 'soul', name: 'Soul' },
      { id: 'rock', name: 'Rock' },
      { id: 'folk', name: 'Folk' },
    ];
  },

  async getGenreTracks(genreId: string, limit: number = 20): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
      tags: genreId,
      limit: limit.toString(),
      order: 'popularity_total',
      include: 'musicinfo',
      // Prioritize African/Kenyan content for local relevance
      geotags: 'africa,kenya,nigeria,south africa,ghana,uganda,tanzania',
    });

    const results = data.results ?? [];
    return results.map((track: any) => ({
      id: String(track.id),
      title: track.name,
      artist: track.artist_name,
      album: track.album_name,
      coverArt: track.image || track.album_image,
      previewUrl: track.audiodownload_allowed ? track.audiodownload : track.audio,
      duration: track.duration,
      externalUrl: track.shareurl,
    }));
  },

  async searchTracks(query: string, limit: number = 50): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
      search: query,
      limit: limit.toString(),
      include: 'musicinfo',
      // Add location-based search for African content
      geotags: 'africa,kenya,nigeria,south africa,ghana,uganda,tanzania',
    });

    const results = data.results ?? [];
    return results.map((track: any) => ({
      id: String(track.id),
      title: track.name,
      artist: track.artist_name,
      album: track.album_name,
      coverArt: track.image || track.album_image,
      previewUrl: track.audiodownload_allowed ? track.audiodownload : track.audio,
      duration: track.duration,
      externalUrl: track.shareurl,
    }));
  },

  async getNewReleases(limit: number = 20): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
      limit: limit.toString(),
      order: 'releasedate_desc',
      include: 'musicinfo',
    });

    const results = data.results ?? [];
    return results.map((track: any) => ({
      id: String(track.id),
      title: track.name,
      artist: track.artist_name,
      album: track.album_name,
      coverArt: track.image || track.album_image,
      previewUrl: track.audiodownload_allowed ? track.audiodownload : track.audio,
      duration: track.duration,
      externalUrl: track.shareurl,
    }));
  },

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      await jamendoFetch('tracks', { limit: '1' });
      return { status: 'ok', message: 'Jamendo API is accessible' };
    } catch (err: any) {
      return { status: 'error', message: `Jamendo API error: ${err.message ?? err}` };
    }
  },
};

export function isProxyConfigured(): boolean {
  return Boolean(CLIENT_ID);
}