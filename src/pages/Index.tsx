 import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Clock, TrendingUp, Plus, Heart } from 'lucide-react';
import { Track, getAllTracks } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/**
 * Home page - Music collection overview
 * Displays category cards for quick navigation
 */
export default function Index() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Track[]>([]);
  const [recentlyAdded, setRecentlyAdded] = useState<Track[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tracks from IndexedDB
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

  return (
    <div className="min-h-screen pb-40 pt-4">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="relative px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="mb-2 bg-gradient-primary bg-clip-text text-4xl font-bold text-transparent">VibeSync</h1>
            <p className="text-muted-foreground">Your personal music collection</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4">
        {!loading && (recentlyPlayed.length > 0 || mostPlayed.length > 0 || recentlyAdded.length > 0 || favoriteTracks.length > 0) && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            {favoriteTracks.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)' }}
                onClick={() => navigate('/favorites')}>
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">{favoriteTracks.length}</div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <Heart className="h-10 w-10 text-white mb-2" strokeWidth={1.5} />
                  <h3 className="text-white text-lg font-bold text-center">FAVORITES</h3>
                </div>
              </motion.div>
            )}
            {recentlyPlayed.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={() => navigate('/recently-played')}>
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">{recentlyPlayed.length}</div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <Clock className="h-10 w-10 text-white mb-2" strokeWidth={1.5} />
                  <h3 className="text-white text-lg font-bold text-center">RECENT PLAY</h3>
                </div>
              </motion.div>
            )}

            {recentlyAdded.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
                onClick={() => navigate('/recently-added')}>
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-semibold">{recentlyAdded.length}</div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <Plus className="h-10 w-10 text-white mb-2" strokeWidth={1.5} />
                  <h3 className="text-white text-lg font-bold text-center">RECENT ADD</h3>
                </div>
              </motion.div>
            )}

            {mostPlayed.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}
                onClick={() => navigate('/most-played')}>
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-purple-900 text-xs font-semibold">{mostPlayed.length}</div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <TrendingUp className="h-10 w-10 text-purple-900 mb-2" strokeWidth={1.5} />
                  <h3 className="text-purple-900 text-lg font-bold text-center">MOST PLAY</h3>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        {!loading && tracks.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12">
            <Music className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No music yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Import your music from the Library page to get started</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
