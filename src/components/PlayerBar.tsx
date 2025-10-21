import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { vibrate } from '@/lib/haptics';

/**
 * Mini player bar - always visible at bottom of screen
 * Expands to full player on click
 */
export function PlayerBar() {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, setIsPlaying, nextTrack, previousTrack } = usePlayerStore();

  if (!currentTrack) return null;

  const handlePlayerClick = () => {
    navigate('/player');
  };

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-16 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-lg"
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={handlePlayerClick}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Album art */}
        <motion.div
          layoutId="player-art"
          className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden"
        >
          {currentTrack.coverArt ? (
            <img
              src={currentTrack.coverArt}
              alt={`${currentTrack.title} cover`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-gradient-primary" />
          )}
        </motion.div>
        
        {/* Track info with marquee effect */}
        <div className="flex-1 min-w-0">
          <div className="relative w-full overflow-hidden">
            <span
              className="block font-semibold text-sm whitespace-nowrap"
              style={{
                animation: currentTrack.title.length > 24 ? 'marquee 7s linear infinite' : undefined,
              }}
              aria-label={currentTrack.title}
            >
              {currentTrack.title}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { vibrate(12); previousTrack(); }}
            className="h-8 w-8"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { vibrate(10); setIsPlaying(!isPlaying); }}
            className={cn(
              'h-10 w-10 rounded-full',
              isPlaying && 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { vibrate(12); nextTrack(); }}
            className="h-8 w-8"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
      {/* Marquee keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </motion.div>
  );
}
