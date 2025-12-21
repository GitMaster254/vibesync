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

/* ---------------------------------- */
/* Genre Icons */
/* ---------------------------------- */
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
  const [tab, setTab] = useState<"charts" | "genres" | "search">("charts");
  const [genreView, setGenreView] = useState<"grid" | "list">("grid");

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

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ---------------------------------- */
  /* Fetch Data */
  /* ---------------------------------- */
  const fetchCharts = useCallback(async () => {
    if (!spotifyConfigured) return setLoading(false);
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
        setSelectedGenre(genres.find((g) => g.id === genreId) ?? null);
      } catch {
        toast.error("Couldn't load genre tracks");
      } finally {
        setLoading(false);
      }
    },
    [genres, spotifyConfigured]
  );

  useEffect(() => {
    fetchCharts();
    fetchGenres();
  }, [fetchCharts, fetchGenres]);

  /* ---------------------------------- */
  /* Search */
  /* ---------------------------------- */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await spotifyProxy.searchTracks(searchQuery, 20);
        setSearchResults(Array.isArray(res) ? res : []);
      } catch {
        toast.error("Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const handlePlay = (track: ExplorerTrack, list: ExplorerTrack[]) => {
    playTrack(track as any, list as any[]);
  };

  /* ---------------------------------- */
  /* UI Guards */
  /* ---------------------------------- */
  if (!spotifyConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-yellow-500" />
        <p className="text-sm text-muted-foreground">
          Jamendo credentials not configured
        </p>
      </div>
    );
  }

  /* ---------------------------------- */
  /* Render */
  /* ---------------------------------- */
  return (
    <div className="min-h-screen pb-40 pt-4 bg-background">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-6">Explorer</h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="charts">
              <Zap className="h-4 w-4 mr-2" /> Featured
            </TabsTrigger>
            <TabsTrigger value="genres">
              <Filter className="h-4 w-4 mr-2" /> Genres
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" /> Search
            </TabsTrigger>
          </TabsList>

          {/* ---------------- Featured ---------------- */}
          <TabsContent value="charts" className="mt-4 space-y-3">
            {tracks.map((t) => (
              <TrackCard
                key={t.id}
                track={t as any}
                tracks={tracks as any[]}
                onPlay={() => handlePlay(t, tracks)}
                onViewLyrics={() => setLyricsTrack(t)}
                playlists={[]}
                onToggleTrackInPlaylist={() => {}}
                isTrackInPlaylist={() => false}
                isInSelectionMode={false}
                isSelected={false}
                onToggleSelection={() => {}}
              />
            ))}
          </TabsContent>

          {/* ---------------- Genres ---------------- */}
          <TabsContent value="genres" className="mt-4">
            {selectedGenre ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedGenre(null);
                    setGenreTracks([]);
                  }}
                >
                  <ChevronRight className="rotate-180 h-4 w-4 mr-1" />
                  Back
                </Button>

                {genreTracks.map((t) => (
                  <TrackCard
                    key={t.id}
                    track={t as any}
                    tracks={genreTracks as any[]}
                    onPlay={() => handlePlay(t, genreTracks)}
                    onViewLyrics={() => setLyricsTrack(t)}
                    playlists={[]}
                    onToggleTrackInPlaylist={() => {}}
                    isTrackInPlaylist={() => false}
                    isInSelectionMode={false}
                    isSelected={false}
                    onToggleSelection={() => {}}
                  />
                ))}
              </>
            ) : (
              <>
                <div className="flex justify-between mb-3">
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

                <div
                  className={
                    genreView === "grid"
                      ? "grid grid-cols-3 sm:grid-cols-4 gap-2"
                      : "space-y-2"
                  }
                >
                  {genres.map((g) => {
                    const Icon =
                      genreIconMap[g.name.toLowerCase()] || Music;
                    const img =
                      (g as any).image || (g as any).imageUrl || null;

                    return genreView === "list" ? (
                      <div
                        key={g.id}
                        className="flex items-center gap-3 p-2 border rounded cursor-pointer"
                        onClick={() => fetchGenreTracks(g.id)}
                      >
                        {img ? (
                          <img
                            src={img}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                        <span className="text-sm">{g.name}</span>
                      </div>
                    ) : (
                      <div
                        key={g.id}
                        className="aspect-[4/3] rounded bg-muted flex items-center justify-center cursor-pointer"
                        onClick={() => fetchGenreTracks(g.id)}
                      >
                        <span className="text-xs font-medium">
                          {g.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ---------------- Search ---------------- */}
          <TabsContent value="search" className="mt-4">
            <Input
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchLoading ? (
              <Zap className="h-6 w-6 animate-spin mx-auto mt-6" />
            ) : (
              searchResults.map((t) => (
                <TrackCard
                  key={t.id}
                  track={t as any}
                  tracks={searchResults as any[]}
                  onPlay={() => handlePlay(t, searchResults)}
                  onViewLyrics={() => setLyricsTrack(t)}
                  playlists={[]}
                  onToggleTrackInPlaylist={() => {}}
                  isTrackInPlaylist={() => false}
                  isInSelectionMode={false}
                  isSelected={false}
                  onToggleSelection={() => {}}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {lyricsTrack && (
          <LyricsModal
            artist={lyricsTrack.artist}
            title={lyricsTrack.title}
            open={!!lyricsTrack}
            onOpenChange={(o) => !o && setLyricsTrack(null)}
            trigger={<div />}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}