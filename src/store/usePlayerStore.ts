import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/lib/db';

/**
 * Global audio player state management using Zustand
 * Manages playback, queue, and player UI state
 * Persisted to localStorage for state recovery
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
  originalQueue: Track[]; // Store original queue before shuffle
  upNextQueue: Track[]; // Tracks manually added to play next
  
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
  playNext: (track: Track) => void; // Add track to play next
  addToQueue: (track: Track) => void; // Add track to end of queue
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  togglePlayer: () => void;
  reset: () => void;
}

// Helper function to shuffle array
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
      queue: [],
      queueIndex: 0,
      originalQueue: [],
      upNextQueue: [],
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
      toggleShuffle: () => {
        const { shuffle, queue, currentTrack, queueIndex, originalQueue } = get();
        
        if (!shuffle) {
          // Turning shuffle ON
          const newOriginalQueue = originalQueue.length > 0 ? originalQueue : [...queue];
          const currentTrackInQueue = queue[queueIndex];
          
          // Shuffle all tracks except current
          const otherTracks = queue.filter((_, idx) => idx !== queueIndex);
          const shuffledOthers = shuffleArray(otherTracks);
          
          // New queue: current track first, then shuffled
          const newQueue = currentTrackInQueue 
            ? [currentTrackInQueue, ...shuffledOthers]
            : shuffleArray(queue);
          
          set({
            shuffle: true,
            queue: newQueue,
            queueIndex: currentTrackInQueue ? 0 : queueIndex,
            originalQueue: newOriginalQueue,
          });
        } else {
          // Turning shuffle OFF - restore original queue
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
      
      // Play next - add track to play immediately after current
      playNext: (track) => {
        const { queue, queueIndex, upNextQueue } = get();
        
        if (!queue || queue.length === 0) {
          // No queue exists, just play the track
          set({
            currentTrack: track,
            queue: [track],
            queueIndex: 0,
            isPlaying: true,
            currentTime: 0,
          });
          return;
        }
        
        // Add to upNextQueue for priority handling
        const newUpNextQueue = [...upNextQueue, track];
        
        // Insert track right after current position
        const newQueue = [
          ...queue.slice(0, queueIndex + 1),
          track,
          ...queue.slice(queueIndex + 1),
        ];
        
        set({
          queue: newQueue,
          upNextQueue: newUpNextQueue,
        });
      },
      
      // Add to queue - add track to end of queue
      addToQueue: (track) => {
        const { queue } = get();
        
        if (!queue || queue.length === 0) {
          set({
            currentTrack: track,
            queue: [track],
            queueIndex: 0,
            isPlaying: true,
            currentTime: 0,
          });
          return;
        }
        
        set({
          queue: [...queue, track],
        });
      },
      
      // Remove track from queue
      removeFromQueue: (index) => {
        const { queue, queueIndex } = get();
        
        if (index < 0 || index >= queue.length) return;
        
        const newQueue = queue.filter((_, idx) => idx !== index);
        
        // Adjust queueIndex if necessary
        let newQueueIndex = queueIndex;
        if (index < queueIndex) {
          newQueueIndex = Math.max(0, queueIndex - 1);
        } else if (index === queueIndex && newQueue.length > 0) {
          // If removing current track, play next in queue
          newQueueIndex = Math.min(queueIndex, newQueue.length - 1);
          set({
            queue: newQueue,
            queueIndex: newQueueIndex,
            currentTrack: newQueue[newQueueIndex] || null,
          });
          return;
        }
        
        set({
          queue: newQueue,
          queueIndex: newQueueIndex,
        });
      },
      
      // Clear entire queue
      clearQueue: () => {
        set({
          queue: [],
          queueIndex: 0,
          upNextQueue: [],
          currentTrack: null,
          isPlaying: false,
        });
      },
      
      // Navigation
      nextTrack: () => {
        let { queue, queueIndex, repeat, currentTrack, upNextQueue } = get();
        
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
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        let nextIndex = queueIndex + 1;

        if (nextIndex >= queue.length) {
          if (repeat === 'all') {
            nextIndex = 0;
          } else {
            // End of queue - stop playing
            set({ isPlaying: false, currentTime: 0 });
            return;
          }
        }

        // Remove from upNextQueue if it was manually added
        const nextTrack = queue[nextIndex];
        const newUpNextQueue = upNextQueue.filter(t => t.id !== nextTrack?.id);

        set({
          queueIndex: nextIndex,
          currentTrack: nextTrack,
          currentTime: 0,
          isPlaying: true,
          upNextQueue: newUpNextQueue,
        });
      },
      
      previousTrack: () => {
        let { queue, queueIndex, currentTime, currentTrack } = get();
        
        // Fallback: if no queue, treat currentTrack as single-item queue
        if (!queue || queue.length === 0) {
          if (currentTrack) {
            queue = [currentTrack];
            queueIndex = 0;
            set({ queue, queueIndex, currentTime: 0 });
          } else {
            return;
          }
          return;
        }

        // If more than 3 seconds in, restart current track
        if (currentTime > 3) {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        const prevIndex = queueIndex - 1;

        if (prevIndex < 0) {
          // Already at start, just restart
          set({ currentTime: 0, isPlaying: true });
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
        const currentQueue = tracks && tracks.length > 0 ? tracks : [track];
        const index = currentQueue.findIndex(t => t.id === track.id);

        set({
          currentTrack: track,
          queue: currentQueue,
          queueIndex: index >= 0 ? index : 0,
          originalQueue: [], // Reset shuffle state
          upNextQueue: [], // Clear manual queue
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
        originalQueue: [],
        upNextQueue: [],
        isPlayerVisible: false,
      }),
    }),
    {
      name: 'vibesync-player-storage',
      // Only persist certain fields
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        // Don't persist playback state to avoid stale data
      }),
    }
  )
);