import { extractMetadata } from './metadataExtractor';

export type ImportProgress = {
  active: boolean;
  total: number;
  current: number;
  fileName?: string;
  errors?: string[] | { fileName: string; error: string }[];
};

export type ImportProgressCallback = (progress: ImportProgress) => void;

export async function importFilesWithProgress(
  files: File[],
  onProgress: ImportProgressCallback,
  onComplete?: () => void
): Promise<void> {
  console.log('importFilesWithProgress started with', files.length, 'files');
  
  const errors: Array<{ fileName: string; error: string }> = [];
  const { getAllTracks, addTrack } = await import("./db");
  const existingTracks = await getAllTracks();
  let processedCount = 0;
  let successfulImports = 0;

  // Validate files first
  const validFiles = files.filter(file => {
    if (file.size === 0) {
      errors.push({ fileName: file.name, error: "File is empty" });
      return false;
    }
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      errors.push({ fileName: file.name, error: "File too large (max 100MB)" });
      return false;
    }
    return true;
  });

  console.log('Valid files:', validFiles.length, 'Invalid:', files.length - validFiles.length);

  if (validFiles.length === 0) {
    onProgress({
      active: false,
      total: 0,
      current: 0,
      errors: errors
    });
    throw new Error('No valid files to import');
  }

  // Process files sequentially
  for (const file of validFiles) {
    try {
      onProgress({
        active: true,
        total: validFiles.length,
        current: processedCount,
        fileName: `Processing: ${file.name}`,
        errors: [...errors],
      });

      // Check for duplicates
      const isDuplicate = await isDuplicateFile(file, existingTracks);
      if (isDuplicate) {
        errors.push({
          fileName: file.name,
          error: "Skipped duplicate (same name & size)",
        });
        processedCount++;
        continue;
      }

      // Extract metadata using our new extractor
      const metadata = await extractMetadata(file);
      
      // Create track object with comprehensive metadata
      const track = {
        id: `track-${crypto.randomUUID()}`,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration,
        fileUrl: URL.createObjectURL(file),
        blob: file,
        coverArt: metadata.coverUrl,
        year: metadata.year,
        trackNumber: null, // Could extract from metadata.track if available
        genre: metadata.genre,
        bitrate: metadata.bitrate,
        sampleRate: metadata.sampleRate,
        codec: metadata.codec,
        format: metadata.formatName,
        size: metadata.size,
        favorite: false,
        addedAt: new Date(),
      };

      await addTrack(track);
      successfulImports++;
      processedCount++;

      console.log('✅ Successfully imported:', track.title);

      onProgress({
        active: true,
        total: validFiles.length,
        current: processedCount,
        fileName: `Imported: ${file.name}`,
        errors: [...errors],
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ fileName: file.name, error: errorMsg });
      processedCount++;
      console.error('❌ Error processing file:', file.name, error);

      onProgress({
        active: true,
        total: validFiles.length,
        current: processedCount,
        fileName: `Error: ${file.name}`,
        errors: [...errors],
      });
    }
  }

  onProgress({
    active: false,
    total: 0,
    current: 0,
    errors: errors.length > 0 ? errors : undefined,
  });

  onComplete?.();

  if (successfulImports === 0 && errors.length > 0) {
    throw new Error(`Import failed: ${errors.map(e => e.error).join(', ')}`);
  }

  console.log('🎉 Import completed. Successful:', successfulImports, 'Errors:', errors.length);
}

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