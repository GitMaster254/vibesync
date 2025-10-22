/**
 * Scanner service for folder selection, scanning, and re-scanning using File System Access API.
 * Integrates with existing import logic for adding tracks to the library.
 */

import { importFilesWithWorker, type ImportProgress } from './importWithProgress';
import { saveHandle } from './storageService';

// Supported audio formats
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];

export interface ScanResult {
  handle: FileSystemDirectoryHandle;
  files: File[];
}

// Type assertions for File System Access API (not fully typed in TypeScript yet)
type DirHandleWithEntries = FileSystemDirectoryHandle & {
  entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
};

type DirHandleWithPermissions = FileSystemDirectoryHandle & {
  queryPermission: (options: { mode: 'read' }) => Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission: (options: { mode: 'read' }) => Promise<'granted' | 'denied'>;
};

/**
 * Recursively scans a directory handle for audio files.
 * @param dirHandle - The directory handle to scan
 * @returns Array of File objects for audio files
 */
const getAudioFilesFromHandle = async (dirHandle: FileSystemDirectoryHandle): Promise<File[]> => {
  const musicFiles: File[] = [];

  const walkDirectory = async (handle: FileSystemDirectoryHandle) => {
    const dirWithEntries = handle as DirHandleWithEntries;
    for await (const [, entry] of dirWithEntries.entries()) {
      if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();

        // Check MIME type or file extension
        const isAudio = AUDIO_MIME_TYPES.includes(file.type) ||
                        AUDIO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

        if (isAudio) {
          musicFiles.push(file);
        }
      } else if (entry.kind === 'directory') {
        // Recursively scan subdirectories
        await walkDirectory(entry as FileSystemDirectoryHandle);
      }
    }
  };

  await walkDirectory(dirHandle);
  return musicFiles;
};

/**
 * Selects a folder using the File System Access API and scans it for audio files.
 * Stores the folder handle persistently and imports the found files.
 * @param onProgress - Callback for import progress updates
 * @param onComplete - Callback after import completion
 * @returns ScanResult or null if cancelled/error
 */
export const selectAndScanFolder = async (
  onProgress: (progress: ImportProgress) => void,
  onComplete: () => void
): Promise<ScanResult | null> => {
  if (!('showDirectoryPicker' in window)) {
    throw new Error("Your browser does not fully support persistent folder access. Please use a Chromium-based browser like Chrome or Edge.");
  }

  try {
    // 1. SELECT FOLDER (User Prompt)
    const dirHandle = await (window as any).showDirectoryPicker();

    // 2. STORE HANDLE (for persistence)
    await saveHandle(dirHandle);

    // 3. SCAN FOLDER
    const audioFiles = await getAudioFilesFromHandle(dirHandle);

    if (audioFiles.length === 0) {
      throw new Error("No audio files found in the selected folder.");
    }

    // 4. IMPORT FILES (using existing import logic)
    await importFilesWithWorker(audioFiles, onProgress, onComplete);

    return { handle: dirHandle, files: audioFiles };

  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('User cancelled folder selection.');
    } else {
      console.error('Error selecting or scanning folder:', error);
      throw error;
    }
    return null;
  }
};

/**
 * Re-scans an existing folder handle for new audio files.
 * @param dirHandle - The stored directory handle to re-scan
 * @param onProgress - Callback for import progress updates
 * @param onComplete - Callback after import completion
 * @returns Array of new File objects found
 */
export const reScanFolder = async (
  dirHandle: FileSystemDirectoryHandle,
  onProgress: (progress: ImportProgress) => void,
  onComplete: () => void
): Promise<File[]> => {
  try {
    // 1. VERIFY PERMISSION
    const options = { mode: 'read' as const };
    const dirWithPermissions = dirHandle as DirHandleWithPermissions;
    if ((await dirWithPermissions.queryPermission(options)) !== 'granted') {
      // Request permission again if it was lost (e.g., browser update)
      if ((await dirWithPermissions.requestPermission(options)) !== 'granted') {
        throw new Error(`Access to folder "${dirHandle.name}" was denied.`);
      }
    }

    // 2. RESCAN
    const updatedFiles = await getAudioFilesFromHandle(dirHandle);

    if (updatedFiles.length === 0) {
      console.log(`No audio files found in "${dirHandle.name}".`);
      return [];
    }

    // 3. IMPORT NEW FILES (existing logic handles duplicates)
    await importFilesWithWorker(updatedFiles, onProgress, onComplete);

    return updatedFiles;
  } catch (error) {
    console.error('Error re-scanning folder:', error);
    throw error;
  }
};
