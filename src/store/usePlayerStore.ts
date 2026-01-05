import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/lib/db';
import { fetchLyrics } from '@/lib/lyricsService';

/**
 * Global audio player state management using Zustand
 */
interface PlayerState {
  // Current playback state
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;

  // Lyrics state
  lyrics: string | null;
  syncedLyrics: string | null;
  isFetchingLyrics: boolean;
  lyricsError: string | null;
  lyricsCache: Record<string, { plain: string | null; synced: string | null }>;

  // Queue management
  queue: Track[];
  queueIndex: number;
  originalQueue: Track[];
  upNextQueue: Track[];

  // Playback modes
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';

  // UI state
  isPlayerVisible: boolean;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (tracks: Track[]) => void;
  setQueueIndex: (index: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  playTrack: (track: Track, tracks?: Track[]) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  togglePlayer: () => void;
  reset: () => void;

  // Lyrics Actions
  fetchTrackLyrics: (track: Track) => Promise<void>;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,

      // Lyrics initial state
      lyrics: null,
      syncedLyrics: null,
      isFetchingLyrics: false,
      lyricsError: null,
      lyricsCache: {},

      queue: [],
      queueIndex: 0,
      originalQueue: [],
      upNextQueue: [],
      shuffle: false,
      repeat: 'none',
      isPlayerVisible: false,

      // --- Lyrics Action Implementation ---
      fetchTrackLyrics: async (track: Track) => {
        const { lyricsCache } = get();

        // Check Cache first
        if (lyricsCache[track.id]) {
          set({
            lyrics: lyricsCache[track.id].plain,
            syncedLyrics: lyricsCache[track.id].synced,
            lyricsError: null,
            isFetchingLyrics: false
          });
          return;
        }

        set({ isFetchingLyrics: true, lyrics: null, syncedLyrics: null, lyricsError: null });

        try {
          const result = await fetchLyrics(track.artist || "Unknown Artist", track.title);

          if (result && (result.plainLyrics || result.syncedLyrics)) {
            const plain = result.plainLyrics || null;
            const synced = result.syncedLyrics || null;

            set((state) => ({
              lyrics: plain,
              syncedLyrics: synced,
              isFetchingLyrics: false,
              lyricsCache: {
                ...state.lyricsCache,
                [track.id]: { plain, synced }
              }
            }));
          } else {
            set({ lyricsError: "No lyrics found for this track.", isFetchingLyrics: false });
          }
        } catch (error) {
          set({ lyricsError: "Error connecting to lyrics database.", isFetchingLyrics: false });
        }
      },

      // --- Navigation Actions (Updated to trigger lyrics) ---
      setCurrentTrack: (track) => {
        set({ currentTrack: track });
        if (track) get().fetchTrackLyrics(track);
      },

      playTrack: (track, tracks) => {
        const currentQueue = tracks && tracks.length > 0 ? tracks : [track];
        const index = currentQueue.findIndex(t => t.id === track.id);

        set({
          currentTrack: track,
          queue: currentQueue,
          queueIndex: index >= 0 ? index : 0,
          originalQueue: [],
          upNextQueue: [],
          isPlaying: true,
          currentTime: 0,
          isPlayerVisible: true,
        });

        get().fetchTrackLyrics(track);
      },

      nextTrack: () => {
        let { queue, queueIndex, repeat, currentTrack, upNextQueue } = get();
        if (!queue || queue.length === 0) return;

        if (repeat === 'one') {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        let nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeat === 'all') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false, currentTime: 0 });
            return;
          }
        }

        const nextTrack = queue[nextIndex];
        set({
          queueIndex: nextIndex,
          currentTrack: nextTrack,
          currentTime: 0,
          isPlaying: true,
          upNextQueue: upNextQueue.filter(t => t.id !== nextTrack?.id),
        });

        get().fetchTrackLyrics(nextTrack);
      },

      previousTrack: () => {
        let { queue, queueIndex, currentTime } = get();
        if (!queue || queue.length === 0) return;

        if (currentTime > 3) {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        const prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        const prevTrack = queue[prevIndex];
        set({
          queueIndex: prevIndex,
          currentTrack: prevTrack,
          currentTime: 0,
          isPlaying: true,
        });

        get().fetchTrackLyrics(prevTrack);
      },

      // --- Basic Actions ---
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setQueue: (tracks) => set({ queue: tracks }),
      setQueueIndex: (index) => set({ queueIndex: index }),

      toggleShuffle: () => {
        const { shuffle, queue, currentTrack, queueIndex, originalQueue } = get();
        if (!shuffle) {
          const newOriginalQueue = originalQueue.length > 0 ? originalQueue : [...queue];
          const currentTrackInQueue = queue[queueIndex];
          const otherTracks = queue.filter((_, idx) => idx !== queueIndex);
          const shuffledOthers = shuffleArray(otherTracks);
          const newQueue = currentTrackInQueue ? [currentTrackInQueue, ...shuffledOthers] : shuffleArray(queue);

          set({
            shuffle: true,
            queue: newQueue,
            queueIndex: currentTrackInQueue ? 0 : queueIndex,
            originalQueue: newOriginalQueue,
          });
        } else {
          if (originalQueue.length > 0 && currentTrack) {
            const originalIndex = originalQueue.findIndex(t => t.id === currentTrack.id);
            set({
              shuffle: false,
              queue: originalQueue,
              queueIndex: originalIndex >= 0 ? originalIndex : 0,
              originalQueue: [],
            });
          } else {
            set({ shuffle: false });
          }
        }
      },

      cycleRepeat: () => set((state) => ({
        repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none'
      })),

      playNext: (track) => {
        const { queue, queueIndex, upNextQueue } = get();
        if (!queue || queue.length === 0) {
          get().playTrack(track, [track]);
          return;
        }
        const newQueue = [...queue.slice(0, queueIndex + 1), track, ...queue.slice(queueIndex + 1)];
        set({ queue: newQueue, upNextQueue: [...upNextQueue, track] });
      },

      addToQueue: (track) => {
        const { queue } = get();
        if (!queue || queue.length === 0) {
          get().playTrack(track, [track]);
          return;
        }
        set({ queue: [...queue, track] });
      },

      removeFromQueue: (index) => {
        const { queue, queueIndex } = get();
        if (index < 0 || index >= queue.length) return;

        const newQueue = queue.filter((_, idx) => idx !== index);
        let newQueueIndex = queueIndex;

        if (index < queueIndex) {
          newQueueIndex = Math.max(0, queueIndex - 1);
        } else if (index === queueIndex && newQueue.length > 0) {
          newQueueIndex = Math.min(queueIndex, newQueue.length - 1);
          const nextTrack = newQueue[newQueueIndex];
          set({ queue: newQueue, queueIndex: newQueueIndex, currentTrack: nextTrack });
          get().fetchTrackLyrics(nextTrack);
          return;
        }

        set({ queue: newQueue, queueIndex: newQueueIndex });
      },

      clearQueue: () => {
        set({
          queue: [],
          queueIndex: 0,
          upNextQueue: [],
          currentTrack: null,
          isPlaying: false,
          lyrics: null,
          syncedLyrics: null
        });
      },

      togglePlayer: () => set((state) => ({ isPlayerVisible: !state.isPlayerVisible })),

      reset: () => set({
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        queue: [],
        queueIndex: 0,
        originalQueue: [],
        upNextQueue: [],
        isPlayerVisible: false,
        lyrics: null,
        syncedLyrics: null
      }),
    }),
    {
      name: 'vibesync-player-storage',
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        lyricsCache: state.lyricsCache, // Persist cache across sessions
      }),
    }
  )
);
