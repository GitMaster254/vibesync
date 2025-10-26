import { Playlist } from "@/components/TrackCard";
import { Track } from "@/lib/db";

export interface AppTrack extends Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileUrl: string;
  blob: File;
  coverArt?: string;
  year?: number;
  trackNumber?: number;
  genre?: string;
  bitrate?: number;
  sampleRate?: number;
  codec?: string;
  favorite: boolean;
  addedAt: Date;
  playCount: number;
  lastPlayed: number;
}

// Key for local storage
const PLAYLISTS_STORAGE_KEY = "music_player_playlists";

/**
 * Loads playlists from local storage.
 * @returns {Playlist[]} Array of playlists.
 */
export const loadPlaylistsFromStorage = (): Playlist[] => {
  if (typeof window === 'undefined') return [];
  try {
    const storedPlaylists = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    return storedPlaylists ? JSON.parse(storedPlaylists) : [];
  } catch (e) {
    console.error("Error loading playlists from localStorage", e);
    return [];
  }
};

/**
 * Saves playlists to local storage.
 * @param {Playlist[]} playlists Array of playlists to save.
 */
export const savePlaylistsToStorage = (playlists: Playlist[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error("Error saving playlists to localStorage", e);
  }
};

/**
 * Filters and sorts playlists based on search query.
 * @param playlists Array of playlists.
 * @param searchQuery Search string.
 * @returns Filtered and sorted playlists.
 */
export const filterAndSortPlaylists = (playlists: Playlist[], searchQuery: string): Playlist[] => {
  const query = searchQuery.trim().toLowerCase();
  const filtered = playlists.filter(playlist =>
    playlist.name?.toLowerCase().includes(query)
  );
  // Sort alphabetically by name
  return filtered.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Filters and sorts tracks based on search query.
 * @param tracks Array of tracks.
 * @param searchQuery Search string.
 * @returns Filtered and sorted tracks.
 */
export const filterAndSortTracks = (tracks: AppTrack[], searchQuery: string): AppTrack[] => {
  const query = searchQuery.trim().toLowerCase();
  const filtered = tracks.filter(track =>
    track.title?.toLowerCase().includes(query) ||
    track.artist?.toLowerCase().includes(query) ||
    track.album?.toLowerCase().includes(query)
  );
  // Sort alphabetically by title
  return filtered.sort((a, b) => a.title.localeCompare(b.title));
};

/**
 * Gets all audio files from a directory handle recursively.
 * @param dirHandle Directory handle.
 * @returns Array of audio files.
 */
export const getAllFilesFromDirectory = async (dirHandle: any): Promise<File[]> => {
  const files: File[] = [];

  const processEntry = async (handle: any) => {
    if (handle.kind === 'file') {
      const file = await handle.getFile();
      if (file.type.startsWith('audio/')) {
        files.push(file);
      }
    } else if (handle.kind === 'directory') {
      for await (const entry of handle.values()) {
        await processEntry(entry);
      }
    }
  };

  await processEntry(dirHandle);
  return files;
};

// Playlist Management Functions

/**
 * Creates a new playlist.
 * @param newPlaylistName Name of the new playlist.
 * @param playlists Current playlists array.
 * @returns New playlists array with the added playlist.
 */
export const createPlaylist = (newPlaylistName: string, playlists: Playlist[]): Playlist[] => {
  if (!newPlaylistName.trim()) {
    throw new Error("Enter a playlist name");
  }

  const newPlaylist: Playlist = {
    id: Date.now().toString(),
    name: newPlaylistName.trim(),
    trackIds: [],
    description: "",
    createdAt: new Date(Date.now().toString()),
    updatedAt: new Date(Date.now().toString()),
  };

  return [...playlists, newPlaylist];
};

/**
 * Deletes a playlist.
 * @param playlistId ID of the playlist to delete.
 * @param playlists Current playlists array.
 * @returns New playlists array without the deleted playlist.
 */
export const deletePlaylist = (playlistId: string, playlists: Playlist[]): Playlist[] => {
  return playlists.filter((p) => p.id !== playlistId);
};

/**
 * Toggles a track in a playlist.
 * @param playlistId ID of the playlist.
 * @param track The track to toggle.
 * @param playlists Current playlists array.
 * @returns New playlists array with the track toggled.
 */
export const toggleTrackInPlaylist = (playlistId: string, track: AppTrack, playlists: Playlist[]): Playlist[] => {
  return playlists.map(playlist => {
    if (playlist.id === playlistId) {
      const trackIndex = playlist.trackIds.indexOf(track.id);

      let newTrackIds;
      if (trackIndex > -1) {
        // Track is already in the playlist, so remove it
        newTrackIds = playlist.trackIds.filter(id => id !== track.id);
      } else {
        // Track is not in the playlist, so add it
        newTrackIds = [...playlist.trackIds, track.id];
      }

      return {
        ...playlist,
        trackIds: newTrackIds,
      };
    }
    return playlist;
  });
};

/**
 * Checks if a track is in a playlist.
 * @param playlistId ID of the playlist.
 * @param trackId ID of the track.
 * @param playlists Current playlists array.
 * @returns True if the track is in the playlist.
 */
export const isTrackInPlaylist = (playlistId: string, trackId: string, playlists: Playlist[]): boolean => {
  const playlist = playlists.find(p => p.id === playlistId);
  return playlist ? playlist.trackIds.includes(trackId) : false;
};

// Track Management Functions

/**
 * Deletes a track and removes it from all playlists.
 * @param track The track to delete.
 * @param tracks Current tracks array.
 * @param playlists Current playlists array.
 * @returns Object with new tracks and playlists arrays.
 */
export const deleteTrack = (track: AppTrack, tracks: AppTrack[], playlists: Playlist[]): { newTracks: AppTrack[], newPlaylists: Playlist[] } => {
  const newTracks = tracks.filter((t) => t.id !== track.id);
  const newPlaylists = playlists.map((playlist) => ({
    ...playlist,
    trackIds: playlist.trackIds.filter(id => id !== track.id)
  }));

  return { newTracks, newPlaylists };
};

// Import Handlers (refactored to take callbacks)

/**
 * Handles file import.
 * @param files Array of files.
 * @param setImportProgress Callback to set import progress.
 * @param loadTracks Callback to reload tracks.
 * @param toastSuccess Callback for success toast.
 * @param toastError Callback for error toast.
 */
export const handleFileImport = async (
  files: File[],
  setImportProgress: (progress: any) => void,
  loadTracks: () => Promise<void>,
  toastSuccess: (message: string) => void,
  toastError: (message: string) => void
) => {
  console.log('Starting import of', files.length, 'files:', files.map(f => f.name));

  setImportProgress({
    active: true,
    total: files.length,
    current: 0,
    fileName: "Starting import...",
    errors: []
  });

  try {
    const { importFilesWithProgress } = await import("@/lib/importWithProgress");
    await importFilesWithProgress(files, (progress: any) => {
      setImportProgress(prev => ({ ...prev, ...progress }));
    });

    console.log('Import completed successfully');
    await loadTracks();
    toastSuccess(`Successfully imported ${files.length} files`);
  } catch (error) {
    console.error('Import failed:', error);
    toastError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    console.log('Import process finished');
    setImportProgress(prev => ({ ...prev, active: false }));
  }
};

/**
 * Handles folder import.
 * @param canUseShowDirectoryPicker Whether folder picker is supported.
 * @param setImportProgress Callback to set import progress.
 * @param loadTracks Callback to reload tracks.
 * @param toastSuccess Callback for success toast.
 * @param toastError Callback for error toast.
 */
export const handleFolderImport = async (
  canUseShowDirectoryPicker: boolean,
  setImportProgress: (progress: any) => void,
  loadTracks: () => Promise<void>,
  toastSuccess: (message: string) => void,
  toastError: (message: string) => void
) => {
  if (!canUseShowDirectoryPicker) {
    toastError("Folder selection is not supported in your browser");
    return;
  }

  try {
    const directoryHandle = await (window as any).showDirectoryPicker();
    const files = await getAllFilesFromDirectory(directoryHandle);

    if (files.length === 0) {
      toastError("No audio files found in the selected folder");
      return;
    }

    setImportProgress({
      active: true,
      total: files.length,
      current: 0,
      fileName: "",
      errors: []
    });

    const { importFilesWithProgress } = await import("@/lib/importWithProgress");
    await importFilesWithProgress(files, (progress: any) => {
      setImportProgress(prev => ({ ...prev, ...progress }));
    });

    await loadTracks();
    toastSuccess(`Imported ${files.length} files from folder`);
  } catch (error) {
    if ((error as any).name !== 'AbortError') {
      toastError("Failed to import folder");
    }
  } finally {
    setImportProgress(prev => ({ ...prev, active: false }));
  }
};

// Search Handlers

/**
 * Handles search click.
 * @param setIsSearchOpen Callback to set search open state.
 * @param searchInputRef Ref to search input.
 */
export const handleSearchClick = (
  setIsSearchOpen: (open: boolean) => void,
  searchInputRef: React.RefObject<HTMLInputElement>
) => {
  setIsSearchOpen(true);
  setTimeout(() => {
    searchInputRef.current?.focus();
  }, 100);
};

/**
 * Handles search close.
 * @param setIsSearchOpen Callback to set search open state.
 * @param setSearchQuery Callback to set search query.
 */
export const handleSearchClose = (
  setIsSearchOpen: (open: boolean) => void,
  setSearchQuery: (query: string) => void
) => {
  setIsSearchOpen(false);
  setSearchQuery("");
};

/**
 * Handles search change.
 * @param e Change event.
 * @param setSearchQuery Callback to set search query.
 */
export const handleSearchChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setSearchQuery: (query: string) => void
) => {
  setSearchQuery(e.target.value);
};

/**
 * Handles search key down.
 * @param e Key down event.
 * @param handleSearchClose Callback to close search.
 */
export const handleSearchKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  handleSearchClose: () => void
) => {
  if (e.key === 'Escape') {
    handleSearchClose();
  }
};
