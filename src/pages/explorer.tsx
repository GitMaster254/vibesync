import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Search, Music, Filter, ChevronRight, X, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackCard } from "@/components/TrackCard";
import { toast } from "sonner";
import { usePlayerStore } from "@/store/usePlayerStore";
import { spotifyApi, isSpotifyConfigured, ExplorerTrack, Genre } from "@/lib/spotify";

export default function Explorer() {
  const [tab, setTab] = useState<"charts" | "genres" | "search">("charts");
  const [tracks, setTracks] = useState<ExplorerTrack[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [genreTracks, setGenreTracks] = useState<ExplorerTrack[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [searchResults, setSearchResults] = useState<ExplorerTrack[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const playTrack = usePlayerStore((s) => s.playTrack);

  // Check if Spotify is configured
  const spotifyConfigured = isSpotifyConfigured();

  // Fetch featured tracks (as charts)
  const fetchCharts = useCallback(async () => {
    if (!spotifyConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const featuredTracks = await spotifyApi.getFeaturedTracks(50);
      setTracks(featuredTracks);
    } catch (error) {
      console.error("Charts fetch error:", error);
      toast.error("Couldn't load featured tracks");
    } finally {
      setLoading(false);
    }
  }, [spotifyConfigured]);

  // Fetch genres
  const fetchGenres = useCallback(async () => {
    if (!spotifyConfigured) return;

    try {
      const genreList = await spotifyApi.getGenres();
      setGenres(genreList);
    } catch (error) {
      console.error("Genres fetch error:", error);
      toast.error("Couldn't load genres");
    }
  }, [spotifyConfigured]);

  // Fetch tracks by genre
  const fetchGenreTracks = useCallback(async (genreId: string) => {
    if (!spotifyConfigured) return;

    try {
      setLoading(true);
      const genreTracksData = await spotifyApi.getGenreTracks(genreId, 20);
      setGenreTracks(genreTracksData);
      setSelectedGenre(genres.find(g => g.id === genreId) || null);
    } catch (error) {
      console.error("Genre tracks fetch error:", error);
      toast.error("Couldn't load tracks for this genre");
    } finally {
      setLoading(false);
    }
  }, [genres, spotifyConfigured]);

  // Search tracks with debouncing
  useEffect(() => {
    if (!searchQuery.trim() || !spotifyConfigured) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await spotifyApi.searchTracks(searchQuery, 20);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Search failed");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, spotifyConfigured]);

  useEffect(() => {
    fetchGenres();
    fetchCharts();
  }, [fetchCharts, fetchGenres]);

  const handlePlay = (track: ExplorerTrack) => {
    const playerTrack = {
      ...track,
      fileUrl: track.previewUrl || "",
      blob: undefined,
    } as any;
    playTrack(playerTrack, [playerTrack]);
  };

  const handleGenreClick = (genre: Genre) => {
    setTab("genres");
    fetchGenreTracks(genre.id);
  };

  // Configuration warning
  if (!spotifyConfigured) {
    return (
      <div className="min-h-screen pb-40 pt-4 bg-background">
        <div className="container mx-auto max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold mb-2">Explorer</h1>
            <p className="text-muted-foreground">Discover new music from Spotify</p>
          </motion.div>

          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Spotify Not Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please add your Spotify Client ID and Secret to enable music exploration.
            </p>
            <Badge variant="outline" className="text-xs">
              Check your .env file for VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  if (loading && tracks.length === 0) {
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold mb-2">Explorer</h1>
          <p className="text-muted-foreground">Discover new music from Spotify</p>
        </motion.div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="charts">
              <Zap className="mr-2 h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="genres">
              <Filter className="mr-2 h-4 w-4" />
              Genres
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="mt-4">
            {tracks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Music className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No featured tracks available</h3>
                <p className="text-sm text-muted-foreground">Pull to refresh or try another tab</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TrackCard
                      track={track as any}
                      tracks={tracks as any[]}
                      onPlay={() => handlePlay(track)}
                    />
                  </motion.div>
                ))}
                <div className="text-center">
                  <Badge variant="outline" className="mt-4">
                    Powered by Spotify • 30s previews
                  </Badge>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Genres Tab */}
          <TabsContent value="genres" className="mt-4">
            <AnimatePresence mode="wait">
              {selectedGenre ? (
                <motion.div
                  key="genre-tracks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedGenre(null);
                        setGenreTracks([]);
                      }}
                    >
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </Button>
                    <div>
                      <h2 className="text-xl font-bold">{selectedGenre.name}</h2>
                      <p className="text-sm text-muted-foreground">Recommended tracks</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {genreTracks.map((track, index) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <TrackCard
                          track={track as any}
                          tracks={genreTracks as any[]}
                          onPlay={() => handlePlay(track)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="genres-grid"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {genres.map((genre) => (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      key={genre.id}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted-foreground/10 cursor-pointer"
                      onClick={() => handleGenreClick(genre)}
                    >
                      {genre.cover ? (
                        <img
                          src={genre.cover}
                          alt={genre.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-primary flex items-center justify-center">
                          <Music className="h-8 w-8 text-white/70" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="text-white font-semibold truncate">{genre.name}</h3>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search artists, tracks, or albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-8">
                <Zap className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : searchResults.length === 0 && searchQuery ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or check spelling
                </p>
              </motion.div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((track, index) => (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TrackCard
                      track={track as any}
                      tracks={searchResults as any[]}
                      onPlay={() => handlePlay(track)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Search Spotify</h3>
                <p className="text-sm text-muted-foreground">
                  Find your favorite artists and tracks
                </p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}