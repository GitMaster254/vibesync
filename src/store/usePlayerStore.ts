import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/lib/db';

/**
 * Playback modes:
 * 'order': Sequential play through the queue
 * 'loop-all': Loops the entire queue
 * 'repeat-one': Repeats the current track infinitely
 * 'shuffle': Randomizes the queue order
 */
type PlaybackMode = 'order' | 'loop-all' | 'repeat-one' | 'shuffle';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  originalQueue: Track[];
  upNextQueue: Track[];
  
  // New State for Mode & UI
  playbackMode: PlaybackMode;
  bannerMessage: string | null;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (tracks: Track[]) => void;
  setQueueIndex: (index: number) => void;
  
  // Updated/New Actions
  togglePlaybackMode: () => void;
  setBannerMessage: (message: string | null) => void;
  
  nextTrack: () => void;
  previousTrack: () => void;
  playTrack: (track: Track, tracks?: Track[]) => void;
  clearQueue: () => void;
  reset: () => void;
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
      currentTrack: null,
      isPlaying: false,
      volume: 0.7,
      currentTime: 0,
      duration: 0,
      queue: [],
      queueIndex: 0,
      originalQueue: [],
      upNextQueue: [],
      playbackMode: 'order',
      bannerMessage: null,

      setCurrentTrack: (track) => set({ currentTrack: track }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setQueue: (tracks) => set({ queue: tracks }),
      setQueueIndex: (index) => set({ queueIndex: index }),
      setBannerMessage: (message) => set({ bannerMessage: message }),

      togglePlaybackMode: () => {
        const modes: PlaybackMode[] = ['order', 'loop-all', 'repeat-one', 'shuffle'];
        const currentMode = get().playbackMode;
        const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];

        const { queue, currentTrack, queueIndex, originalQueue } = get();

        // 1. Logic for switching INTO shuffle
        if (nextMode === 'shuffle') {
          const newOriginalQueue = originalQueue.length > 0 ? originalQueue : [...queue];
          const currentTrackInQueue = queue[queueIndex];
          const otherTracks = queue.filter((_, idx) => idx !== queueIndex);
          const shuffledQueue = currentTrackInQueue 
            ? [currentTrackInQueue, ...shuffleArray(otherTracks)]
            : shuffleArray(queue);

          set({
            playbackMode: 'shuffle',
            queue: shuffledQueue,
            queueIndex: currentTrackInQueue ? 0 : queueIndex,
            originalQueue: newOriginalQueue,
            bannerMessage: 'Shuffle Mode On'
          });
        } 
        // 2. Logic for switching OUT OF shuffle back to Order (or other modes)
        else if (currentMode === 'shuffle' && originalQueue.length > 0) {
          const originalIndex = originalQueue.findIndex(t => t.id === currentTrack?.id);
          set({
            playbackMode: nextMode,
            queue: originalQueue,
            queueIndex: originalIndex >= 0 ? originalIndex : 0,
            originalQueue: [],
            bannerMessage: getBannerText(nextMode)
          });
        } 
        // 3. Normal cycle for non-shuffle modes
        else {
          set({ 
            playbackMode: nextMode,
            bannerMessage: getBannerText(nextMode)
          });
        }

        // Auto-dismiss banner after 2.5 seconds
        setTimeout(() => set({ bannerMessage: null }), 2500);
      },

      nextTrack: () => {
        const { queue, queueIndex, playbackMode } = get();
        if (queue.length === 0) return;

        if (playbackMode === 'repeat-one') {
          set({ currentTime: 0, isPlaying: true });
          return;
        }

        let nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (playbackMode === 'loop-all' || playbackMode === 'shuffle') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false, currentTime: 0 });
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
        const { queue, queueIndex, currentTime } = get();
        if (queue.length === 0) return;

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

      playTrack: (track, tracks) => {
        const currentQueue = tracks && tracks.length > 0 ? tracks : [track];
        const index = currentQueue.findIndex(t => t.id === track.id);
        set({
          currentTrack: track,
          queue: currentQueue,
          queueIndex: index >= 0 ? index : 0,
          originalQueue: [],
          isPlaying: true,
          currentTime: 0,
          playbackMode: 'order' // Reset to order when picking a specific song
        });
      },

      clearQueue: () => set({ queue: [], queueIndex: 0, currentTrack: null, isPlaying: false }),
      
      reset: () => set({
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        queue: [],
        playbackMode: 'order',
        bannerMessage: null
      }),
    }),
    {
      name: 'vibesync-player-storage',
      partialize: (state) => ({
        volume: state.volume,
        playbackMode: state.playbackMode,
      }),
    }
  )
);

// Helper for banner text
function getBannerText(mode: PlaybackMode): string {
  switch (mode) {
    case 'loop-all': return 'Looping All Tracks';
    case 'repeat-one': return 'Repeating Current Track';
    case 'shuffle': return 'Shuffle Mode On';
    default: return 'Sequential Play';
  }
}
