import { create } from 'zustand';
import { Track } from '@/lib/db';

/**
 * Global audio player state management using Zustand
 * Manages playback, queue, and player UI state
 */
interface PlayerState {
  // Current playback state
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  
  // Queue management
  queue: Track[];
  queueIndex: number;
  
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
  togglePlayer: () => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  currentTime: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  shuffle: false,
  repeat: 'none',
  isPlayerVisible: false,
  
  // Basic setters
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setQueue: (tracks) => set({ queue: tracks }),
  setQueueIndex: (index) => set({ queueIndex: index }),
  
  // Toggle functions
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  cycleRepeat: () => set((state) => ({
    repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none'
  })),
  
  // Navigation
  nextTrack: () => {
    let { queue, queueIndex, repeat, shuffle, currentTrack } = get();
    // Fallback: if no queue, treat currentTrack as single-item queue
    if (!queue || queue.length === 0) {
      if (currentTrack) {
        queue = [currentTrack];
        queueIndex = 0;
        set({ queue, queueIndex });
      } else {
        return;
      }
    }

    if (repeat === 'one') {
      set({ currentTime: 0 });
      return;
    }

    let nextIndex = queueIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },
  
  previousTrack: () => {
    let { queue, queueIndex, currentTime, currentTrack } = get();
    // Fallback: if no queue, treat currentTrack as single-item queue
    if (!queue || queue.length === 0) {
      if (currentTrack) {
        queue = [currentTrack];
        queueIndex = 0;
        set({ queue, queueIndex });
      } else {
        return;
      }
    }

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const prevIndex = queueIndex - 1;

    if (prevIndex < 0) {
      set({ currentTime: 0 });
      return;
    }

    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },
  
  // Play a specific track
  playTrack: (track, tracks) => {
    let currentQueue = tracks && tracks.length > 0 ? tracks : [track];
    const index = currentQueue.findIndex(t => t.id === track.id);

    set({
      currentTrack: track,
      queue: currentQueue,
      queueIndex: index >= 0 ? index : 0,
      isPlaying: true,
      currentTime: 0,
      isPlayerVisible: true,
    });
  },
  
  // Toggle player visibility
  togglePlayer: () => set((state) => ({ isPlayerVisible: !state.isPlayerVisible })),
  
  // Reset player
  reset: () => set({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    queue: [],
    queueIndex: 0,
  }),
}));
