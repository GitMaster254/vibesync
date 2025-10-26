// lib/spotify-proxy.ts

const PROXY_BASE_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001';

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

async function proxyFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${PROXY_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Proxy API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

export const spotifyProxy = {
  // Get featured tracks
  async getFeaturedTracks(limit: number = 50): Promise<ExplorerTrack[]> {
    return proxyFetch(`/api/featured-tracks?limit=${limit}`);
  },

  // Get available genres
  async getGenres(): Promise<Genre[]> {
    return proxyFetch('/api/genres');
  },

  // Get recommendations by genre
  async getGenreTracks(genreId: string, limit: number = 20): Promise<ExplorerTrack[]> {
    return proxyFetch(`/api/genre-tracks?genre=${genreId}&limit=${limit}`);
  },

  // Search tracks
  async searchTracks(query: string, limit: number = 20): Promise<ExplorerTrack[]> {
    return proxyFetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Get new releases
  async getNewReleases(limit: number = 20): Promise<any[]> {
    return proxyFetch(`/api/new-releases?limit=${limit}`);
  },

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return proxyFetch('/health');
  }
};

// Utility function to check if proxy is configured
export function isProxyConfigured(): boolean {
  return !!PROXY_BASE_URL;
}