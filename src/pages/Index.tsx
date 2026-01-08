import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Clock, TrendingUp, Plus, Heart } from 'lucide-react';
import { Track, getAllTracks } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type CategoryCardProps = {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
  iconColor: string;
  delay: number;
};

function CategoryCard({
  onClick,
  icon: Icon,
  label,
  count,
  iconColor,
  delay,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="
        relative aspect-square cursor-pointer
        rounded-2xl
        bg-card
        border border-border
        hover:bg-muted/40
        hover:shadow-md
        transition-all
      "
    >
      {/* Count badge */}
      <div className="absolute top-3 right-3">
        <span
          className="
            rounded-full
            bg-muted
            px-2 py-0.5
            text-[10px]
            font-semibold
            text-foreground/70
          "
        >
          {count}
        </span>
      </div>

      <div className="flex h-full flex-col items-center justify-center gap-3">
        <div className="rounded-xl bg-muted p-3">
          <Icon className={`h-7 w-7 ${iconColor}`} strokeWidth={1.5} />
        </div>

        <h3 className="text-[12px] font-semibold uppercase tracking-[0.15em] text-foreground/80 text-center">
          {label}
        </h3>
      </div>
    </motion.div>
  );
}

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
          .sort((a, b) => (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0))
          .slice(0, 10)
      );

      setMostPlayed(
        [...allTracks]
          .sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0))
          .slice(0, 10)
      );

      setRecentlyAdded(
        [...allTracks]
          .sort(
            (a, b) =>
              new Date(b.addedAt).getTime() -
              new Date(a.addedAt).getTime()
          )
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

  return (
    <div className="min-h-screen bg-background pb-40 pt-6">
      {/* Header */}
      <div className="px-4 py-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-1 text-4xl font-black tracking-tight text-foreground">
            VibeSync
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Your personal collection
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto max-w-2xl px-6">
        {!loading && (
          <div className="mb-8 grid grid-cols-2 gap-4">
            <CategoryCard
              onClick={() => navigate('/favorites')}
              icon={Heart}
              label="Favorites"
              count={favoriteTracks.length}
              iconColor="text-rose-500"
              delay={0.05}
            />

            <CategoryCard
              onClick={() => navigate('/recently-played')}
              icon={Clock}
              label="Recent Play"
              count={recentlyPlayed.length}
              iconColor="text-blue-500"
              delay={0.1}
            />

            <CategoryCard
              onClick={() => navigate('/recently-added')}
              icon={Plus}
              label="Recent Add"
              count={recentlyAdded.length}
              iconColor="text-emerald-500"
              delay={0.15}
            />

            <CategoryCard
              onClick={() => navigate('/most-played')}
              icon={TrendingUp}
              label="Most Played"
              count={mostPlayed.length}
              iconColor="text-indigo-500"
              delay={0.2}
            />
          </div>
        )}

        {!loading && tracks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="
              flex flex-col items-center justify-center
              rounded-2xl
              border border-border
              bg-card
              py-16 px-6
              text-center
            "
          >
            <div className="mb-6 rounded-full bg-muted p-6">
              <Music className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Your library is empty
            </h3>
            <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">
              Import tracks in settings to start building your collection.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}