import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Search, Music, Filter, ChevronRight, X, AlertCircle, Heart, Guitar, Piano, Drum, Mic, Headphones, Radio, Speaker } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackCard } from "@/components/TrackCard";
import { LyricsModal } from "@/components/LyricsModal";
import { toast } from "sonner";
import { usePlayerStore } from "@/store/usePlayerStore";
import { spotifyProxy, isProxyConfigured, ExplorerTrack, Genre } from "@/lib/spotify-proxy";

const genreIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  pop: Heart,
  rock: Guitar,
  jazz: Piano,
  classical: Piano,
  electronic: Drum,
  "hip-hop": Mic,
  rap: Mic,
  country: Guitar,
  folk: Guitar,
  reggae: Speaker,
  blues: Guitar,
  soul: Heart,
  funk: Drum,
  disco: Radio,
  techno: Drum,
  house: Headphones,
  ambient: Radio,
  indie: Guitar,
  alternative: Guitar,
  metal: Guitar,
  punk: Guitar,
  // Add more as needed
};

export default function Explorer(): JSX.Element {
  const [tab, setTab] = useState<"charts" | "genres" | "search">("charts");
  const [tracks, setTracks] = useState<ExplorerTrack[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreTracks, setGenreTracks] = useState<ExplorerTrack[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExplorerTrack[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const [lyricsTrack, setLyricsTrack] = useState<ExplorerTrack | null>(null);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const spotifyConfigured = isProxyConfigured();

  const isMountedRef = useRef<boolean>(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // --- fetch functions (no AbortSignal passed)
  const fetchCharts = useCallback(async (): Promise<void> => {
    if (!spotifyConfigured) {
      if (isMountedRef.current) setLoading(false);
      return;
    }
    try {
      if (isMountedRef.current) setLoading(true);
      const featuredTracks = await spotifyProxy.getFeaturedTracks(50);
      // defensive: ensure we set an array
      if (isMountedRef.current) setTracks(Array.isArray(featuredTracks) ? featuredTracks : []);
    } catch (error: any) {
      console.error("Charts fetch error:", error);
      toast.error("Couldn't load featured tracks");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [spotifyConfigured]);

  const fetchGenres = useCallback(async (): Promise<void> => {
    if (!spotifyConfigured) return;
    try {
      const genreList = await spotifyProxy.getGenres();
      if (isMountedRef.current) setGenres(Array.isArray(genreList) ? genreList : []);
    } catch (error: any) {
      console.error("Genres fetch error:", error);
      toast.error("Couldn't load genres");
    }
  }, [spotifyConfigured]);

  const fetchGenreTracks = useCallback(async (genreId: string): Promise<void> => {
    if (!spotifyConfigured) return;
    try {
      if (isMountedRef.current) setLoading(true);
      const genreTracksData = await spotifyProxy.getGenreTracks(genreId, 20);
      if (isMountedRef.current) {
        setGenreTracks(Array.isArray(genreTracksData) ? genreTracksData : []);
        // set selected genre defensively: find might return undefined -> null
        setSelectedGenre((prev) => prev ?? (genres.find((g) => g.id === genreId) ?? null));
      }
    } catch (error: any) {
      console.error("Genre tracks fetch error:", error);
      toast.error("Couldn't load tracks for this genre");
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [genres, spotifyConfigured]);

  // initial load
  useEffect(() => {
    // keep simple; fire and forget
    void fetchGenres();
    void fetchCharts();
  }, [fetchGenres, fetchCharts]);

  // search debounce (no signal)
  useEffect(() => {
    if (!searchQuery.trim() || !spotifyConfigured) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        if (isMountedRef.current) setSearchLoading(true);
        const results = await spotifyProxy.searchTracks(searchQuery.trim(), 20);
        if (isMountedRef.current) setSearchResults(Array.isArray(results) ? results : []);
      } catch (error: any) {
        console.error("Search error:", error);
        toast.error("Search failed");
        if (isMountedRef.current) setSearchResults([]);
      } finally {
        if (isMountedRef.current) setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, spotifyConfigured]);

  const handlePlay = useCallback((track: ExplorerTrack): void => {
    // Convert explorer track to player track format
    const playerTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      duration: track.duration || 0,
      fileUrl: (track as any).previewUrl || '',
      blob: undefined,
      coverArt: track.coverArt,
      favorite: false,
      addedAt: new Date(),
    };
    playTrack(playerTrack, [playerTrack]);
  }, [playTrack]);

  const handleGenreClick = useCallback((genre: Genre): void => {
    setTab("genres");
    setSelectedGenre(genre);
    void fetchGenreTracks(genre.id);
  }, [fetchGenreTracks]);

  const handleViewLyrics = useCallback((track: ExplorerTrack): void => {
    setLyricsTrack(track);
  }, []);

  const emptyCharts = !loading && tracks.length === 0;
  const emptyGenres = !loading && genres.length === 0;

  if (!spotifyConfigured) {
    return (
      <div className="min-h-screen pb-40 pt-4 bg-background">
        <div className="container mx-auto max-w-2xl px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Explorer</h1>
            <p className="text-muted-foreground">Discover new music from Jamendo</p>
          </motion.div>
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Spotify Not Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">Please add your Jamendo Client ID and Secret to enable music exploration.</p>
            <Badge variant="outline" className="text-xs">VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET</Badge>
          </div>
        </div>
      </div>
    );
  }

  if (loading && tracks.length === 0 && genres.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Discovering fresh tunes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 pt-4 bg-background">
      <div className="container mx-auto max-w-2xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Explorer</h1>
          <p className="text-muted-foreground">Discover new music from Jamendo</p>
        </motion.div>
        <Tabs value={tab} onValueChange={(v: string) => setTab(v as "charts" | "genres" | "search")} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts"><Zap className="mr-2 h-4 w-4" />Featured</TabsTrigger>
            <TabsTrigger value="genres"><Filter className="mr-2 h-4 w-4" />Genres</TabsTrigger>
            <TabsTrigger value="search"><Search className="mr-2 h-4 w-4" />Search</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-4">
            {emptyCharts ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <Music className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No featured tracks available</h3>
                <p className="text-sm text-muted-foreground">Pull to refresh or try another tab</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <motion.div key={track.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                    <TrackCard
                      track={track as any}
                      tracks={tracks as any[]}
                      onPlay={() => handlePlay(track)}
                      onViewLyrics={() => handleViewLyrics(track)}
                      playlists={[]}
                      onToggleTrackInPlaylist={() => {}}
                      isTrackInPlaylist={() => false}
                      isInSelectionMode={false}
                      isSelected={false}
                      onToggleSelection={() => {}}
                    />
                  </motion.div>
                ))}
                <div className="text-center">
                  <Badge variant="outline" className="mt-4">Powered by Jamendo • Full tracks</Badge>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="genres" className="mt-4">
            <AnimatePresence mode="wait">
              {selectedGenre ? (
                <motion.div key="genre-tracks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedGenre(null); setGenreTracks([]); }}>
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                    <div>
                      {/* defensive access to name */}
                      <h2 className="text-xl font-bold">{selectedGenre?.name ?? "Genre"}</h2>
                      <p className="text-sm text-muted-foreground">Recommended tracks</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {genreTracks.map((track, index) => (
                      <motion.div key={track.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                        <TrackCard
                          track={track as any}
                          tracks={genreTracks as any[]}
                          onPlay={() => handlePlay(track)}
                          onViewLyrics={() => handleViewLyrics(track)}
                          playlists={[]}
                          onToggleTrackInPlaylist={() => {}}
                          isTrackInPlaylist={() => false}
                          isInSelectionMode={false}
                          isSelected={false}
                          onToggleSelection={() => {}}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="genres-grid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {emptyGenres ? (
                    <div className="col-span-2 text-center py-8">
                      <Music className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No genres available</p>
                    </div>
                  ) : (
                    genres.map((genre) => {
                      const IconComponent = genreIconMap[genre.name.toLowerCase()] || Music;
                      return (
                        <motion.div
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.97 }}
  key={genre.id}
  className="group relative aspect-[4/3] rounded-md overflow-hidden cursor-pointer"
  onClick={() => handleGenreClick(genre)}
>
  {genreImage ? (
    <img
      src={genreImage}
      alt={genre.name}
      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
    />
  ) : (
    <div className="h-full w-full bg-gradient-primary flex items-center justify-center">
      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
    </div>
  )}

  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />
  <div className="absolute bottom-1 left-1 right-1">
    <h3 className="text-white text-xs sm:text-sm font-medium truncate">
      {genre.name}
    </h3>
  </div>
</motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="search" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search artists, tracks, or albums..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              {searchQuery && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => { setSearchQuery(""); setSearchResults([]); }}><X className="h-3 w-3" /></Button>}
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-8"><Zap className="h-6 w-6 animate-spin text-primary" /></div>
            ) : searchResults.length === 0 && searchQuery ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground">Try different keywords or check spelling</p>
              </motion.div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((track, index) => (
                  <motion.div key={track.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                    <TrackCard
                      track={track as any}
                      tracks={searchResults as any[]}
                      onPlay={() => handlePlay(track)}
                      onViewLyrics={() => handleViewLyrics(track)}
                      playlists={[]}
                      onToggleTrackInPlaylist={() => {}}
                      isTrackInPlaylist={() => false}
                      isInSelectionMode={false}
                      isSelected={false}
                      onToggleSelection={() => {}}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Search Jamendo</h3>
                <p className="text-sm text-muted-foreground">Find your favorite artists and tracks</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {lyricsTrack && (
          <LyricsModal
            artist={lyricsTrack.artist}
            title={lyricsTrack.title}
            trigger={<div />} // Not used since we control open state
            className="hidden" // Hide trigger
            open={!!lyricsTrack}
            onOpenChange={(open) => !open && setLyricsTrack(null)}
          />
        )}
      </div>
    </div>
  );
}
