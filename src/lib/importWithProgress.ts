/**
 * Import audio files via backend with progress tracking
 * Skips duplicates based on name + size
 * Uses Render backend (VITE_METADATA_API)
 */

export type ImportProgress = {
  active: boolean;
  total: number;
  current: number;
  fileName?: string;
  errors?: Array<{ fileName: string; error: string }>;
};

export type ImportProgressCallback = (progress: ImportProgress) => void;

export async function importFilesWithWorker(
  files: File[],
  onProgress: ImportProgressCallback,
  onComplete?: () => void
): Promise<void> {
  return new Promise(async (resolve) => {
    const backendUrl = import.meta.env.VITE_METADATA_API; // ✅ Use Render backend URL

    if (!backendUrl) {
      console.error("VITE_METADATA_API not defined");
      throw new Error("Missing backend URL. Please define VITE_METADATA_API in .env");
    }

    const errors: Array<{ fileName: string; error: string }> = [];
    const { getAllTracks, addTrack } = await import("./db");
    const existingTracks = await getAllTracks();

    // --- helper to check duplicates ---
    async function isDuplicateFile(file: File, existingTracks: any[]): Promise<boolean> {
      const normalizedName = file.name.trim().toLowerCase();
      return existingTracks.some(
        (t) =>
          t?.blob &&
          t.blob.size === file.size &&
          (t.title?.trim().toLowerCase() === normalizedName ||
            t.blob.name?.trim().toLowerCase() === normalizedName)
      );
    }

    // --- main import process ---
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // skip duplicate
      if (await isDuplicateFile(file, existingTracks)) {
        errors.push({
          fileName: file.name,
          error: "Skipped duplicate (same name & size)",
        });
        onProgress({
          active: true,
          total: files.length,
          current: i + 1,
          fileName: file.name,
          errors: [...errors],
        });
        continue;
      }

      const form = new FormData();
      form.append("audio", file);

      try {
        const resp = await fetch(`${backendUrl}`, {
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

        const track = {
          id: `track-${crypto.randomUUID()}`, // ✅ use robust unique ID
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
        existingTracks.push(track);

        onProgress({
          active: true,
          total: files.length,
          current: i + 1,
          fileName: file.name,
          errors: [...errors],
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        errors.push({ fileName: file.name, error });
        onProgress({
          active: true,
          total: files.length,
          current: i + 1,
          fileName: file.name,
          errors: [...errors],
        });
      }
    }

    onProgress({ active: false, total: 0, current: 0, errors: [] });
    onComplete?.();
    resolve();
  });
}
