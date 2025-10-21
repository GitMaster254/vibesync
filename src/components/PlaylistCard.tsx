import { Music } from 'lucide-react';
import { Playlist } from '@/lib/db';
import { cn } from '@/lib/utils';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: () => void;
}

/**
 * Playlist card component for displaying playlist information
 */
export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:bg-muted/50'
      )}
    >
      {/* Cover art placeholder */}
      <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-lg bg-gradient-primary">
        <div className="flex h-full items-center justify-center">
          <Music className="h-6 w-6 text-white/50" />
        </div>
      </div>

      {/* Playlist info */}
      <h3 className="mb-1 truncate text-sm font-semibold">{playlist.name}</h3>
      <p className="truncate text-xs text-muted-foreground">
        {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
      </p>
      {playlist.description && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{playlist.description}</p>
      )}
    </div>
  );
}
