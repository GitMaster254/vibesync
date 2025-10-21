import { Track, addTrack } from '@/lib/db';
import { toast } from 'sonner';

/**
 * Import audio files into the library using the backend server for metadata extraction
 * @param fileList - FileList or File[] to import
 * @param onSuccess - Optional callback after successful import
 */
export async function importAudioFiles(
  fileList: FileList | File[],
  onSuccess?: () => void
): Promise<void> {
  const fileArray = Array.from(fileList as any).filter(
    (file: File) => file.type && file.type.startsWith('audio/')
  );

  if (fileArray.length === 0) {
    toast.error('No valid audio files found');
    return;
  }

  // Use backend server for metadata extraction (production or local dev)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Extract metadata using backend server
  const results = await Promise.allSettled(
    fileArray.map(async (file: File) => {
      try {
        const form = new FormData();
        form.append("audio", file);

        const resp = await fetch(`${backendUrl}/api/extract-metadata`, {
          method: "POST",
          body: form,
          mode: "cors",
        });

        if (!resp.ok) throw new Error(`Backend error ${resp.status}`);
        const json = await resp.json();

        const md = json.metadata as {
          title: string;
          artist: string;
          album?: string;
          duration?: number;
          coverArt?: string;
        };

        const track: Track = {
          id: `track-${Date.now()}-${Math.random()}`,
          title: md.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: md.artist || "Unknown Artist",
          album: md.album,
          duration: md.duration ?? 0,
          fileUrl: "",
          blob: file,
          coverArt: md.coverArt,
          favorite: false,
          addedAt: new Date(),
        };

        await addTrack(track);
        return { success: true, track };
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        return { success: false, error };
      }
    })
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  if (successCount > 0) {
    toast.success(
      `Successfully imported ${successCount} track${successCount > 1 ? 's' : ''}`
    );
    onSuccess?.();
  } else {
    toast.error('Failed to import audio files');
  }
}
