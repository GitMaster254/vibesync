// jamendoProxy.ts
const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0/';
const CLIENT_ID = 'c760f716';

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
  async getFeaturedTracks(limit: number = 100): Promise<ExplorerTrack[]> {
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
      { id: 'rock', name: 'Rock' },
      { id: 'electronic', name: 'Electronic' },
      { id: 'pop', name: 'Pop' },
      { id: 'hiphop', name: 'Hip Hop' },
      { id: 'jazz', name: 'Jazz' },
      { id: 'classical', name: 'Classical' },
      { id: 'folk', name: 'Folk' },
      { id: 'reggae', name: 'Reggae' },
      { id: 'blues', name: 'Blues' },
      { id: 'country', name: 'Country' },
      { id: 'afrobeat', name: 'Afrobeat' },
      { id: 'highlife', name: 'Highlife' },
      { id: 'kwaito', name: 'Kwaito' },
      { id: 'african', name: 'African' },
      { id: 'world', name: 'World Music' },
      { id: 'traditional', name: 'Traditional' },
      { id: 'metal', name: 'Metal' },
      { id: 'punk', name: 'Punk' },
      { id: 'indie', name: 'Indie' },
      { id: 'alternative', name: 'Alternative' },
      { id: 'techno', name: 'Techno' },
      { id: 'house', name: 'House' },
      { id: 'ambient', name: 'Ambient' },
      { id: 'soul', name: 'Soul' },
      { id: 'funk', name: 'Funk' },
      { id: 'disco', name: 'Disco' },
      { id: 'latin', name: 'Latin' },
      { id: 'rnb', name: 'R&B' },
      { id: 'gospel', name: 'Gospel' },
      { id: 'instrumental', name: 'Instrumental' },
      { id: 'soundtrack', name: 'Soundtrack' },
    ];
  },


  async getGenreTracks(genreId: string, limit: number = 50): Promise<ExplorerTrack[]> {
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
