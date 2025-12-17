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
      // Rock & Alternative
      { id: 'rock', name: 'Rock' },
      { id: 'alternative', name: 'Alternative Rock' },
      { id: 'indie', name: 'Indie Rock' },
      { id: 'hardrock', name: 'Hard Rock' },
      { id: 'metal', name: 'Metal' },
      { id: 'punk', name: 'Punk' },
      { id: 'grunge', name: 'Grunge' },
      
      // Pop & Mainstream
      { id: 'pop', name: 'Pop' },
      { id: 'dancepop', name: 'Dance Pop' },
      { id: 'electropop', name: 'Electropop' },
      { id: 'indiepop', name: 'Indie Pop' },
      { id: 'synthpop', name: 'Synth Pop' },
      
      // Electronic & Dance
      { id: 'electronic', name: 'Electronic' },
      { id: 'house', name: 'House' },
      { id: 'techno', name: 'Techno' },
      { id: 'trance', name: 'Trance' },
      { id: 'drumandbass', name: 'Drum & Bass' },
      { id: 'dubstep', name: 'Dubstep' },
      { id: 'edm', name: 'EDM' },
      { id: 'ambient', name: 'Ambient' },
      
      // Hip Hop & Rap
      { id: 'hiphop', name: 'Hip Hop' },
      { id: 'rap', name: 'Rap' },
      { id: 'trap', name: 'Trap' },
      { id: 'rnb', name: 'R&B' },
      { id: 'soul', name: 'Soul' },
      { id: 'funk', name: 'Funk' },
      
      // Jazz & Blues
      { id: 'jazz', name: 'Jazz' },
      { id: 'blues', name: 'Blues' },
      { id: 'swing', name: 'Swing' },
      { id: 'bebop', name: 'Bebop' },
      { id: 'fusion', name: 'Jazz Fusion' },
      
      // Gospel & Christian
      { id: 'gospel', name: 'Gospel' },
      { id: 'christian', name: 'Christian Contemporary' },
      { id: 'spirituals', name: 'Spirituals' },
      { id: 'ccm', name: 'Contemporary Christian' },
      { id: 'worship', name: 'Worship' },
      
      // Country & Folk
      { id: 'country', name: 'Country' },
      { id: 'folk', name: 'Folk' },
      { id: 'bluegrass', name: 'Bluegrass' },
      { id: 'americana', name: 'Americana' },
      
      // Classical & Orchestral
      { id: 'classical', name: 'Classical' },
      { id: 'orchestral', name: 'Orchestral' },
      { id: 'baroque', name: 'Baroque' },
      { id: 'romantic', name: 'Romantic' },
      { id: 'chamber', name: 'Chamber Music' },
      
      // Reggae & Caribbean
      { id: 'reggae', name: 'Reggae' },
      { id: 'dancehall', name: 'Dancehall' },
      { id: 'ska', name: 'Ska' },
      { id: 'calypso', name: 'Calypso' },
      
      // World & International
      { id: 'world', name: 'World Music' },
      { id: 'latin', name: 'Latin' },
      { id: 'salsa', name: 'Salsa' },
      { id: 'bossa nova', name: 'Bossa Nova' },
      { id: 'tango', name: 'Tango' },
      
      // African Music
      { id: 'afrobeat', name: 'Afrobeat' },
      { id: 'highlife', name: 'Highlife' },
      { id: 'kwaito', name: 'Kwaito' },
      { id: 'african', name: 'African' },
      { id: 'african-pop', name: 'African Pop' },
      { id: 'traditional', name: 'Traditional' },
      { id: 'makossa', name: 'Makossa' },
      { id: 'benga', name: 'Benga' },
      { id: 'souksous', name: 'Soukous' },
      
      // R&B & Soul
      { id: 'motown', name: 'Motown' },
      { id: 'disco', name: 'Disco' },
      { id: 'funk', name: 'Funk' },
      { id: 'neo-soul', name: 'Neo-Soul' },
      
      // Alternative & Indie
      { id: 'post-rock', name: 'Post-Rock' },
      { id: 'post-punk', name: 'Post-Punk' },
      { id: 'shoegaze', name: 'Shoegaze' },
      { id: 'dream-pop', name: 'Dream Pop' },
      
      // Rock Subgenres
      { id: 'progressive', name: 'Progressive Rock' },
      { id: 'psychedelic', name: 'Psychedelic Rock' },
      { id: 'garage', name: 'Garage Rock' },
      { id: 'surf', name: 'Surf Rock' },
      
      // Pop Subgenres
      { id: 'britpop', name: 'Britpop' },
      { id: 'europop', name: 'Europop' },
      { id: 'kpop', name: 'K-Pop' },
      { id: 'jpop', name: 'J-Pop' },
      
      // Experimental & Other
      { id: 'experimental', name: 'Experimental' },
      { id: 'avant-garde', name: 'Avant-Garde' },
      { id: 'noise', name: 'Noise' },
      { id: 'industrial', name: 'Industrial' },
    ];
  },

  async getGenreTracks(genreId: string, limit: number = 20): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
      tags: genreId,
      limit: limit.toString(),
      order: 'popularity_total',
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