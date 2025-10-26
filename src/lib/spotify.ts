// lib/spotify.ts

// Spotify API configuration
const SPOTIFY_CONFIG = {
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
};

// Token management
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  duration_ms: number;
  external_urls: { spotify: string };
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

// Get access token using Client Credentials flow
async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!SPOTIFY_CONFIG.clientId || !SPOTIFY_CONFIG.clientSecret) {
    throw new Error('Spotify client ID and secret are required. Please check your environment variables.');
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Subtract 60 seconds for safety
    
    return accessToken;
  } catch (error) {
    console.error('Token fetch error:', error);
    throw new Error('Could not connect to Spotify API');
  }
}

// Generic Spotify API fetch
async function spotifyApiFetch(endpoint: string): Promise<any> {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Map Spotify track to ExplorerTrack
function mapSpotifyTrack(track: SpotifyTrack): ExplorerTrack {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    album: track.album?.name,
    coverArt: track.album?.images[2]?.url || track.album?.images[1]?.url || track.album?.images[0]?.url,
    previewUrl: track.preview_url || undefined,
    duration: track.duration_ms,
    externalUrl: track.external_urls.spotify,
  };
}

// API functions
export const spotifyApi = {
  // Get featured playlists (used as charts)
  async getFeaturedTracks(limit: number = 50): Promise<ExplorerTrack[]> {
    try {
      // First get a featured playlist
      const featuredData = await spotifyApiFetch('/browse/featured-playlists?limit=1');
      
      if (!featuredData.playlists.items.length) {
        throw new Error('No featured playlists available');
      }

      const playlistId = featuredData.playlists.items[0].id;
      const playlistTracks = await spotifyApiFetch(`/playlists/${playlistId}/tracks?limit=${limit}`);
      
      return playlistTracks.items
        .filter((item: any) => item.track && item.track.preview_url)
        .map((item: any) => mapSpotifyTrack(item.track));
    } catch (error) {
      console.error('Error fetching featured tracks:', error);
      throw error;
    }
  },

  // Get available genres
  async getGenres(): Promise<Genre[]> {
    try {
      const data = await spotifyApiFetch('/recommendations/available-genre-seeds');
      
      return data.genres.slice(0, 12).map((genreName: string, index: number) => ({
        id: genreName,
        name: genreName.charAt(0).toUpperCase() + genreName.slice(1),
        cover: `https://source.unsplash.com/random/300x300/?${genreName},music&${index}`,
      }));
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  // Get recommendations by genre
  async getGenreTracks(genreId: string, limit: number = 20): Promise<ExplorerTrack[]> {
    try {
      const data = await spotifyApiFetch(`/recommendations?seed_genres=${genreId}&limit=${limit}`);
      
      return data.tracks
        .filter((track: SpotifyTrack) => track.preview_url)
        .map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error fetching genre tracks:', error);
      throw error;
    }
  },

  // Search tracks
  async searchTracks(query: string, limit: number = 20): Promise<ExplorerTrack[]> {
    try {
      const data = await spotifyApiFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
      
      return data.tracks.items
        .filter((track: SpotifyTrack) => track.preview_url)
        .map(mapSpotifyTrack);
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  },

  // Get new releases
  async getNewReleases(limit: number = 20): Promise<ExplorerTrack[]> {
    try {
      const data = await spotifyApiFetch(`/browse/new-releases?limit=${limit}`);
      
      // For new releases, we need to get tracks for each album
      const albumPromises = data.albums.items.map(async (album: any) => {
        const albumTracks = await spotifyApiFetch(`/albums/${album.id}/tracks`);
        return albumTracks.items
          .filter((track: any) => track.preview_url)
          .map((track: any) => ({
            ...mapSpotifyTrack({
              ...track,
              album: {
                name: album.name,
                images: album.images,
              },
            }),
          }));
      });

      const allTracks = await Promise.all(albumPromises);
      return allTracks.flat().slice(0, limit);
    } catch (error) {
      console.error('Error fetching new releases:', error);
      throw error;
    }
  },
};

// Utility function to check if Spotify is configured
export function isSpotifyConfigured(): boolean {
  return !!(SPOTIFY_CONFIG.clientId && SPOTIFY_CONFIG.clientSecret);
}

// Utility function to get configuration status
export function getSpotifyConfigStatus(): { configured: boolean; missing: string[] } {
  const missing = [];
  if (!SPOTIFY_CONFIG.clientId) missing.push('VITE_SPOTIFY_CLIENT_ID');
  if (!SPOTIFY_CONFIG.clientSecret) missing.push('VITE_SPOTIFY_CLIENT_SECRET');
  
  return {
    configured: missing.length === 0,
    missing,
  };
}