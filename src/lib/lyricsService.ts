/**
 * Cleans song titles and artist names to improve API search accuracy
 */
const normalizeMetadata = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/\(Official\s*(Video|Audio|Lyrics)?\)/gi, '') // Remove (Official Video), (Official Audio)
    .replace(/\[(Lyrics|HD|4K|1080p|720p)\]/gi, '')         // Remove [Lyrics], [HD]
    .replace(/feat\.\s*.+/gi, '')       // Remove featured artists from title
    .replace(/\.(mp3|wav|flac|m4a)/gi, '') // Remove file extensions
    .trim();
};

interface LyricsResult {
  id?: number;
  name?: string;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export const fetchLyrics = async (
  artist: string, 
  title: string
): Promise<LyricsResult | null> => {
  const cleanArtist = normalizeMetadata(artist || "Unknown");
  const cleanTitle = normalizeMetadata(title);

  try {
    // Attempt 1: Get exact match (best for synced/LRC lyrics)
    const response = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`
    );

    if (response.ok) {  
      return await response.json();  
    }  

    // Attempt 2: If exact match fails, use search endpoint for fuzzy matching  
    const searchResponse = await fetch(  
      `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`  
    );  
    
    const results = await searchResponse.json() as LyricsResult[];  
    if (results && results.length > 0) {  
      return results[0]; // Return most relevant candidate  
    }  

    return null;

  } catch (error) {
    console.error("Lyrics Service Error:", error);
    return null;
  }
};