import React, { Suspense, useRef, useState, useMemo, useEffect } from "react";
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
import { Track } from "@/lib/db";

export default function Library() {
  const [tab, setTab] = useState<"tracks" | "playlists" | "folder">("tracks");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [importProgress, setImportProgress] = useState({
    active: false,
    total: 0,
    current: 0,
    fileName: "",
    errors: [],
  });
  const [importMinimized, setImportMinimized] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const canUseShowDirectoryPicker =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  useEffect(() => {
    loadTracks();
  }, []);
  // Filter playlists based on search query
  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    
    const query = searchQuery.toLowerCase();
    return playlists.filter(playlist => 
      playlist.name?.toLowerCase().includes(query)
    );
  }, [playlists, searchQuery]);

  // Filter tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    
    const query = searchQuery.toLowerCase();
    return tracks.filter(track => 
      track.title?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.album?.toLowerCase().includes(query)
    );
  }, [tracks, searchQuery]);

  // Check search states
  const hasPlaylistSearchResults = searchQuery.trim() && filteredPlaylists.length > 0;
  const noPlaylistSearchResults = searchQuery.trim() && filteredPlaylists.length === 0;
  const hasTrackSearchResults = searchQuery.trim() && filteredTracks.length > 0;
  const noTrackSearchResults = searchQuery.trim() && filteredTracks.length === 0;

  // Handlers
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Enter a playlist name");
      return;
    }
    
    const newPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      trackIds: [],
      description: "",
    };
    
    setPlaylists((prev) => [...prev, newPlaylist]);
    setNewPlaylistName("");
    setIsDialogOpen(false);
    toast.success("Playlist created!");
  };

  const handleDeleteTrack = (track: Track) => {
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
  };

  const handleToggleFavorite = (track: Track) => {
    // Toggle favorite status for the track
  };

const loadTracks = async () => {
  try {
    const { getAllTracks } = await import("@/lib/db");
    const loadedTracks = await getAllTracks();
    setTracks(loadedTracks);
    console.log('Loaded tracks from DB:', loadedTracks.length);
  } catch (error) {
    console.error('Failed to load tracks:', error);
    toast.error("Failed to load tracks");
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

  const PlaylistView = ({ playlist, onBack, tracks }) => {
    const playlistTracks = tracks.filter(track => 
      playlist.trackIds.includes(track.id)
    );

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
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{playlist.name}</h1>
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
                />
              </Suspense>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-40 pt-4 overflow-x-hidden">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Library</h1>
            <p className="text-sm text-muted-foreground">
              Your playlists, tracks, and folders
            </p>
          </div>

          {/* Search/Action Buttons */}
          {selectedPlaylist ? null : tab === "tracks" ? (
            <div className="flex items-center gap-2">
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
                  onClick={() => setTab("folder")}
                >
                  <FolderOpen className="mr-2 h-4 w-4" /> Manage folders…
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
                  Search results for "{searchQuery}"
                </span>
                <span className="text-xs text-muted-foreground">
                  {tab === "tracks" && `(${filteredTracks.length} tracks)`}
                  {tab === "playlists" && `(${filteredPlaylists.length} playlists)`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearchClose}
                className="h-8 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
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
                tracks={tracks}
              />
            ) : (
              <>
                {/* PLAYLISTS */}
                {tab === "playlists" ? (
                  <>
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
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                ) : tab === "tracks" ? (
                  <>
                    {noTrackSearchResults ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
                      >
                        <Search className="mb-4 h-16 w-16 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No tracks found</h3>
                        <p className="mb-4 text-sm text-muted-foreground text-center">
                          No tracks match "{searchQuery}"<br />
                          Try a different search term
                        </p>
                        <Button
                          variant="default"
                          onClick={handleSearchClose}
                        >
                          Clear Search
                        </Button>
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
                      <div className="space-y-2">
                        {filteredTracks.map((track) => (
                          <Suspense
                            key={track.id}
                            fallback={
                              <div className="h-14 bg-muted/20 rounded-lg animate-pulse" />
                            }
                          >
                            <TrackCard
                              track={track}
                              tracks={filteredTracks}
                              onToggleFavorite={handleToggleFavorite}
                              onDelete={handleDeleteTrack}
                            />
                          </Suspense>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
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

      {/* Import Progress UI - remains the same */}
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
