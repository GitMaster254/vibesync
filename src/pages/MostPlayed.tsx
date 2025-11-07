import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Play, Heart, Trash2, ArrowLeft } from 'lucide-react';
import { Track, getAllTracks, updateTrack, deleteTrack } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * Most Played page - Shows tracks sorted by play count
 */
export default function MostPlayed() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayerStore();

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const allTracks = await getAllTracks();
      const most = allTracks
        .slice()
        .sort((a: any, b: any) => (b.playCount || 0) - (a.playCount || 0));
      setTracks(most);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      toast.error('Failed to load most played tracks');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track, index: number) => {
    playTrack(track, tracks);
    navigate('/player');
  };

  const handleToggleFavorite = async (track: Track) => {
    try {
      const updatedTrack = { ...track, favorite: !track.favorite };
      await updateTrack(updatedTrack);
      setTracks(prev => prev.map(t => t.id === track.id ? updatedTrack : t));
      toast.success(updatedTrack.favorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to update favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const handleDelete = async (track: Track) => {
    try {
      await deleteTrack(track.id);
      setTracks(prev => prev.filter(t => t.id !== track.id));
      toast.success('Track deleted');
    } catch (error) {
      console.error('Failed to delete track:', error);
      toast.error('Failed to delete track');
    }
  };

  return (
    <div className="min-h-screen pb-40 pt-4">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Most Played</h1>
              <p className="text-sm text-muted-foreground">{tracks.length} tracks</p>
            </div>
          </div>
        </div>

        {/* Track List */}
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : tracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
          >
            <TrendingUp className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No tracks yet</h3>
            <p className="text-sm text-muted-foreground">Start playing music to see your top tracks</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-accent"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => handlePlay(track, index)}
                >
                  <Play className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{track.title}</div>
                  <div className="truncate text-sm text-muted-foreground">{track.artist}</div>
                  {(track as any).playCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {(track as any).playCount} {(track as any).playCount === 1 ? 'play' : 'plays'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleToggleFavorite(track)}
                  >
                    <Heart className={`h-4 w-4 ${track.favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(track)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
