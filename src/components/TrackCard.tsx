import { Heart, Play, Pause, MoreVertical, Trash2, X, Share, Plus, Check} from 'lucide-react';
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
  , } from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from './ui/checkbox';
import { useState, useRef } from 'react';

export interface Playlist {
    id: string;
    name: string;
    description:string;
    trackIds: string[];  
    createdAt: Date;
    updatedAt: Date;
}

export interface TrackCardProps {
  track: Track;
  tracks: Track[];
  onToggleFavorite?: (track: Track) => void;
  onDelete?: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
  playlists:Playlist[];
  onToggleTrackInPlaylist: (playlistId: string, track: Track) => void; // 👈 Function to add/remove track
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  isInSelectionMode: boolean; // Flag if multiselect is active
  isSelected: boolean;       // Current track's selection status
  onToggleSelection: (trackId: string) => void; // Handler for toggling selection
}

/**
 * Track card component for displaying song information
 * Includes play button and favorite toggle
 */
export function TrackCard({ track,
  tracks, onToggleFavorite,
  onDelete,
  isInSelectionMode,
  isSelected,
  onRemoveFromPlaylist,
  playlists,
  onToggleTrackInPlaylist,
  isTrackInPlaylist
}: TrackCardProps) {

  const { currentTrack, isPlaying, playTrack, setIsPlaying } = usePlayerStore();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleShare = async () => {
    const shareData = {
      title: track.title,
      text: `${track.title} by ${track.artist}`,
      // No direct URL for local files, but you could add a link to your app or playlist
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${track.title} by ${track.artist}`);
        // Optionally show a toast
      } catch (error) {
        console.error('Failed to copy text to clipboard:', error);
      }
    }
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      // If this track is already playing, just toggle play/pause
      setIsPlaying(!isPlaying);
    } else {
      // Otherwise, load and play the new track
      playTrack(track, tracks);
    }
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setIsBottomSheetOpen(true);
    }, 3000); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleBottomSheetAction = (action: string) => {
    setIsBottomSheetOpen(false);
    switch (action) {
      case 'play':
        handlePlay();
        break;
      case 'favorite':
        onToggleFavorite?.(track);
        break;
      case 'share':
        handleShare();
        break;
      case 'delete':
        onDelete?.(track);
        break;
    }
  };
  const onToggleSelection =(action: string)=>{ }

  return (
    <Sheet open={isBottomSheetOpen} onOpenChange={setIsBottomSheetOpen}>
      <SheetTrigger asChild>
        <div
          className={cn(
            'group flex items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 transition-all hover:bg-muted/50 overflow-hidden cursor-pointer',
            isCurrentTrack && 'bg-muted/50',
            isSelected && 'bg-primary/10'
          )}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onMouseLeave={handleLongPressEnd}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlay}
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
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleFavorite?.(track)}
          className="h-7 w-7 sm:h-8 sm:w-8"
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              track.favorite ? 'fill-primary text-primary' : 'text-muted-foreground'
            )}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem] sm:min-w-[12rem]">
            <DropdownMenuItem onClick={handleShare}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v-2a8 8 0 018-8h0a8 8 0 018 8v2"/><path d="M16 12l-4-4-4 4"/></svg>
              Share
            </DropdownMenuItem>
            {(onRemoveFromPlaylist || onDelete) && <DropdownMenuSeparator />}
            {onRemoveFromPlaylist && (
              <DropdownMenuItem onClick={() => onRemoveFromPlaylist(track)}>
                <X className="mr-2 h-4 w-4" /> Remove from playlist
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(track)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete from library
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
        </div>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-lg">
        <SheetHeader>
          <SheetTitle>Track Options</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleBottomSheetAction('play')}
          >
            <Play className="mr-2 h-4 w-4" />
            Play
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleBottomSheetAction('favorite')}
          >
            <Heart className="mr-2 h-4 w-4" />
            {track.favorite ? 'Unfavorite' : 'Favorite'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add to Playlist
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              {playlists?.map((playlist) => (
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
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                <MoreVertical className="mr-2 h-4 w-4" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
              <DropdownMenuItem onClick={() => handleBottomSheetAction('share')}>
                <Share className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => handleBottomSheetAction('delete')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  );
}
