import React from 'react';
import { Search, X } from 'lucide-react';
import { getAllTracks, getAllPlaylists, Track, Playlist } from '@/lib/db';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useIsMobile } from '@/hooks/use-mobile';

export default function UniversalSearchBar() {
  const isMobile = useIsMobile();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const [expanded, setExpanded] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);

  React.useEffect(() => {
    if (expanded) {
      Promise.all([getAllTracks(), getAllPlaylists()]).then(([t, p]) => {
        setTracks(t);
        setPlaylists(p);
      });
    }
  }, [expanded]);

  const q = query.trim().toLowerCase();
  const match = React.useCallback((text?: string) => (text || '').toLowerCase().includes(q), [q]);

  const filteredTracks = React.useMemo(() => {
    if (!q) return tracks.slice(0, 20);
    return tracks.filter((t) => match(t.title) || match(t.artist) || match(t.album)).slice(0, 25);
  }, [tracks, q, match]);

  const filteredPlaylists = React.useMemo(() => {
    if (!q) return playlists.slice(0, 10);
    return playlists.filter((p) => match(p.name) || match(p.description)).slice(0, 15);
  }, [playlists, q, match]);

  function handleSelectTrack(track: Track) {
    playTrack(track, [track]);
    setExpanded(false);
    setQuery('');
  }

  function handleSelectPlaylist(pl: Playlist) {
    window.location.href = `/playlist/${pl.id}`;
    setExpanded(false);
    setQuery('');
  }

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <>
      {!expanded && (
        <button
          type="button"
          aria-label="Search"
          className="fixed bottom-20 right-4 z-50 rounded-full bg-primary p-4 shadow-lg transition-all hover:bg-primary/90"
          onClick={() => setExpanded(true)}
        >
          <Search className="h-6 w-6 text-white" />
        </button>
      )}
      {expanded && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in-0">
          <div className="relative flex items-center px-4 pt-8 pb-2">
            <Search className="absolute left-6 h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tracks or playlists…"
              className="w-full rounded-full border border-border bg-card px-10 py-3 text-lg focus:outline-none"
            />
            <button
              type="button"
              aria-label="Close search"
              className="absolute right-6"
              onClick={() => { setExpanded(false); setQuery(''); }}
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-24">
            {q && filteredTracks.length === 0 && filteredPlaylists.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">No results found.</div>
            )}
            {filteredTracks.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 text-xs font-semibold text-muted-foreground">Tracks</div>
                <ul>
                  {filteredTracks.map(t => (
                    <li key={t.id}>
                      <button
                        className="w-full text-left py-3 px-2 rounded-lg hover:bg-accent transition flex flex-col"
                        onClick={() => handleSelectTrack(t)}
                      >
                        <span className="truncate font-medium">{t.title}</span>
                        <span className="truncate text-xs text-muted-foreground">{t.artist || 'Unknown artist'}{t.album ? ` • ${t.album}` : ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {filteredPlaylists.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold text-muted-foreground">Playlists</div>
                <ul>
                  {filteredPlaylists.map(p => (
                    <li key={p.id}>
                      <button
                        className="w-full text-left py-3 px-2 rounded-lg hover:bg-accent transition flex flex-col"
                        onClick={() => handleSelectPlaylist(p)}
                      >
                        <span className="truncate font-medium">{p.name}</span>
                        {p.description && <span className="truncate text-xs text-muted-foreground">{p.description}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
