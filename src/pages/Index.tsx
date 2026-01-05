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

      const recent = allTracks
        .filter(t => typeof t.lastPlayed === 'number')
        .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
        .slice(0, 10);
      setRecentlyPlayed(recent);

      const most = allTracks
        .slice()
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 10);
      setMostPlayed(most);

      const added = allTracks
        .slice()
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 10);
      setRecentlyAdded(added);

      const favs = allTracks.filter(t => t.favorite);
      setFavoriteTracks(favs);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      toast.error('Failed to load your music library');
    } finally {
      setLoading(false);
    }
  };

  // Modern Card Component for internal use
  const CategoryCard = ({ onClick, icon: Icon, label, count, colorClass, delay }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/60 transition-all duration-300"
      onClick={onClick}
    >
      {/* Background Accent Glow */}
      <div className={`absolute -inset-1 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity ${colorClass}`} />
      
      <div className="absolute top-4 right-4 z-10">
        <span className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white/80 tracking-tighter">
          {count}
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
        <div className={`p-3 rounded-2xl bg-white/5 mb-3 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-7 w-7 text-white/90" strokeWidth={1.5} />
        </div>
        <h3 className="text-white/60 text-[11px] font-bold tracking-[0.2em] uppercase text-center">
          {label}
        </h3>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pb-40 pt-4 bg-black">
      <div className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="relative px-4 py-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl font-black tracking-tighter text-white mb-1 italic">VibeSync</h1>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-[0.3em]">Your personal collection</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-6">
        {!loading && (
          <div className="grid grid-cols-2 gap-4 mb-8">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-zinc-900/20 py-16 px-6 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-6">
              <Music className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your library is empty</h3>
            <p className="text-sm text-zinc-500 max-w-[200px] leading-relaxed">Import tracks in settings to start syncing your vibes.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
