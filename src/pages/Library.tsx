import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileMusic, Plus, Upload, FolderOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Playlist, getAllPlaylists, addPlaylist, getAllTracks, Track, updateTrack, deleteTrack } from '@/lib/db';
import { importFilesWithWorker, type ImportProgress } from '@/lib/importWithProgress';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { PlaylistCard } from '@/components/PlaylistCard';
import FolderManager from '@/components/FolderManager';
const TrackCard = lazy(() => import('@/components/TrackCard').then(m => ({ default: m.TrackCard })));

/**
 * Library page - Playlist and folder management
 */
export default function Library() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tab, setTab] = useState<'playlists' | 'tracks' | 'folder'>('tracks');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const canUseShowDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const [tracks, setTracks] = useState<Track[]>([]);
  const [importProgress, setImportProgress] = useState<ImportProgress>({ active: false, total: 0, current: 0 });
  const [importMinimized, setImportMinimized] = useState(false);

  useEffect(() => {
    loadPlaylists();
    loadTracks();
    
  }, []);

  // Initialize the active tab from the query string if provided (e.g., ?tab=tracks)
  useEffect(() => {
    const initialTab = searchParams.get('tab');
    if (initialTab === 'tracks' || initialTab === 'playlists' || initialTab === 'folder') {
      setTab(initialTab);
    }
  }, [searchParams]);

  const loadPlaylists = async () => {
    try {
      const allPlaylists = await getAllPlaylists();
      setPlaylists(allPlaylists);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    }
  };

  const loadTracks = async () => {
    try {
      const all = await getAllTracks();
      all.sort((a, b) => a.title.localeCompare(b.title));
      setTracks(all);
    } catch (e) {
      console.error('Failed to load tracks', e);
    }
  };

  async function handleToggleFavorite(track: Track): Promise<void> {
    try {
      const updatedTrack = { ...track, favorite: !track.favorite };
      await updateTrack(updatedTrack);
      setTracks(prev => prev.map(t => (t.id === track.id ? updatedTrack : t)));
      toast.success(updatedTrack.favorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite');
    }
  }

  async function handleDeleteTrack(track: Track): Promise<void> {
    try {
      await deleteTrack(track.id);
      setTracks(prev => prev.filter(t => t.id !== track.id));
      toast.success('Deleted from library');
    } catch (error) {
      console.error('Failed to delete track:', error);
      toast.error('Failed to delete track');
    }
  }

  return (
    <div className="min-h-screen pb-40 pt-4 overflow-x-hidden">
      <div className="container mx-auto max-w-2xl px-3 sm:px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Library</h1>
            <p className="text-sm text-muted-foreground">Your playlists, tracks, and folders</p>
          </div>

          {tab === 'playlists' ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="icon" className="rounded-full" title="Create Playlist">
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
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
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
                <Button variant="default" size="icon" className="rounded-full" title="Import">
                  <Upload className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" /> Upload files…
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!canUseShowDirectoryPicker}
                  onClick={() => setTab('folder')}
                >
                  <FolderOpen className="mr-2 h-4 w-4" /> Manage folders…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2">
          <Button variant={tab === 'tracks' ? 'default' : 'outline'} onClick={() => setTab('tracks')}>
            Tracks
          </Button>
          <Button variant={tab === 'playlists' ? 'default' : 'outline'} onClick={() => setTab('playlists')}>
            Playlists
          </Button>
          <Button variant={tab === 'folder' ? 'default' : 'outline'} onClick={() => setTab('folder')}>
            Folders
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {tab === 'playlists' ? (
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
                  <Button variant="default" onClick={() => setIsDialogOpen(true)}>
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
                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              )
            ) : tab === 'tracks' ? (
              tracks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
                >
                  <FileMusic className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold">No tracks yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Import music to get started.</p>
                </motion.div>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <Suspense key={track.id} fallback={<div className="h-14 bg-muted/20 rounded-lg animate-pulse" />}>
                      <TrackCard
                        track={track}
                        tracks={tracks}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeleteTrack}
                      />
                    </Suspense>
                  ))}
                </div>
              )
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

      {/* Minimal Import Progress Bar */}
      {importProgress.active && (
        <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 bg-card rounded-full shadow-lg px-4 py-2 flex items-center gap-3 min-w-[220px] max-w-[90vw]">
          <FileMusic className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />
          <span className="text-xs font-medium">Importing {importProgress.current}/{importProgress.total}</span>
          {importProgress.fileName && (
            <span className="text-xs text-primary truncate max-w-[120px]">{importProgress.fileName}</span>
          )}
          <Progress value={Math.round((importProgress.current / importProgress.total) * 100)} className="w-20" />
          {importProgress.errors && importProgress.errors.length > 0 && (
            <span className="text-xs text-destructive ml-2">{importProgress.errors.length} error(s)</span>
          )}
        </div>
      )}

      {/* Floating minimized import status bar */}
      {importProgress.active && importMinimized && (
        <div 
          className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 bg-card rounded-full shadow-lg px-4 py-2 flex items-center gap-3 cursor-pointer" 
          onClick={() => setImportMinimized(false)} 
          aria-label="Restore import modal"
        >
          <FileMusic className="h-5 w-5 text-primary animate-spin" aria-hidden="true" />
          <span className="text-xs font-medium">Importing {importProgress.current}/{importProgress.total}</span>
          {importProgress.fileName && (
            <span className="text-xs text-primary truncate max-w-[150px]">{importProgress.fileName}</span>
          )}
          <Progress value={Math.round((importProgress.current / importProgress.total) * 100)} className="w-20" />
          <span className="text-xs text-muted-foreground ml-2">Tap to restore</span>
        </div>
      )}

      {/* File Input for Individual Tracks */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={async (e) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          const target = e.currentTarget;
          const fileArray = Array.from(files);
          let capturedErrors: { fileName: string; error: string }[] = [];
          try {
            await importFilesWithWorker(
              fileArray,
              (progress) => {
                setImportProgress(progress);
                if (progress.errors && progress.errors.length > 0) {
                  capturedErrors = [...progress.errors];
                }
              },
              () => {
                loadTracks();
              }
            );
            const duplicates = capturedErrors.filter(err => err.error.includes('duplicate'));
            if (duplicates.length > 0) {
              duplicates.forEach(err => {
                toast.warning(`${err.fileName}: ${err.error}`);
              });
            }
            const nonDuplicateErrors = capturedErrors.filter(err => !err.error.includes('duplicate'));
            if (nonDuplicateErrors.length > 0) {
              toast.error(`Import had ${nonDuplicateErrors.length} error(s)`);
            } else if (duplicates.length === 0) {
              toast.success('Import completed');
            } else if (duplicates.length < fileArray.length) {
              toast.success(`Import completed (${duplicates.length} duplicate(s) skipped)`);
            }
          } catch (err) {
            console.error('Import failed', err);
            toast.error('Import failed');
          } finally {
            if (target) target.value = '';
          }
        }}
        className="hidden"
      />
    </div>
  );

  async function handleCreatePlaylist() {
    if (!newPlaylistName.trim()) {
      toast.error('Please enter a playlist name');
      return;
    }

    const duplicateName = playlists.some(
      pl => pl.name.toLowerCase() === newPlaylistName.trim().toLowerCase()
    );
    
    if (duplicateName) {
      toast.error('A playlist with this name already exists');
      return;
    }

    try {
      const playlist: Playlist = {
        id: uuidv4(),
        name: newPlaylistName.trim(),
        trackIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addPlaylist(playlist);
      toast.success('Playlist created');
      setNewPlaylistName('');
      setIsDialogOpen(false);
      loadPlaylists();
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
    }
  }
}