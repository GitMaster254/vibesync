import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { updateSettings, updateTrack } from '@/lib/db';

// Global audio instance (singleton)
let globalAudioInstance: HTMLAudioElement | null = null;
let globalObjectUrl: string | null = null;

// Global Web Audio API singletons for visualization
let globalAudioContext: AudioContext | null = null;
let globalMediaSource: MediaElementAudioSourceNode | null = null;
let globalAnalyser: AnalyserNode | null = null;

/**
 * Get or create the global audio instance
 */
function getAudioInstance(): HTMLAudioElement {
  if (!globalAudioInstance) {
    globalAudioInstance = new Audio();
    globalAudioInstance.preload = 'metadata';
  }
  return globalAudioInstance;
}

/**
 * Return the singleton HTMLAudioElement used by the app.
 * Read-only accessor for visualization and diagnostics.
 */
export function getAudioElement(): HTMLAudioElement {
  return getAudioInstance();
}

/**
 * Get or create the global AudioContext and AnalyserNode.
 * This prevents the "already connected" error by ensuring only one MediaElementSourceNode exists.
 */
export function getAudioAnalyser(fftSize: number = 256, smoothing: number = 0.8): {
  context: AudioContext;
  analyser: AnalyserNode;
} {
  if (!globalAudioContext || !globalMediaSource || !globalAnalyser) {
    const audio = getAudioInstance();
    const globalWin = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const CtxCtor: typeof AudioContext | undefined = globalWin.AudioContext || globalWin.webkitAudioContext;
    
    if (!CtxCtor) {
      throw new Error('Web Audio API not supported');
    }

    globalAudioContext = new CtxCtor();
    globalAnalyser = globalAudioContext.createAnalyser();
    globalAnalyser.fftSize = fftSize;
    globalAnalyser.smoothingTimeConstant = smoothing;

    // Create the MediaElementSource only once
    globalMediaSource = globalAudioContext.createMediaElementSource(audio);
    globalMediaSource.connect(globalAnalyser);
    globalAnalyser.connect(globalAudioContext.destination);
  } else {
    // Update analyser settings if they changed
    globalAnalyser.fftSize = fftSize;
    globalAnalyser.smoothingTimeConstant = smoothing;
  }

  return {
    context: globalAudioContext,
    analyser: globalAnalyser,
  };
}

/**
 * Seek to a specific time in the current track
 */
export function seekToTime(time: number) {
  const audio = getAudioInstance();
  audio.currentTime = time;
  usePlayerStore.getState().setCurrentTime(time);
}

/**
 * Custom hook for managing HTML5 Audio playback
 * Syncs with global player state
 * IMPORTANT: Should only be called once at app root level
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    setDuration,
    setCurrentTime,
    setIsPlaying,
    nextTrack,
  } = usePlayerStore();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = getAudioInstance();
      globalObjectUrl = null;
      objectUrlRef.current = null;
    }

    const audio = audioRef.current;

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      // Update play stats when a track finishes
      const { currentTrack: ct } = usePlayerStore.getState();
      if (ct) {
        const updated: import('@/lib/db').Track = {
          ...ct,
          playCount: (ct.playCount ?? 0) + 1,
          lastPlayed: Date.now(),
        };
        try {
          usePlayerStore.getState().setCurrentTrack(updated);
        } catch (e) {
          console.warn('Failed to update player state with stats', e);
        }
        // Use static import instead of dynamic
        updateTrack(updated).catch(e => {
          console.warn('Failed to persist play stats', e);
        });
      }

      // If karaoke mode is active, pause instead of auto-advance
      try {
        const karaokeActive = localStorage.getItem('vibesync-karaoke-active') === 'true';
        if (karaokeActive) {
          setIsPlaying(false);
          return;
        }
      } catch (e) {
        // ignore storage errors
      }

      nextTrack();
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
  audio.addEventListener('error', handleError as EventListener);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
  audio.removeEventListener('error', handleError as EventListener);
    };
  }, [nextTrack, setDuration, setCurrentTime, setIsPlaying]);

  // Handle track changes
useEffect(() => {
  if (!audioRef.current || !currentTrack) return;

  const audio = audioRef.current;
  let newSrc: string | null = null;

  // Determine new source
  if (currentTrack.blob instanceof Blob) {
    newSrc = URL.createObjectURL(currentTrack.blob);
  } else if (currentTrack.fileUrl) {
    newSrc = currentTrack.fileUrl;
  } else {
    console.warn('No valid source found for current track');
    setIsPlaying(false);
    return;
  }

  // Only update src if it has changed
  if (newSrc !== audio.src) {
    // Revoke previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    audio.src = newSrc;
    objectUrlRef.current = newSrc;

    // Preserve currentTime if same track (optional, based on track ID)
    const currentTime = usePlayerStore.getState().currentTime || 0;
    audio.currentTime = currentTime;

    try {
      audio.load();
    } catch (e) {
      // ignore load errors
    }
  }

  // Update Media Session metadata
  try {
    const nav = navigator as unknown as { mediaSession?: { metadata?: unknown } };
    const w = window as unknown as { MediaMetadata?: new (data: unknown) => unknown };
    if (nav.mediaSession && w.MediaMetadata) {
      const artwork = currentTrack.coverArt ? [{ src: currentTrack.coverArt, sizes: '512x512', type: 'image/png' }] : [];
      nav.mediaSession.metadata = new w.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'VibeSync',
        artwork,
      }) as unknown as MediaMetadata;
    }
  } catch (e) {
    // ignore media session errors
  }

  // Auto-play if isPlaying is true
  const shouldAutoPlay = usePlayerStore.getState().isPlaying;
  if (shouldAutoPlay) {
    audio.play().catch(err => {
      console.error('Playback failed:', err);
      setIsPlaying(false);
    });
  }
}, [currentTrack, setIsPlaying]);

  // Handle play/pause
useEffect(() => {
  if (!audioRef.current) return;

  const audio = audioRef.current;

  if (isPlaying) {
    // Avoid calling play() with an empty src
    if (!audio.src) return;

    // Restore currentTime from store to ensure continuity
    const currentTime = usePlayerStore.getState().currentTime || 0;
    audio.currentTime = currentTime;

    audio.play().then(() => {
      const st = usePlayerStore.getState();
      const t = st.currentTrack;
      if (t) {
        const updated: import('@/lib/db').Track = { ...t, lastPlayed: Date.now() };
        st.setCurrentTrack(updated);
        updateTrack(updated).catch(() => {});
      }
    }).catch(err => {
      console.error('Playback failed:', err);
      setIsPlaying(false);
    });
  } else {
    // Store currentTime when pausing
    setCurrentTime(audio.currentTime);
    audio.pause();
  }
}, [isPlaying, setIsPlaying, setCurrentTime]);

  // Media Session action handlers (once)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = (navigator as unknown as { mediaSession?: MediaSession }).mediaSession;
    try {
      if (ms) {
        ms.setActionHandler('play', () => usePlayerStore.getState().setIsPlaying(true));
        ms.setActionHandler('pause', () => usePlayerStore.getState().setIsPlaying(false));
        ms.setActionHandler('previoustrack', () => usePlayerStore.getState().previousTrack());
        ms.setActionHandler('nexttrack', () => usePlayerStore.getState().nextTrack());
        ms.setActionHandler('seekto', (details: MediaSessionActionDetails) => {
          if (typeof details.seekTime === 'number') {
            seekToTime(details.seekTime);
          }
        });
      }
    } catch (e) {
      // ignore media session handler errors
    }

    return () => {
      try {
        if (ms) {
          ms.setActionHandler('play', null);
          ms.setActionHandler('pause', null);
          ms.setActionHandler('previoustrack', null);
          ms.setActionHandler('nexttrack', null);
          ms.setActionHandler('seekto', null);
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    updateSettings({ volume });
  }, [volume]);
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse audio file metadata
 */
export async function parseAudioFile(file: File): Promise<{
  title: string;
  artist: string;
  duration: number;
  fileUrl: string;
  blob: Blob;
}> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      // Extract filename without extension
      const filename = file.name.replace(/\.[^/.]+$/, '');
      // We only needed this URL to read metadata; revoke it now.
      URL.revokeObjectURL(objectUrl);
      
      resolve({
        title: filename,
        artist: 'Unknown Artist',
        duration: audio.duration,
        fileUrl: '',
        blob: file,
      });
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load audio file'));
    });

    audio.src = objectUrl;
  });
}
