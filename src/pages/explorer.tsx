import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Search,
  Music,
  Filter,
  ChevronRight,
  X,
  AlertCircle,
  Heart,
  Guitar,
  Piano,
  Drum,
  Mic,
  Headphones,
  Radio,
  Speaker,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrackCard } from "@/components/TrackCard";
import { LyricsModal } from "@/components/LyricsModal";
import { toast } from "sonner";
import { usePlayerStore } from "@/store/usePlayerStore";
import {
  spotifyProxy,
  isProxyConfigured,
  ExplorerTrack,
  Genre,
} from "@/lib/spotify-proxy";

/* -------------------------------------------------------
   Genre → Icon mapping (fallback when no image exists)
------------------------------------------------------- */
const genreIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
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
};

export default function Explorer(): JSX.Element {
  /* ---------------- State ---------------- */
  const [tab, setTab] = useState<"charts" | "genres" | "search">("charts");
  const [tracks, setTracks] = useState<ExplorerTrack[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreTracks, setGenreTracks] = useState<ExplorerTrack[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);

  const [genreView, setGenreView] = useState<"grid" | "list">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExplorerTrack[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  const [lyricsTrack, setLyricsTrack] =
    useState<ExplorerTrack | null>(null);

  const playTrack = usePlayerStore((s) => s.playTrack);
  const spotifyConfigured = isProxyConfigured();

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ---------------- Fetching ---------------- */
  const fetchCharts = useCallback(async () => {
    if (!spotifyConfigured) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await spotifyProxy.getFeaturedTracks(50);
      setTracks(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Couldn't load featured tracks");
    } finally {
      setLoading(false);
    }
  }, [spotifyConfigured]);

  const fetchGenres = useCallback(async () => {
    if (!spotifyConfigured) return;
    try {
      const data = await spotifyProxy.getGenres();
      setGenres(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Couldn't load genres");
    }
  }, [spotifyConfigured]);

  const fetchGenreTracks = useCallback(
    async (genreId: string) => {
      if (!spotifyConfigured) return;
      try {
        setLoading(true);
        const data = await spotifyProxy.getGenreTracks(genreId, 20);
        setGenreTracks(Array.isArray(data) ? data : []);
        setSelectedGenre(
          genres.find((g) => g.id === genreId) ?? null
        );
      } catch {
        toast.error("Couldn't load genre tracks");
      } finally {
        setLoading(false);
      }
    },
    [genres, spotifyConfigured]
  );

  useEffect(() => {
    void fetchCharts();
    void fetchGenres();
  }, [fetchCharts, fetchGenres]);

  /* ---------------- Search ---------------- */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const data = await spotifyProxy.searchTracks(
          searchQuery.trim(),
          20
        );
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ---------------- Handlers ---------------- */
  const handlePlay = (track: ExplorerTrack) => {
    playTrack(
      {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || "",
        duration: track.duration || 0,
        fileUrl: (track as any).previewUrl || "",
        coverArt: track.coverArt,
        favorite: false,
        addedAt: new Date(),
      },
      []
    );
  };

  const handleGenreClick = (genre: Genre) => {
    setSelectedGenre(genre);
    fetchGenreTracks(genre.id);
  };

  /* ---------------- UI ---------------- */
  if (!spotifyConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 pt-4 bg-background">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-6">Explorer</h1>

        <Tabs
          value={tab}
          onValueChange={(v) =>
            setTab(v as "charts" | "genres" | "search")
          }
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="charts">
              <Zap className="mr-2 h-4 w-4" /> Featured
            </TabsTrigger>
            <TabsTrigger value="genres">
              <Filter className="mr-2 h-4 w-4" /> Genres
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" /> Search
            </TabsTrigger>
          </TabsList>

          {/* ---------------- GENRES ---------------- */}
          <TabsContent value="genres" className="mt-4">
            {!selectedGenre && (
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold">Genres</h2>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={genreView === "grid" ? "default" : "outline"}
                    onClick={() => setGenreView("grid")}
                  >
                    Grid
                  </Button>
                  <Button
                    size="sm"
                    variant={genreView === "list" ? "default" : "outline"}
                    onClick={() => setGenreView("list")}
                  >
                    List
                  </Button>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {selectedGenre ? (
                <motion.div key="tracks">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedGenre(null)}
                    className="mb-3"
                  >
                    <ChevronRight className="rotate-180 mr-1 h-4 w-4" />
                    Back
                  </Button>

                  {genreTracks.map((t) => (
                    <TrackCard
                      key={t.id}
                      track={t as any}
                      tracks={genreTracks as any}
                      onPlay={() => handlePlay(t)}
                      onViewLyrics={() => setLyricsTrack(t)}
                      playlists={[]}
                      onToggleTrackInPlaylist={() => {}}
                      isTrackInPlaylist={() => false}
                      isInSelectionMode={false}
                      isSelected={false}
                      onToggleSelection={() => {}}
                    />
                  ))}
                </motion.div>
              ) : (
                <div
                  className={
                    genreView === "grid"
                      ? "grid grid-cols-3 sm:grid-cols-4 gap-2"
                      : "space-y-2"
                  }
                >
                  {genres.map((genre) => {
                    const Icon =
                      genreIconMap[genre.name.toLowerCase()] ||
                      Music;

                    const genreImage =
                      (genre as any).image ||
                      (genre as any).imageUrl ||
                      null;

                    if (genreView === "list") {
                      return (
                        <div
                          key={genre.id}
                          onClick={() => handleGenreClick(genre)}
                          className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted"
                        >
                          {genreImage ? (
                            <img
                              src={genreImage}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gradient-primary flex items-center justify-center">
                              <Icon className="h-4 w-4 text-white/70" />
                            </div>
                          )}
                          <span className="text-sm font-medium">
                            {genre.name}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={genre.id}
                        onClick={() => handleGenreClick(genre)}
                        className="relative aspect-[4/3] rounded-md overflow-hidden cursor-pointer"
                      >
                        {genreImage ? (
                          <img
                            src={genreImage}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-primary flex items-center justify-center">
                            <Icon className="h-4 w-4 text-white/70" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-1 left-1 right-1 text-xs text-white truncate">
                          {genre.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>

        {lyricsTrack && (
          <LyricsModal
            artist={lyricsTrack.artist}
            title={lyricsTrack.title}
            open
            onOpenChange={() => setLyricsTrack(null)}
            trigger={<div />}
          />
        )}
      </div>
    </div>
  );
}