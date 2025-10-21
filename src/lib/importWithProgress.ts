/**
 * Import audio files with Web Worker and progress tracking
 * Skips duplicates based on name + size
 * Returns a function to update progress state and a promise that resolves when done
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
  return new Promise((resolve, reject) => {
    // Always use the backend server for metadata extraction
    const backendUrl = 'http://localhost:5000';

    // ---------- 🧠 Helper to check for duplicates ----------
    async function isDuplicateFile(file: File, existingTracks: any[]): Promise<boolean> {
      // Normalize title (case-insensitive)
      const normalizedName = file.name.trim().toLowerCase();
      return existingTracks.some(
        (t) =>
          t?.blob &&
          t.blob.size === file.size &&
          (t.title?.trim().toLowerCase() === normalizedName ||
            t.blob.name?.trim().toLowerCase() === normalizedName)
      );
    }

    // ---------- 💽 Backend route with FFmpeg ----------
    const viaBackend = async () => {
      const errors: Array<{ fileName: string; error: string }> = [];
      const { getAllTracks, addTrack } = await import("./db");
      const existingTracks = await getAllTracks();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 🧩 Check duplicate
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
          const resp = await fetch(`${backendUrl}/extract-metadata`, {
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
            id: `track-${Date.now()}-${Math.random()}-${i + 1}`,
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
          existingTracks.push(track); // Add new track to memory for further checks

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
    };

    // ---------- ⚙️ Worker fallback ----------
    const viaWorker = async () => {
      const { getAllTracks, addTrack } = await import("./db");
      const existingTracks = await getAllTracks();

      try {
        const importWorkerUrl = new URL("../workers/importWorker.ts", import.meta.url);
        const worker = new Worker(importWorkerUrl, { type: "module" });

        type WorkerMsg =
          | {
              type: "metadata";
              index: number;
              total: number;
              fileName: string;
              data: {
                title: string;
                artist: string;
                album?: string;
                duration: number;
                coverArt?: string;
              };
              file: File;
            }
          | { type: "error"; error: string; fileName: string }
          | { type: "done"; total: number };

        const errors: Array<{ fileName: string; error: string }> = [];

        // Filter duplicates before sending to worker
        const uniqueFiles = [];
        for (const file of files) {
          if (await isDuplicateFile(file, existingTracks)) {
            errors.push({
              fileName: file.name,
              error: "Skipped duplicate (same name & size)",
            });
          } else {
            uniqueFiles.push(file);
          }
        }

        worker.postMessage({ files: uniqueFiles });

        worker.onmessage = async (e: MessageEvent<WorkerMsg>) => {
          const data = e.data;
          if (data.type === "metadata") {
            const { file, index, total, fileName, data: md } = data;
            try {
              const track = {
                id: `track-${Date.now()}-${Math.random()}-${index}`,
                title: md.title,
                artist: md.artist,
                album: md.album,
                duration: md.duration,
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
                total,
                current: index,
                fileName,
                errors: [...errors],
              });
            } catch (err) {
              const error = err instanceof Error ? err.message : String(err);
              errors.push({ fileName, error });
              onProgress({
                active: true,
                total,
                current: index,
                fileName,
                errors: [...errors],
              });
            }
          } else if (data.type === "error") {
            const { error, fileName } = data;
            errors.push({ fileName, error });
            onProgress({
              active: true,
              total: files.length,
              current: 0,
              errors: [...errors],
            });
          } else if (data.type === "done") {
            worker.terminate();
            onProgress({ active: false, total: 0, current: 0, errors: [] });
            onComplete?.();
            resolve();
          }
        };

        worker.onerror = (err) => {
          worker.terminate();
          onProgress({ active: false, total: 0, current: 0, errors: [] });
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    };

    // ---------- Choose path ----------
    // Always try backend first, fallback to worker on failure
    viaBackend().catch(() => viaWorker());
  });
}
