import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackCard } from '@/components/TrackCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Playlist, Track, getPlaylist, updatePlaylist, getAllTracks, getTrack, deletePlaylist, deleteTrack } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Playlist detail page - Shows tracks in a playlist and allows adding/removing
 */
export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadPlaylist();
      loadAllTracks();
    }
  }, [id]);

  const loadPlaylist = async () => {
    if (!id) return;
    
    try {
      const pl = await getPlaylist(id);
      if (!pl) {
        toast.error('Playlist not found');
        navigate('/library');
        return;
      }
      setPlaylist(pl);
      
      // Load tracks for this playlist
      const tracks = await Promise.all(
        pl.trackIds.map(trackId => getTrack(trackId))
      );
      setPlaylistTracks(tracks.filter(t => t !== undefined) as Track[]);
    } catch (error) {
      console.error('Failed to load playlist:', error);
      toast.error('Failed to load playlist');
    }
  };

  const loadAllTracks = async () => {
    try {
      const tracks = await getAllTracks();
      setAllTracks(tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;

    try {
      const updatedPlaylist = {
        ...playlist,
        trackIds: playlist.trackIds.filter(id => id !== trackId),
        updatedAt: new Date(),
      };
      
      await updatePlaylist(updatedPlaylist);
      toast.success('Track removed from playlist');
      loadPlaylist();
    } catch (error) {
      console.error('Failed to remove track:', error);
      toast.error('Failed to remove track');
    }
  };

  const handleDeleteTrackFromLibrary = async (trackId: string) => {
    if (!playlist) return;
    try {
      await deleteTrack(trackId);
      // Also remove from this playlist if present
      const updatedPlaylist = {
        ...playlist,
        trackIds: playlist.trackIds.filter(id => id !== trackId),
        updatedAt: new Date(),
      };
      await updatePlaylist(updatedPlaylist);
      toast.success('Track deleted from library');
      await loadPlaylist();
    } catch (error) {
      console.error('Failed to delete track:', error);
      toast.error('Failed to delete track');
    }
  };

  const handleAddTracks = async () => {
    if (!playlist || selectedTrackIds.length === 0) return;

    try {
      const newTrackIds = [...new Set([...playlist.trackIds, ...selectedTrackIds])];
      const updatedPlaylist = {
        ...playlist,
        trackIds: newTrackIds,
        updatedAt: new Date(),
      };
      
      await updatePlaylist(updatedPlaylist);
      toast.success(`Added ${selectedTrackIds.length} track${selectedTrackIds.length > 1 ? 's' : ''}`);
      setSelectedTrackIds([]);
      setIsAddDialogOpen(false);
      loadPlaylist();
    } catch (error) {
      console.error('Failed to add tracks:', error);
      toast.error('Failed to add tracks');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;

    if (confirm(`Delete "${playlist.name}"? This cannot be undone.`)) {
      try {
        await deletePlaylist(playlist.id);
        toast.success('Playlist deleted');
        navigate('/library');
      } catch (error) {
        console.error('Failed to delete playlist:', error);
        toast.error('Failed to delete playlist');
      }
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const availableTracks = allTracks.filter(
    track => !playlist?.trackIds.includes(track.id)
  );

  if (!playlist) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 pt-4">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/library')}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{playlist.name}</h1>
              <p className="text-sm text-muted-foreground">
                {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDeletePlaylist}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tracks */}
        {playlistTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
          >
            <p className="mb-4 text-sm text-muted-foreground">No tracks in this playlist</p>
            <Button variant="default" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tracks
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {playlistTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TrackCard
                  track={track}
                  tracks={playlistTracks}
                  onRemoveFromPlaylist={(t) => handleRemoveTrack(t.id)}
                  onDelete={(t) => handleDeleteTrackFromLibrary(t.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Tracks Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Tracks to {playlist.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4">
            {availableTracks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                All tracks are already in this playlist
              </p>
            ) : (
              <div className="space-y-2">
                {availableTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedTrackIds.includes(track.id)}
                      onCheckedChange={() => toggleTrackSelection(track.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{track.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {availableTracks.length > 0 && (
            <Button
              onClick={handleAddTracks}
              disabled={selectedTrackIds.length === 0}
              className="w-full"
            >
              Add {selectedTrackIds.length > 0 && `(${selectedTrackIds.length})`}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
