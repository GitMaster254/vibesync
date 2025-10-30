// lib/spotify-proxy.ts

const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';
const CLIENT_ID = 'f56b90da992b4eed9bd1f2c9005e5f09';
const CLIENT_SECRET = '5d135babbd104a028fc9e884683f6ba2';

// Create a proxy URL for streaming
function createStreamUrl(previewUrl: string) {
  // For development, you might want to use a local proxy
  // return `http://localhost:3001/proxy/stream?url=${encodeURIComponent(previewUrl)}`;
  
  // For production, we'll use a Vercel Edge Function or similar
  return `/api/spotify/stream?url=${encodeURIComponent(previewUrl)}`;
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

interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let accessToken: string | null = null;
let tokenExpirationTime: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return accessToken;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data: SpotifyAuthResponse = await response.json();
  accessToken = data.access_token;
  tokenExpirationTime = Date.now() + (data.expires_in * 1000) - 60000; // Expire 1 minute early
  return accessToken;
}

async function spotifyFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const response = await fetch(`${SPOTIFY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify API error: ${response.status} - ${error}`);
  }

  return response.json();
}

function transformSpotifyTrack(track: any): ExplorerTrack {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(', '),
    album: track.album?.name,
    coverArt: track.album?.images[0]?.url,
    previewUrl: track.preview_url,
    duration: track.duration_ms,
    externalUrl: track.external_urls?.spotify,
  };
}

export const spotifyProxy = {
  // Get featured tracks
  async getFeaturedTracks(limit: number = 50): Promise<ExplorerTrack[]> {
    const response = await spotifyFetch(`/browse/featured-playlists?limit=${limit}`);
    const playlistId = response.playlists.items[0]?.id;
    if (!playlistId) return [];
    
    const tracks = await spotifyFetch(`/playlists/${playlistId}/tracks?limit=${limit}`);
    return tracks.items
      .map((item: any) => item.track)
      .filter((track: any) => track != null)
      .map(transformSpotifyTrack);
  },

  // Get available genres
  async getGenres(): Promise<Genre[]> {
    const response = await spotifyFetch('/recommendations/available-genre-seeds');
    return response.genres.map((name: string) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }));
  },

  // Get recommendations by genre
  async getGenreTracks(genreId: string, limit: number = 20): Promise<ExplorerTrack[]> {
    const response = await spotifyFetch(
      `/recommendations?seed_genres=${genreId}&limit=${limit}`
    );
    return response.tracks.map(transformSpotifyTrack);
  },

  // Search tracks
  async searchTracks(query: string, limit: number = 20): Promise<ExplorerTrack[]> {
    if (!query.trim()) return [];
    
    const response = await spotifyFetch(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
    );
    return response.tracks.items.map(transformSpotifyTrack);
  },

  // Get new releases
  async getNewReleases(limit: number = 20): Promise<ExplorerTrack[]> {
    const response = await spotifyFetch(`/browse/new-releases?limit=${limit}`);
    const albumTracks = await Promise.all(
      response.albums.items.map((album: any) => 
        spotifyFetch(`/albums/${album.id}/tracks?limit=1`)
      )
    );
    
    return albumTracks
      .map((trackResponse: any, index: number) => ({
        ...trackResponse.items[0],
        album: response.albums.items[index]
      }))
      .map(transformSpotifyTrack);
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      await getAccessToken();
      return { status: 'ok', message: 'Spotify API is accessible' };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

// Utility function to check if credentials are configured
export function isSpotifyConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}