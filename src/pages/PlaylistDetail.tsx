import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit3, Check, X, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackCard } from '@/components/TrackCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Playlist, Track, getPlaylist, updatePlaylist, getAllTracks, getTrack, deletePlaylist, deleteTrack, getAllPlaylists } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [allPlaylists, setAllPlaylists] = useState<Playlist[]>([]);
  const [isInSelectionMode, setIsInSelectionMode] = useState(false);
  const [selectedTrackIdsForSelection, setSelectedTrackIdsForSelection] = useState<string[]>([]);
  const [isAddToPlaylistsDialogOpen, setIsAddToPlaylistsDialogOpen] = useState(false);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      loadPlaylist();
      loadAllTracks();
      loadAllPlaylists();
    }
  }, [id]);

  useEffect(() => {
    if (playlist) {
      setEditName(playlist.name);
      setEditDescription(playlist.description || '');
    }
  }, [playlist]);

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

  const loadAllPlaylists = async () => {
    try {
      const playlists = await getAllPlaylists();
      setAllPlaylists(playlists);
    } catch (error) {
      console.error('Failed to load playlists:', error);
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

  // Handle playlist editing
  const handleEditPlaylist = async () => {
    if (!playlist || !editName.trim()) return;

    try {
      const updatedPlaylist = {
        ...playlist,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        updatedAt: new Date(),
      };

      await updatePlaylist(updatedPlaylist);
      setPlaylist(updatedPlaylist);
      setIsEditing(false);
      toast.success('Playlist updated');
    } catch (error) {
      console.error('Failed to update playlist:', error);
      toast.error('Failed to update playlist');
    }
  };

  const handleCancelEdit = () => {
    setEditName(playlist?.name || '');
    setEditDescription(playlist?.description || '');
    setIsEditing(false);
  };

  const onToggleTrackInPlaylist = async (playlistId: string, track: Track) => {
    const targetPlaylist = allPlaylists.find(p => p.id === playlistId);
    if (!targetPlaylist) return;

    const isInPlaylist = targetPlaylist.trackIds.includes(track.id);
    let updatedTrackIds: string[];

    if (isInPlaylist) {
      // Remove track from playlist
      updatedTrackIds = targetPlaylist.trackIds.filter(id => id !== track.id);
    } else {
      // Add track to playlist
      updatedTrackIds = [...targetPlaylist.trackIds, track.id];
    }

    const updatedPlaylist = {
      ...targetPlaylist,
      trackIds: updatedTrackIds,
      updatedAt: new Date(),
    };

    try {
      await updatePlaylist(updatedPlaylist);
      toast.success(isInPlaylist ? 'Track removed from playlist' : 'Track added to playlist');
      loadAllPlaylists(); // Refresh playlists
    } catch (error) {
      console.error('Failed to update playlist:', error);
      toast.error('Failed to update playlist');
    }
  };

  const isTrackInPlaylist = (playlistId: string, trackId: string) => {
    const targetPlaylist = allPlaylists.find(p => p.id === playlistId);
    return targetPlaylist ? targetPlaylist.trackIds.includes(trackId) : false;
  };

  const onToggleSelection = (trackId: string) => {
    setSelectedTrackIdsForSelection(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleAddToPlaylists = async () => {
    if (selectedTrackIdsForSelection.length === 0 || selectedPlaylistIds.length === 0) return;

    try {
      const selectedTracks = playlistTracks.filter(track => selectedTrackIdsForSelection.includes(track.id));

      for (const playlistId of selectedPlaylistIds) {
        const targetPlaylist = allPlaylists.find(p => p.id === playlistId);
        if (!targetPlaylist) continue;

        const newTrackIds = [...new Set([...targetPlaylist.trackIds, ...selectedTrackIdsForSelection])];
        const updatedPlaylist = {
          ...targetPlaylist,
          trackIds: newTrackIds,
          updatedAt: new Date(),
        };

        await updatePlaylist(updatedPlaylist);
      }

      toast.success(`Added ${selectedTrackIdsForSelection.length} track${selectedTrackIdsForSelection.length > 1 ? 's' : ''} to ${selectedPlaylistIds.length} playlist${selectedPlaylistIds.length > 1 ? 's' : ''}`);
      setSelectedTrackIdsForSelection([]);
      setSelectedPlaylistIds([]);
      setIsAddToPlaylistsDialogOpen(false);
      setIsInSelectionMode(false);
      loadAllPlaylists();
    } catch (error) {
      console.error('Failed to add tracks to playlists:', error);
      toast.error('Failed to add tracks to playlists');
    }
  };

  const togglePlaylistSelection = (playlistId: string) => {
    setSelectedPlaylistIds(prev =>
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = playlistTracks.findIndex(track => track.id === active.id);
    const newIndex = playlistTracks.findIndex(track => track.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTracks = arrayMove(playlistTracks, oldIndex, newIndex);
    setPlaylistTracks(reorderedTracks);

    // Update playlist trackIds
    if (playlist) {
      const newTrackIds = reorderedTracks.map(track => track.id);
      const updatedPlaylist = {
        ...playlist,
        trackIds: newTrackIds,
        updatedAt: new Date(),
      };

      try {
        await updatePlaylist(updatedPlaylist);
        setPlaylist(updatedPlaylist);
        toast.success('Track order updated');
      } catch (error) {
        console.error('Failed to update track order:', error);
        toast.error('Failed to update track order');
        // Revert the local state on error
        loadPlaylist();
      }
    }
  };

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
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Playlist name"
                    className="text-3xl font-bold h-auto p-0 border-none focus-visible:ring-0 bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditPlaylist();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Playlist description (optional)"
                    className="text-sm text-muted-foreground resize-none border-none focus-visible:ring-0 bg-transparent p-0"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditPlaylist}>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold">{playlist.name}</h1>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  title="Edit playlist"
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAddDialogOpen(true)}
                title="Add tracks"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsInSelectionMode(!isInSelectionMode)}
                title="Select tracks"
              >
                <ListChecks className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDeletePlaylist}
                title="Delete playlist"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection Mode Header */}
        {isInSelectionMode && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedTrackIdsForSelection.length} track{selectedTrackIdsForSelection.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTrackIdsForSelection([]);
                  setIsInSelectionMode(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setIsAddToPlaylistsDialogOpen(true)}
                disabled={selectedTrackIdsForSelection.length === 0}
              >
                Add to Playlists
              </Button>
            </div>
          </div>
        )}

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
                className={isInSelectionMode ? 'relative' : ''}
              >
                {isInSelectionMode && (
                  <div className="absolute left-2 top-2 z-10">
                    <Checkbox
                      checked={selectedTrackIdsForSelection.includes(track.id)}
                      onCheckedChange={() => onToggleSelection(track.id)}
                    />
                  </div>
                )}
                <TrackCard
                  track={track}
                  tracks={playlistTracks}
                  onRemoveFromPlaylist={(t) => handleRemoveTrack(t.id)}
                  onDelete={(t) => handleDeleteTrackFromLibrary(t.id)}
                  playlists={allPlaylists.map(pl => ({
                    ...pl,
                    description: pl.description ?? ''
                  }))}
                  onToggleTrackInPlaylist={onToggleTrackInPlaylist}
                  isTrackInPlaylist={isTrackInPlaylist}
                  isInSelectionMode={isInSelectionMode}
                  onToggleSelection={onToggleSelection}
                  isSelected={selectedTrackIdsForSelection.includes(track.id)}
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

      {/* Add to Playlists Dialog */}
      <Dialog open={isAddToPlaylistsDialogOpen} onOpenChange={setIsAddToPlaylistsDialogOpen}>
        <DialogContent className="max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Selected Tracks to Playlists</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] pr-4">
            {allPlaylists.filter(p => p.id !== playlist.id).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No other playlists available
              </p>
            ) : (
              <div className="space-y-2">
                {allPlaylists.filter(p => p.id !== playlist.id).map((pl) => (
                  <div
                    key={pl.id}
                    className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedPlaylistIds.includes(pl.id)}
                      onCheckedChange={() => togglePlaylistSelection(pl.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold">{pl.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {allPlaylists.filter(p => p.id !== playlist.id).length > 0 && (
            <Button
              onClick={handleAddToPlaylists}
              disabled={selectedPlaylistIds.length === 0}
              className="w-full"
            >
              Add to {selectedPlaylistIds.length > 0 && `(${selectedPlaylistIds.length})`} Playlist{selectedPlaylistIds.length !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
