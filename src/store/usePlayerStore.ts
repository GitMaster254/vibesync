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

  // Audio processing
  equalizer: {
    enabled: boolean;
    bands: number[]; // 10 bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz
    presets: { [key: string]: number[] };
  };
  effects: {
    reverb: { enabled: boolean; wet: number; decay: number; preDelay: number };
    delay: { enabled: boolean; wet: number; time: number; feedback: number };
    distortion: { enabled: boolean; wet: number; amount: number; };
  };

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

  // Audio processing actions
  setEqualizerEnabled: (enabled: boolean) => void;
  setEqualizerBand: (bandIndex: number, value: number) => void;
  setEqualizerPreset: (preset: string) => void;
  setReverbEnabled: (enabled: boolean) => void;
  setReverbParams: (params: Partial<PlayerState['effects']['reverb']>) => void;
  setDelayEnabled: (enabled: boolean) => void;
  setDelayParams: (params: Partial<PlayerState['effects']['delay']>) => void;
  setDistortionEnabled: (enabled: boolean) => void;
  setDistortionParams: (params: Partial<PlayerState['effects']['distortion']>) => void;
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
  equalizer: {
    enabled: false,
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Flat response
    presets: {
      'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      'Rock': [2, 1, 0, -1, -2, 0, 1, 2, 3, 4],
      'Pop': [-1, 0, 2, 3, 2, 0, -1, -2, -1, 1],
      'Jazz': [3, 2, 1, 2, -1, -2, 0, 1, 2, 3],
      'Classical': [2, 2, 1, 0, 0, 0, -1, -1, -1, 0],
      'Electronic': [4, 3, 0, -2, -3, 0, 2, 4, 5, 6],
      'Hip Hop': [3, 2, 0, -1, -2, 1, 2, 3, 4, 5],
      'Vocal': [1, 2, 3, 2, 0, -1, -2, -1, 0, 1],
    },
  },
  effects: {
    reverb: { enabled: false, wet: 0.3, decay: 2.0, preDelay: 0.1 },
    delay: { enabled: false, wet: 0.3, time: 0.3, feedback: 0.4 },
    distortion: { enabled: false, wet: 0.5, amount: 0.8 },
  },
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
    const currentQueue = tracks && tracks.length > 0 ? tracks : [track];
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

  // Audio processing actions
  setEqualizerEnabled: (enabled) => set((state) => ({
    equalizer: { ...state.equalizer, enabled }
  })),
  setEqualizerBand: (bandIndex, value) => set((state) => {
    const newBands = [...state.equalizer.bands];
    newBands[bandIndex] = Math.max(-20, Math.min(20, value));
    return { equalizer: { ...state.equalizer, bands: newBands } };
  }),
  setEqualizerPreset: (preset) => set((state) => {
    const presetValues = state.equalizer.presets[preset];
    if (presetValues) {
      return { equalizer: { ...state.equalizer, bands: [...presetValues] } };
    }
    return state;
  }),
  setReverbEnabled: (enabled) => set((state) => ({
    effects: { ...state.effects, reverb: { ...state.effects.reverb, enabled } }
  })),
  setReverbParams: (params) => set((state) => ({
    effects: { ...state.effects, reverb: { ...state.effects.reverb, ...params } }
  })),
  setDelayEnabled: (enabled) => set((state) => ({
    effects: { ...state.effects, delay: { ...state.effects.delay, enabled } }
  })),
  setDelayParams: (params) => set((state) => ({
    effects: { ...state.effects, delay: { ...state.effects.delay, ...params } }
  })),
  setDistortionEnabled: (enabled) => set((state) => ({
    effects: { ...state.effects, distortion: { ...state.effects.distortion, enabled } }
  })),
  setDistortionParams: (params) => set((state) => ({
    effects: { ...state.effects, distortion: { ...state.effects.distortion, ...params } }
  })),
}));
