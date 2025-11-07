import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { spotifyProxy, ExplorerTrack } from '@/lib/spotify-proxy';
import { getAllPlaylists, Playlist } from '@/lib/db';
import { usePlayerStore } from '@/store/usePlayerStore';

// Local useDebounce implementation to avoid missing module import
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export default function Search() {
  const playTrack = usePlayerStore((s) => s.playTrack);
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [tracks, setTracks] = React.useState<ExplorerTrack[]>([]);
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    // Load playlists once when entering search page
    getAllPlaylists().then(setPlaylists);
  }, []);

  React.useEffect(() => {
    async function searchSpotify() {
      if (!debouncedQuery.trim()) {
        setTracks([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await spotifyProxy.searchTracks(debouncedQuery);
        setTracks(results);
      } catch (error) {
        console.error('Search failed:', error);
        setTracks([]);
      } finally {
        setIsLoading(false);
      }
    }

    searchSpotify();
  }, [debouncedQuery]);

  // Filter playlists locally
  const q = query.trim().toLowerCase();
  const match = React.useCallback((text?: string) => (text || '').toLowerCase().includes(q), [q]);
  
  const filteredPlaylists = React.useMemo(() => {
    if (!q) return playlists.slice(0, 10);
    return playlists.filter((p) => match(p.name) || match(p.description)).slice(0, 50);
  }, [playlists, q, match]);

  function handleSelectTrack(track: ExplorerTrack) {
    const mappedTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      duration: track.duration || 0,
      fileUrl: track.previewUrl || '',
      favorite: false,
      addedAt: new Date(),
      blob: new File([], track.title), // Empty file since we're streaming from Spotify
      coverArt: track.coverArt,
      // Optional fields
      year: undefined,
      trackNumber: null,
      genre: undefined,
      bitrate: undefined,
      sampleRate: undefined,
      codec: undefined,
      playCount: 0,
      lastPlayed: undefined
    };
    
    playTrack(mappedTrack, [mappedTrack]);
  }

  function handleSelectPlaylist(pl: Playlist) {
    navigate(`/playlist/${pl.id}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="min-h-screen pb-40 pt-6 flex flex-col"
    >
      <div className="container mx-auto max-w-2xl px-4 flex-1 flex flex-col min-h-0">
        <h1 className="mb-3 text-2xl font-bold">Search</h1>
        <div className="rounded-xl border bg-card flex flex-1 min-h-0 flex-col">
          <div className="sticky top-0 z-10 border-b bg-card">
            <Command>
              <CommandInput
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search tracks or playlists…"
              />
            </Command>
            <div className="px-3 pb-2 pt-2">
              <Tabs defaultValue="all">
                <TabsList className="w-full justify-between">
                  <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                  <TabsTrigger value="tracks" className="flex-1">Tracks</TabsTrigger>
                  <TabsTrigger value="playlists" className="flex-1">Playlists</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="all">
              <TabsContent value="all" className="m-0">
                <Command>
                  <CommandList className="max-h-none">
                    <CommandEmpty>
                      {isLoading ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Searching Spotify...
                        </div>
                      ) : (
                        'No results found.'
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="Tracks">
                      {tracks.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={`track:${t.title} ${t.artist ?? ''} ${t.album ?? ''}`}
                          onSelect={() => handleSelectTrack(t)}
                        >
                          <div className="flex items-center gap-3">
                            {t.coverArt && (
                              <img 
                                src={t.coverArt} 
                                alt={t.title}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            )}
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">{t.title}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {t.artist || 'Unknown artist'}{t.album ? ` • ${t.album}` : ''}
                              </span>
                            </div>
                          </div>
                          <CommandShortcut>Enter</CommandShortcut>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Playlists">
                      {filteredPlaylists.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`playlist:${p.name}`}
                          onSelect={() => handleSelectPlaylist(p)}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{p.name}</span>
                            {p.description ? (
                              <span className="truncate text-xs text-muted-foreground">{p.description}</span>
                            ) : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </TabsContent>
              <TabsContent value="tracks" className="m-0">
                <Command>
                  <CommandList className="max-h-none">
                    <CommandEmpty>
                      {isLoading ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Searching Spotify...
                        </div>
                      ) : (
                        'No tracks found.'
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {tracks.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={`track:${t.title} ${t.artist ?? ''} ${t.album ?? ''}`}
                          onSelect={() => handleSelectTrack(t)}
                        >
                          <div className="flex items-center gap-3">
                            {t.coverArt && (
                              <img 
                                src={t.coverArt} 
                                alt={t.title}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            )}
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">{t.title}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {t.artist || 'Unknown artist'}{t.album ? ` • ${t.album}` : ''}
                              </span>
                            </div>
                          </div>
                          <CommandShortcut>Enter</CommandShortcut>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </TabsContent>
              <TabsContent value="playlists" className="m-0">
                <Command>
                  <CommandList className="max-h-none">
                    <CommandEmpty>No playlists found.</CommandEmpty>
                    <CommandGroup>
                      {filteredPlaylists.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`playlist:${p.name}`}
                          onSelect={() => handleSelectPlaylist(p)}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{p.name}</span>
                            {p.description ? (
                              <span className="truncate text-xs text-muted-foreground">{p.description}</span>
                            ) : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
