// lib/audiomack-proxy.ts

const AUDIOMACK_BASE_URL = 'https://api.audiomack.com/v1';

export interface AudiomackTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverArt?: string;
  streamUrl?: string;
  duration?: number;
  externalUrl?: string;
  genre?: string;
}

export interface AudiomackGenre {
  id: string;
  name: string;
  cover?: string;
}

async function audiomackFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${AUDIOMACK_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Audiomack API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const audiomackProxy = {
  // Search tracks
  async searchTracks(query: string, limit: number = 20): Promise<AudiomackTrack[]> {
    const data = await audiomackFetch(`/search?q=${encodeURIComponent(query)}&type=tracks&limit=${limit}`);
    return data.results?.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      coverArt: item.image,
      streamUrl: item.stream_url,
      duration: item.duration,
      externalUrl: item.url,
      genre: item.genre,
    })) || [];
  },

  // Get featured/popular tracks
  async getFeaturedTracks(limit: number = 50): Promise<AudiomackTrack[]> {
    const data = await audiomackFetch(`/music/charts?type=tracks&limit=${limit}`);
    return data.data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      coverArt: item.image,
      streamUrl: item.stream_url,
      duration: item.duration,
      externalUrl: item.url,
      genre: item.genre,
    })) || [];
  },

  // Get genres
  async getGenres(): Promise<AudiomackGenre[]> {
    const data = await audiomackFetch('/music/genres');
    return data.data?.map((item: any) => ({
      id: item.slug,
      name: item.name,
      cover: item.image,
    })) || [];
  },

  // Get tracks by genre
  async getGenreTracks(genreId: string, limit: number = 20): Promise<AudiomackTrack[]> {
    const data = await audiomackFetch(`/music/genre/${genreId}?limit=${limit}`);
    return data.data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      coverArt: item.image,
      streamUrl: item.stream_url,
      duration: item.duration,
      externalUrl: item.url,
      genre: item.genre,
    })) || [];
  },

  // Get new releases
  async getNewReleases(limit: number = 20): Promise<AudiomackTrack[]> {
    const data = await audiomackFetch(`/music/new-releases?limit=${limit}`);
    return data.data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      coverArt: item.image,
      streamUrl: item.stream_url,
      duration: item.duration,
      externalUrl: item.url,
      genre: item.genre,
    })) || [];
  },
};

// Utility function to check if API is available
export function isAudiomackConfigured(): boolean {
  return true; // Always available as it's public
}
