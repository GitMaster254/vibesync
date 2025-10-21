import { usePlayerStore } from '@/store/usePlayerStore';
import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/TrackCard';

// Individual widget components
function NowPlayingWidget() {
  const { currentTrack, isPlaying } = usePlayerStore();
  if (!currentTrack) return <div className="p-4">No track playing</div>;
  return (
    <div className="p-4 rounded-lg bg-card shadow-lg flex items-center gap-4">
      <div className="flex-1">
        <div className="font-bold text-lg">{currentTrack.title}</div>
        <div className="text-sm text-muted-foreground">{currentTrack.artist}</div>
      </div>
      <div>
        {isPlaying ? '⏸️' : '▶️'}
      </div>
    </div>
  );
}

function TrackListWidget() {
  const { queue } = usePlayerStore();
  if (!queue.length) return <div className="p-4">No tracks in queue</div>;
  return (
    <div className="p-4 rounded-lg bg-card shadow-lg">
      <div className="font-bold mb-2">Queue</div>
      <ul>
        {queue.map(track => (
          <li key={track.id} className="mb-1 text-sm">{track.title} <span className="text-muted-foreground">{track.artist}</span></li>
        ))}
      </ul>
    </div>
  );
}

function PlaylistWidget() {
  // Placeholder: would show selected playlist
  return <div className="p-4 rounded-lg bg-card shadow-lg">Playlist widget (coming soon)</div>;
}

function MiniPlayerWidget() {
  const { currentTrack, isPlaying } = usePlayerStore();
  if (!currentTrack) return <div className="p-2">No track playing</div>;
  return (
    <div className="p-2 rounded bg-card flex items-center gap-2">
      <span>{isPlaying ? '⏸️' : '▶️'}</span>
      <span className="font-semibold">{currentTrack.title}</span>
    </div>
  );
}

function AlbumArtWidget() {
  const { currentTrack } = usePlayerStore();
  if (!currentTrack) return <div className="p-4">No track playing</div>;
  return (
    <div className="p-4 flex justify-center items-center">
      <div className="h-24 w-24 rounded-lg bg-gradient-primary" />
    </div>
  );
}

function QueueWidget() {
  const { queue, queueIndex } = usePlayerStore();
  if (!queue.length) return <div className="p-4">Queue is empty</div>;
  return (
    <div className="p-4 rounded-lg bg-card shadow-lg">
      <div className="font-bold mb-2">Up Next</div>
      <ul>
        {queue.slice(queueIndex + 1).map(track => (
          <li key={track.id} className="mb-1 text-sm">{track.title} <span className="text-muted-foreground">{track.artist}</span></li>
        ))}
      </ul>
    </div>
  );
}

function StatsWidget() {
  // Placeholder: would show stats
  return <div className="p-4 rounded-lg bg-card shadow-lg">Stats widget (coming soon)</div>;
}

const widgetMap = {
  nowPlaying: NowPlayingWidget,
  trackList: TrackListWidget,
  playlist: PlaylistWidget,
  miniPlayer: MiniPlayerWidget,
  albumArt: AlbumArtWidget,
  queue: QueueWidget,
  stats: StatsWidget,
};

export function WidgetDisplay() {
  const [selectedWidget, setSelectedWidget] = useState(() => localStorage.getItem('vibesync-widget') || 'nowPlaying');
  useEffect(() => {
    const handler = () => setSelectedWidget(localStorage.getItem('vibesync-widget') || 'nowPlaying');
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  const Widget = widgetMap[selectedWidget] || NowPlayingWidget;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Widget />
    </div>
  );
}
