import React, { Suspense, useRef, useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileMusic,
  Plus,
  Upload,
  FolderOpen,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PlaylistCard } from "@/components/PlaylistCard";
import { TrackCard } from "@/components/TrackCard";
import FolderManager from "@/components/FolderManager";
import { importFilesWithProgress } from "@/lib/importWithProgress";
import { Track } from "@/lib/db";
import { Playlist } from "@/components/TrackCard";
import {
  loadPlaylistsFromStorage,
  savePlaylistsToStorage,
  filterAndSortPlaylists,
  filterAndSortTracks,
  getAllFilesFromDirectory,
  createPlaylist,
  deletePlaylist,
  toggleTrackInPlaylist,
  isTrackInPlaylist,
  deleteTrack,
  handleFileImport,
  handleFolderImport,
  handleSearchClick,
  handleSearchClose,
  handleSearchChange,
  handleSearchKeyDown,
  AppTrack,
} from "@/lib/libraryFunctions";

export default function Library() {
  const [tab, setTab] = useState<"tracks" | "playlists" | "folder">("tracks");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  // Type updated to use the new Playlist interface
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [importProgress, setImportProgress] = useState({
    active: false,
    total: 0,
    current: 0,
    fileName: "",
    errors: [] as string[],
  });
  const [importMinimized, setImportMinimized] = useState(false);
  // Initial state uses the local storage loading function
  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylistsFromStorage);
  // Type updated to use the new AppTrack interface
  const [tracks, setTracks] = useState<AppTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const canUseShowDirectoryPicker =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  // --- START: Persistence & Sorting Effects ---

  // 1. Persist playlists across page refreshes
  useEffect(() => {
    savePlaylistsToStorage(playlists);
  }, [playlists]);

  useEffect(() => {
    loadTracks();
  }, []);

  // Use a callback for track loading
  const loadTracks = useCallback(async () => {
    try {
      const { getAllTracks } = await import("@/lib/db");
      const loadedTracks = await getAllTracks() as AppTrack[];
      // The sorting logic is applied here
      const sortedTracks = loadedTracks.sort((a, b) => a.title.localeCompare(b.title));
      setTracks(sortedTracks);
      console.log('Loaded and sorted tracks from DB:', sortedTracks.length);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      toast.error("Failed to load tracks");
    }
  }, []); // Empty dependency array means this function is created once

  // --- END: Persistence & Sorting Effects ---

  // --- START: Sorting Logic in useMemo ---

  // 2. Show tracks and playlists in alphabetical order

  // Sorted list of playlists (already filtered)
  const filteredPlaylists = useMemo(() => filterAndSortPlaylists(playlists, searchQuery), [playlists, searchQuery]);

  // Sorted list of tracks (already filtered)
  const filteredTracks = useMemo(() => filterAndSortTracks(tracks, searchQuery), [tracks, searchQuery]);

  // Check search states
  const noPlaylistSearchResults = searchQuery.trim() && filteredPlaylists.length === 0;
  const noTrackSearchResults = searchQuery.trim() && filteredTracks.length === 0;

  // --- END: Sorting Logic in useMemo ---


  // --- START: Playlist Management Handlers ---

  const updatePlaylistsState = (newPlaylists: Playlist[]) => {
    // This helper centralizes state update and local storage saving
    setPlaylists(newPlaylists);
    savePlaylistsToStorage(newPlaylists);
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Enter a playlist name");
      return;
    }
    
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: newPlaylistName.trim(),
      trackIds: [],
      description: "",
      createdAt: new Date(Date.now().toString()),
      updatedAt: new Date(Date.now().toString()),
    };
    
    // Use helper to update state and storage
    updatePlaylistsState([...playlists, newPlaylist]);
    setNewPlaylistName("");
    setIsDialogOpen(false);
    toast.success("Playlist created!");
  };

  const handleDeletePlaylist = (playlistId: string) => {
    const newPlaylists = playlists.filter((p) => p.id !== playlistId);
    updatePlaylistsState(newPlaylists);
    toast.success("Playlist deleted!");
  };

  // 3. Allow adding/removing tracks from playlists.
  const handleToggleTrackInPlaylist = (playlistId: string, track: AppTrack) => {
    const newPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        const trackIndex = playlist.trackIds.indexOf(track.id);
        
        let newTrackIds;
        if (trackIndex > -1) {
          // Track is already in the playlist, so remove it
          newTrackIds = playlist.trackIds.filter(id => id !== track.id);
          toast.info(`Removed "${track.title}" from "${playlist.name}"`);
        } else {
          // Track is not in the playlist, so add it
          newTrackIds = [...playlist.trackIds, track.id];
          toast.success(`Added "${track.title}" to "${playlist.name}"`);
        }

        return {
          ...playlist,
          trackIds: newTrackIds,
        };
      }
      return playlist;
    });

    // Update the state and local storage
    updatePlaylistsState(newPlaylists);

    // If we're viewing the playlist being modified, update the view immediately
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
        // Find the newly updated playlist object and set it as selected
        const updatedSelected = newPlaylists.find(p => p.id === playlistId);
        if (updatedSelected) {
            setSelectedPlaylist(updatedSelected);
        }
    }
  };

  // Function to check if a track is in a playlist
  const isTrackInPlaylist = (playlistId: string, trackId: string): boolean => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist ? playlist.trackIds.includes(trackId) : false;
  };

  // --- END: Playlist Management Handlers ---

  // Other Handlers (minimal changes)
  const handleDeleteTrack = (track: AppTrack) => {
    // 1. Remove the track from the main tracks state
    setTracks((prev) => prev.filter((t) => t.id !== track.id));

    // 2. Remove the track ID from all playlists
    const newPlaylists = playlists.map((playlist) => ({
        ...playlist,
        trackIds: playlist.trackIds.filter(id => id !== track.id)
    }));
    updatePlaylistsState(newPlaylists);

    toast.success(`Track "${track.title}" deleted.`);
  };

  const handleToggleFavorite = () => {
    // Toggle favorite status for the track (implementation is external/placeholder)
  };

  // Folder import helper function (kept as is)
  const getAllFilesFromDirectory = async (dirHandle: any) => {
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

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    console.log('Starting import of', files.length, 'files:', files.map(f => f.name));

    setImportProgress({
      active: true,
      total: files.length,
      current: 0,
      fileName: "Starting import...",
      errors: []
    });

    try {
      await importFilesWithProgress(files, (progress: any) => {
        setImportProgress(prev => ({ ...prev, ...progress }));
      });

      console.log('Import completed successfully');
      await loadTracks();
      toast.success(`Successfully imported ${files.length} files`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Import process finished');
      setImportProgress(prev => ({ ...prev, active: false }));
    }
  };

  const handleFolderImport = async () => {
    if (!canUseShowDirectoryPicker) {
      toast.error("Folder selection is not supported in your browser");
      return;
    }

    try {
      const directoryHandle = await (window as any).showDirectoryPicker();
      const files = await getAllFilesFromDirectory(directoryHandle);
      
      if (files.length === 0) {
        toast.error("No audio files found in the selected folder");
        return;
      }

      setImportProgress({
        active: true,
        total: files.length,
        current: 0,
        fileName: "",
        errors: []
      });

      await importFilesWithProgress(files, (progress: any) => {
        setImportProgress(prev => ({ ...prev, ...progress }));
      });
      
      await loadTracks();
      toast.success(`Imported ${files.length} files from folder`);
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        toast.error("Failed to import folder");
      }
    } finally {
      setImportProgress(prev => ({ ...prev, active: false }));
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleSearchClose();
    }
  };

  // --- START: Updated PlaylistView Component ---

  // The PlaylistView component now filters tracks and sorts them by title.
  const PlaylistView = ({ playlist, onBack, allTracks }: { playlist: Playlist, onBack: () => void, allTracks: AppTrack[] }) => {
    // Filter and then sort tracks by title
    const playlistTracks = useMemo(() => {
        return allTracks
            .filter(track => playlist.trackIds.includes(track.id))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [playlist.trackIds, allTracks]);

    // Handler to remove a track from the current playlist
    const handleRemoveTrackFromPlaylist = (track: AppTrack) => {
        handleToggleTrackInPlaylist(playlist.id, track);
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
            title="Back to Playlists"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold truncate max-w-[200px] sm:max-w-full">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground">
              {playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'}
            </p>
          </div>
        </div>

        {/* Playlist Tracks */}
        {playlistTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
          >
            <FileMusic className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No tracks in playlist</h3>
            <p className="mb-4 text-sm text-muted-foreground text-center">
              Add tracks to this playlist to see them here
            </p>
            <Button
              variant="default"
              onClick={() => {
                onBack();
                setTab("tracks");
              }}
            >
              Browse Tracks
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {playlistTracks.map((track) => (
              <Suspense
                key={track.id}
                fallback={
                  <div className="h-14 bg-muted/20 rounded-lg animate-pulse" />
                }
              >
          <TrackCard
            track={track}
            tracks={playlistTracks}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteTrack}
            // Pass the remove function specific to the playlist view
            onRemoveFromPlaylist={handleRemoveTrackFromPlaylist}
            playlists={playlists} // Pass all playlists for the add-to-playlist dropdown
            onToggleTrackInPlaylist={handleToggleTrackInPlaylist} // Pass the toggle function
            isTrackInPlaylist={isTrackInPlaylist}
            isInSelectionMode={false}
            isSelected={false}
            onToggleSelection={() => {}}
          />
              </Suspense>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // --- END: Updated PlaylistView Component ---

  // --- START: PlaylistCard Update ---
  // The PlaylistCard component needs to be updated to accept the handleDeletePlaylist prop.

  // The main list of TrackCard components needs to be updated to support
  // adding/removing tracks from playlists.

  const TrackList = ({ trackList, allPlaylists }: { trackList: AppTrack[], allPlaylists: Playlist[] }) => (
    <div className="space-y-2">
      {trackList.map((track) => (
        <Suspense
          key={track.id}
          fallback={
            <div className="h-14 bg-muted/20 rounded-lg animate-pulse" />
          }
        >
          <TrackCard
            track={track}
            tracks={trackList}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteTrack}
            playlists={allPlaylists} // Pass all playlists
            onToggleTrackInPlaylist={handleToggleTrackInPlaylist} // Pass the toggle function
            isTrackInPlaylist={isTrackInPlaylist}
            isInSelectionMode={false}
            isSelected={false}
            onToggleSelection={() => {}}
            // onRemoveFromPlaylist is only passed in PlaylistView
          />
        </Suspense>
      ))}
    </div>
  );
  
  // --- END: PlaylistCard Update ---


  return (
    <div className="min-h-screen pb-40 pt-4 overflow-x-hidden">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Library</h1>
          </div>

          {/* Search/Action Buttons - Conditional logic remains the same */}
          {selectedPlaylist ? null : tab === "tracks" ? (
            <div className="flex items-center gap-2">
              {/* Search UI */}
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-background border border-input rounded-full px-3 py-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search tracks..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="border-0 bg-transparent h-8 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-32 sm:w-40"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={handleSearchClose}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full"
                  title="Search Tracks"
                  onClick={handleSearchClick}
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>
          ) : tab === "playlists" ? (
            <div className="flex items-center gap-2">
              {/* Search UI for playlists */}
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-background border border-input rounded-full px-3 py-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search playlists..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="border-0 bg-transparent h-8 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-32 sm:w-40"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full"
                    onClick={handleSearchClose}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    title="Search Playlists"
                    onClick={handleSearchClick}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  {/* Create Playlist Dialog */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className="rounded-full"
                        title="Create Playlist"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Playlist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Playlist name"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleCreatePlaylist()
                          }
                        />
                        <Button onClick={handleCreatePlaylist} className="w-full">
                          Create
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          ) : (
            /* Import Dropdown for 'folder' tab */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full"
                  title="Import"
                >
                  <Upload className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload files…
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canUseShowDirectoryPicker}
                  onClick={handleFolderImport}
                >
                  <FolderOpen className="mr-2 h-4 w-4" /> Upload folders…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Search Info Bar */}
        {searchQuery.trim() && !selectedPlaylist && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                "{searchQuery}"
                </span>
                <span className="text-xs text-muted-foreground">
                  {tab === "tracks" && `(${filteredTracks.length} tracks)`}
                  {tab === "playlists" && `(${filteredPlaylists.length} playlists)`}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs - Only show when not viewing a playlist */}
        {!selectedPlaylist && (
          <div className="mb-4 flex items-center gap-2">
            <Button
              variant={tab === "tracks" ? "default" : "outline"}
              onClick={() => setTab("tracks")}
            >
              Tracks
            </Button>
            <Button
              variant={tab === "playlists" ? "default" : "outline"}
              onClick={() => setTab("playlists")}
            >
              Playlists
            </Button>
            <Button
              variant={tab === "folder" ? "default" : "outline"}
              onClick={() => setTab("folder")}
            >
              Folders
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlaylist ? `playlist-${selectedPlaylist.id}` : tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Show playlist view if a playlist is selected */}
            {selectedPlaylist ? (
              <PlaylistView 
                playlist={selectedPlaylist}
                onBack={() => setSelectedPlaylist(null)}
                allTracks={tracks} // Pass all tracks to the view
              />
            ) : (
              <>
                {/* PLAYLISTS TAB */}
                {tab === "playlists" ? (
                  <>
                    {/* Search/Empty/List logic for playlists (remains similar) */}
                    {noPlaylistSearchResults ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
                      >
                        <Search className="mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No playlists found</h3>
                        <p className="mb-4 text-sm text-muted-foreground text-center">
                          No playlists match "{searchQuery}"<br />
                          Try a different search term
                        </p>
                        <Button
                          variant="default"
                          onClick={handleSearchClose}
                        >
                          Clear Search
                        </Button>
                      </motion.div>
                    ) : filteredPlaylists.length === 0 && !searchQuery ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
                      >
                        <FileMusic className="mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No playlists yet</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Create your first playlist to organize your music
                        </p>
                        <Button
                          variant="default"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Playlist
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {filteredPlaylists.map((playlist, index) => (
                          <motion.div
                            key={playlist.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.06 }}
                          >
                            <PlaylistCard
                              playlist={playlist}
                              onClick={() => setSelectedPlaylist(playlist)}
                              // Pass the delete handler
                              onDelete={() => handleDeletePlaylist(playlist.id)}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                ) : tab === "tracks" ? (
                  <>
                    {/* Search/Empty/List logic for tracks (remains similar) */}
                    {noTrackSearchResults ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
                      >
                        <Search className="mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No tracks found</h3>
    
                      </motion.div>
                    ) : filteredTracks.length === 0 && !searchQuery ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
                      >
                        <FileMusic className="mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                          No tracks yet
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Import music to get started.
                        </p>
                      </motion.div>
                    ) : (
                      <TrackList trackList={filteredTracks} allPlaylists={playlists} />
                    )}
                  </>
                ) : (
                  /* FOLDER TAB */
                  <FolderManager
                    onTracksUpdate={loadTracks}
                    importProgress={importProgress}
                    setImportProgress={setImportProgress}
                    onTracksUpload={loadTracks}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="audio/*"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
      {/* Import Progress UI (kept as is) */}
      {importProgress.active && (
        importMinimized ? (
          <div
            className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 bg-card rounded-full shadow-lg px-4 py-2 flex items-center gap-3 cursor-pointer"
            onClick={() => setImportMinimized(false)}
            aria-label="Restore import modal"
          >
            <FileMusic
              className="h-5 w-5 text-primary animate-spin"
              aria-hidden="true"
            />
            <span className="text-xs font-medium">
              Importing {importProgress.current}/{importProgress.total}
            </span>
            {importProgress.fileName && (
              <span className="text-xs text-primary truncate max-w-[150px]">
                {importProgress.fileName}
              </span>
            )}
            <Progress
              value={Math.round(
                (importProgress.current / importProgress.total) * 100
              )}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground ml-2">
              Tap to restore
            </span>
          </div>
        ) : (
          <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 bg-card rounded-full shadow-lg px-4 py-2 flex items-center gap-3 min-w-[220px] max-w-[90vw]">
            <FileMusic
              className="h-5 w-5 text-primary animate-spin"
              aria-hidden="true"
            />
            <span className="text-xs font-medium">
              Importing {importProgress.current}/{importProgress.total}
            </span>
            {importProgress.fileName && (
              <span className="text-xs text-primary truncate max-w-[120px]">
                {importProgress.fileName}
              </span>
            )}
            <Progress
              value={Math.round(
                (importProgress.current / importProgress.total) * 100
              )}
              className="w-20"
            />
            {importProgress.errors && importProgress.errors.length > 0 && (
              <span className="text-xs text-destructive ml-2">
                {importProgress.errors.length} error(s)
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportMinimized(true)}
              className="ml-2 text-xs"
            >
              Minimize
            </Button>
          </div>
        )
      )}
    </div>
  );
}
