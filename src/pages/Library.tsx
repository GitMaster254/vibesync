import React, { Suspense, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileMusic,
  Plus,
  Upload,
  FolderOpen,
  Search,
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
import {PlaylistCard} from "@/components/PlaylistCard";
import {TrackCard} from "@/components/TrackCard";
import FolderManager from "@/components/FolderManager";
import { Track } from "@/lib/db";

export default function Library() {
  const [tab, setTab] = useState<"tracks" | "playlists" | "folder">("tracks");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canUseShowDirectoryPicker =
    typeof window !== "undefined" && "showDirectoryPicker" in window;

  // Handlers
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Enter a playlist name");
      return;
    }
    setPlaylists((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newPlaylistName },
    ]);
    setNewPlaylistName("");
    setIsDialogOpen(false);
    toast.success("Playlist created!");
  };

  const handleDeleteTrack = (track: Track) => {
    setTracks((prev) => prev.filter((t) => t.id !== track.id));
    
  };

  const handleToggleFavorite = (track: Track) => {
    
  };

  const loadTracks = () => {
    toast.success("Tracks loaded");
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

          {tab === "playlists" ? (
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

        {/* Tabs */}
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

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* PLAYLISTS */}
            {tab === "playlists" ? (
              playlists.length === 0 ? (
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
                  {playlists.map((playlist, index) => (
                    <motion.div
                      key={playlist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <PlaylistCard
                        playlist={playlist}
                        onClick={() =>
                          toast.info(`Open playlist ${playlist.name}`)
                        }
                      />
                    </motion.div>
                  ))}
                </div>
              )
            ) : tab === "tracks" ? (
              <>
                {/* Search Button */}
                <div className="flex justify-end mb-3">
                  <Button
                    variant="default"
                    size="icon"
                    className="rounded-full"
                    title="Search Tracks"
                    onClick={() =>
                      toast.info("Search feature coming soon!")
                    }
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>

                {tracks.length === 0 ? (
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
                    {tracks.map((track) => (
                      <Suspense
                        key={track.id}
                        fallback={
                          <div className="h-14 bg-muted/20 rounded-lg animate-pulse" />
                        }
                      >
                        <TrackCard
                          track={track}
                          tracks={tracks}
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Import Progress UI */}
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
