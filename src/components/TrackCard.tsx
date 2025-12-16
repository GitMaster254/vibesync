import { Heart, Play, Pause, MoreVertical, Trash2, X, Share, Plus, Check, SkipForward, FileText, Download } from 'lucide-react';
import { Track } from '@/lib/db';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/audio';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from './ui/checkbox';
import { useState } from 'react';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackCardProps {
  track: Track;
  tracks?: Track[]; // optional: parent might not pass full list
  // Playback
  onPlay?: (track: Track) => void; // <-- recommended shape (parent receives the track)
  // Lyrics
  onViewLyrics?: (track: Track) => void;
  // Library actions
  onToggleFavorite?: (track: Track) => void;
  onDelete?: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
  playlists: Playlist[];
  onToggleTrackInPlaylist: (playlistId: string, track: Track) => void;
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  isInSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (trackId: string) => void;
}

/**
 * Track card component for displaying song information.
 * Calls onPlay(track) when play action is triggered.
 */
export function TrackCard({
  track,
  tracks,
  onToggleFavorite,
  onDelete,
  isInSelectionMode = false,
  isSelected = false,
  onRemoveFromPlaylist,
  playlists = [],
  onToggleTrackInPlaylist,
  isTrackInPlaylist,
  onToggleSelection,
  onViewLyrics,
  onPlay,
}: TrackCardProps) {
  const { currentTrack, isPlaying, playTrack, setIsPlaying, playNext } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: track.title,
      text: `${track.title} by ${track.artist}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${track.title} by ${track.artist}`);
        // Optionally show a toast notification here
      } catch (error) {
        console.error("Failed to copy text to clipboard:", error);
      }
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // For Jamendo tracks, check for previewUrl (which contains download URL)
      // For local tracks, use fileUrl
      let downloadUrl = track.fileUrl;
      
      // Check if this is a Jamendo track with previewUrl (ExplorerTrack format)
      const jamendoTrack = track as any;
      if (jamendoTrack.previewUrl) {
        downloadUrl = jamendoTrack.previewUrl;
      }

      if (!downloadUrl) {
        throw new Error('No download URL available for this track');
      }

      // Fetch the audio file
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Create a filename with artist and title
      const filename = `${track.artist} - ${track.title}.mp3`
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('Download failed:', error);
      // You could add a toast notification here
    } finally {
      setIsDownloading(false);
      setIsBottomSheetOpen(false);
    }
  };

  const handlePlay = () => {
    if (onPlay) {
      onPlay(track);
    } else if (isCurrentTrack) {
      setIsPlaying(!isPlaying);
    } else {
      playTrack(track, tracks);
    }
  };

  const handlePlayNext = () => {
    // Add track to play next in queue
    playNext?.(track);
    setIsBottomSheetOpen(false);
  };

  const handleDeleteFromDevice = () => {
    onDelete?.(track);
    setIsBottomSheetOpen(false);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsBottomSheetOpen(true);
  };

  const handleCardClick = () => {
    if (isInSelectionMode) {
      onToggleSelection(track.id);
    } else {
      handlePlay();
    }
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 transition-all hover:bg-muted/50 overflow-hidden cursor-pointer',
          isCurrentTrack && 'bg-muted/50',
          isSelected && 'bg-primary/10'
        )}
        onClick={handleCardClick}
      >
        {/* Album art / Play button */}
        <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
          {track.coverArt ? (
            <img
              src={track.coverArt}
              alt={`${track.title} cover`}
              className="h-full w-full rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full rounded-lg bg-gradient-primary" />
          )}
          {!isInSelectionMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className={cn(
                'absolute inset-0 h-full w-full bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100',
                isCurrentTrack && isPlaying && 'opacity-100'
              )}
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="h-6 w-6 text-white" fill="white" />
              ) : (
                <Play className="h-6 w-6 text-white" fill={isCurrentTrack && !isPlaying ? 'white' : 'none'} />
              )}
            </Button>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className={cn(
            'truncate font-semibold text-sm break-all line-clamp-1',
            isCurrentTrack && 'text-primary'
          )}>
            {track.title}
          </p>
          <p className="truncate text-xs text-muted-foreground break-all line-clamp-1">
            {[track.artist, track.album].filter(Boolean).join(' • ')} • {formatTime(track.duration)}
          </p>
        </div>

        {/* Checkbox in selection mode */}
        {isInSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(track.id)}
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Actions - Lyrics and More button */}
        {!isInSelectionMode && (
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            {/* Lyrics Button */}
            {onViewLyrics && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLyrics(track);
                }}
                title="View lyrics"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleMoreClick}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Sheet for Track Options */}
      <Sheet open={isBottomSheetOpen} onOpenChange={setIsBottomSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-lg">
          {/* Custom Header with Track Info */}
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
            {/* Album Artwork */}
            <div className="h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden">
              {track.coverArt ? (
                <img
                  src={track.coverArt}
                  alt={`${track.title} cover`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-gradient-primary" />
              )}
            </div>
            
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{track.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Play */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                handlePlay();
                setIsBottomSheetOpen(false);
              }}
            >
              {isCurrentTrack && isPlaying ? (
                <Pause className="mr-2 h-4 w-4" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
            </Button>

            {/* Play Next */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handlePlayNext}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Play Next
            </Button>

            {/* Download */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>

            {/* Add to Playlist */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Playlist
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[12rem]">
                {playlists?.length > 0 ? (
                  playlists.map((playlist) => (
                    <DropdownMenuItem
                      key={playlist.id}
                      onClick={() => {
                        onToggleTrackInPlaylist(playlist.id, track);
                        setIsBottomSheetOpen(false);
                      }}
                    >
                      <Check className={cn(
                        'mr-2 h-4 w-4',
                        isTrackInPlaylist(playlist.id, track.id) ? 'opacity-100' : 'opacity-0'
                      )} />
                      {playlist.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>
                    No playlists available
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share */}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                handleShare();
                setIsBottomSheetOpen(false);
              }}
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>

            {/* Remove from Playlist (if applicable) */}
            {onRemoveFromPlaylist && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-orange-600 hover:text-orange-600"
                  onClick={() => {
                    onRemoveFromPlaylist(track);
                    setIsBottomSheetOpen(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove from Playlist
                </Button>
              </>
            )}

            {/* Delete from Device */}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-600"
                  onClick={handleDeleteFromDevice}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete from Device
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}