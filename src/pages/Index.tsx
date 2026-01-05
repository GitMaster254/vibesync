import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Clock, TrendingUp, Plus, Heart } from 'lucide-react';
import { Track, getAllTracks } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Index() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Track[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Track[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const allTracks = await getAllTracks();
      allTracks.sort((a, b) => a.title.localeCompare(b.title));
      setTracks(allTracks);

      setRecentlyPlayed(
        allTracks
          .filter(t => typeof t.lastPlayed === 'number')
          .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
          .slice(0, 10)
      );

      setMostPlayed(
        allTracks
          .slice()
          .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
          .slice(0, 10)
      );

      setRecentlyAdded(
        allTracks
          .slice()
          .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
          .slice(0, 10)
      );

      setFavoriteTracks(allTracks.filter(t => t.favorite));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load your music library');
    } finally {
      setLoading(false);
    }
  };

  const CategoryCard = ({ onClick, icon: Icon, label, count, colorClass, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="
        group relative aspect-square cursor-pointer overflow-hidden rounded-3xl
        bg-card border border-border
        hover:bg-muted transition-all duration-300
      "
    >
      {/* Accent glow */}
      <div
        className={`
          absolute -inset-1 blur-2xl opacity-20
          group-hover:opacity-40 transition-opacity
          ${colorClass}
        `}
      />

      <div className="absolute top-4 right-4 z-10">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          {count}
        </span>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
        <div className="mb-3 rounded-2xl bg-muted p-3 group-hover:scale-110 transition-transform">
          <Icon className="h-7 w-7 text-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
          {label}
        </h3>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-40 pt-4">
      {/* Header */}
      <div className="relative">
        <div className="absolute left-1/2 top-0 h-64 w-full -translate-x-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
        <div className="relative px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="mb-1 text-4xl font-black tracking-tighter italic text-foreground">
              VibeSync
            </h1>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Your personal collection
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-6">
        {!loading && (
          <div className="mb-8 grid grid-cols-2 gap-4">
            <CategoryCard
              onClick={() => navigate('/favorites')}
              icon={Heart}
              label="Favorites"
              count={favoriteTracks.length}
              colorClass="bg-rose-500"
              delay={0.05}
            />
            <CategoryCard
              onClick={() => navigate('/recently-played')}
              icon={Clock}
              label="Recent Play"
              count={recentlyPlayed.length}
              colorClass="bg-indigo-500"
              delay={0.1}
            />
            <CategoryCard
              onClick={() => navigate('/recently-added')}
              icon={Plus}
              label="Recent Add"
              count={recentlyAdded.length}
              colorClass="bg-emerald-500"
              delay={0.15}
            />
            <CategoryCard
              onClick={() => navigate('/most-played')}
              icon={TrendingUp}
              label="Most Played"
              count={mostPlayed.length}
              colorClass="bg-amber-500"
              delay={0.2}
            />
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="
              flex flex-col items-center justify-center rounded-3xl
              border border-border bg-card py-16 px-6 text-center
            "
          >
            <div className="mb-6 rounded-full bg-muted p-6">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Your library is empty
            </h3>
            <p className="max-w-[200px] text-sm leading-relaxed text-muted-foreground">
              Import tracks in settings to start syncing your vibes.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}