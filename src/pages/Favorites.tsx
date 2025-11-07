import { useState, useEffect } from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import { TrackCard } from '@/components/TrackCard';
import { Track, getFavoriteTracks, updateTrack } from '@/lib/db';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
/**
 * Favorites page - Shows all favorited tracks
 */
export default function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const tracks = await getFavoriteTracks();
      setFavorites(tracks);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (track: Track) => {
    try {
      const updatedTrack = { ...track, favorite: false };
      await updateTrack(updatedTrack);
      setFavorites(prev => prev.filter(t => t.id !== track.id));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Failed to update favorite:', error);
      toast.error('Failed to update favorite');
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
          </div>
          <div>
            <h1 className="text-3xl font-bold">Favorites</h1>
            <p className="text-sm text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? 'track' : 'tracks'}
          </p>
          </div>
          </div>
        </div>

        {/* Favorites list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Heart className="mb-4 h-12 w-12 animate-pulse text-muted-foreground" />
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12"
          >
            <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No favorites yet</h3>
            <p className="text-sm text-muted-foreground">
              Tap the heart icon on tracks to add them here
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {favorites.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TrackCard
                  track={track}
                  tracks={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
