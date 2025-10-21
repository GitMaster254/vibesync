import { useAudioPlayer } from "@/lib/audio";

// Mounts the audio hook globally so playback works across the app
export function AudioProvider() {
  useAudioPlayer();
  return null;
}

export default AudioProvider;
