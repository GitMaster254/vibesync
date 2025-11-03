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

export const spotifyProxy = {
  async getFeaturedTracks(limit: number = 50): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
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

  async searchTracks(query: string, limit: number = 20): Promise<ExplorerTrack[]> {
    const data = await jamendoFetch('tracks', {
      search: query,
      limit: limit.toString(),
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