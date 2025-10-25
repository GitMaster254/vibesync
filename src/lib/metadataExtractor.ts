import * as mm from 'music-metadata';

/**
 * Extracts metadata from an audio file in the browser
 * @param {File} file - The audio file to extract metadata from
 * @returns {Promise<object>} - Lightweight metadata object
 */
export async function extractMetadata(file: File) {
  try {
    // Convert file to ArrayBuffer for music-metadata
    const arrayBuffer = await file.arrayBuffer();
    
    // Parse metadata using music-metadata
    const meta = await mm.parseBuffer(new Uint8Array(arrayBuffer), {
      mimeType: file.type,
      size: file.size
    });

    const c = meta.common;
    const f = meta.format;

    // Handle embedded album art: convert to base64 data URL
    let coverUrl = null;
    if (c.picture && c.picture.length > 0) {
      const pic = c.picture[0];
      coverUrl = await getCoverArtDataUrl(pic);
    }

    // Build lightweight metadata object (similar to server version)
    const extracted = {
      title: c.title || file.name.replace(/\.[^/.]+$/, "") || "Untitled",
      artist: c.artist || "Unknown Artist",
      album: c.album || "Unknown Album",
      genre: Array.isArray(c.genre) ? c.genre[0] : c.genre || "Unknown",
      year: c.year || null,
      bitrate: f.bitrate ? Math.round(f.bitrate) : null,
      duration: f.duration ? Number(f.duration.toFixed(2)) : 0,
      codec: f.codec || "Unknown",
      sampleRate: f.sampleRate || null,
      channels: f.numberOfChannels || null,
      formatName: f.container || getFormatFromMimeType(file.type),
      size: file.size,
      coverUrl, // base64 data URL for embedded art
    };

    console.log('✅ Metadata extracted:', extracted.title);
    return extracted;
    
  } catch (error) {
    console.error("⚠️ Extraction error:", error);
    
    // Fallback to basic file info if extraction fails
    return getFallbackMetadata(file);
  }
}

/**
 * Convert embedded picture data to base64 data URL
 */
async function getCoverArtDataUrl(picture: any): Promise<string> {
  return new Promise((resolve) => {
    try {
      const base64String = arrayBufferToBase64(picture.data);
      const mimeType = picture.format || 'image/jpeg';
      resolve(`data:${mimeType};base64,${base64String}`);
    } catch (error) {
      console.error('Error processing cover art:', error);
      resolve(null);
    }
  });
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Get format name from MIME type
 */
function getFormatFromMimeType(mimeType: string): string {
  const formatMap: { [key: string]: string } = {
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
    'audio/mp4': 'MP4',
    'audio/m4a': 'MP4',
    'audio/aac': 'AAC',
    'audio/wav': 'WAV',
    'audio/wave': 'WAV',
    'audio/x-wav': 'WAV',
    'audio/flac': 'FLAC',
    'audio/ogg': 'OGG',
    'audio/webm': 'WebM',
  };
  
  return formatMap[mimeType] || mimeType.replace('audio/', '').toUpperCase();
}

/**
 * Fallback metadata when extraction fails
 */
function getFallbackMetadata(file: File): any {
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  
  return {
    title: fileNameWithoutExt || "Untitled",
    artist: "Unknown Artist",
    album: "Unknown Album",
    genre: "Unknown",
    year: null,
    bitrate: null,
    duration: 0, // Will be determined during playback
    codec: getFormatFromMimeType(file.type),
    sampleRate: null,
    channels: null,
    formatName: getFormatFromMimeType(file.type),
    size: file.size,
    coverUrl: null,
  };
}

/**
 * Extract duration using Web Audio API as fallback
 * Useful if music-metadata fails to get duration
 */
export async function extractDurationFallback(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      resolve(Number(audio.duration.toFixed(2)));
      URL.revokeObjectURL(audio.src);
    };
    
    audio.onerror = () => {
      resolve(0);
      URL.revokeObjectURL(audio.src);
    };
    
    // Timeout fallback
    setTimeout(() => {
      resolve(0);
      URL.revokeObjectURL(audio.src);
    }, 5000);
  });
}