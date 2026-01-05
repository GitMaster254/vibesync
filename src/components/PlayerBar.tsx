import { Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { vibrate } from '@/lib/haptics';

/**
 * Fallback Artwork component to match Player and TrackCard style
 */
function FallbackArtwork({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg w-full h-full",
      className
    )}>
      <Music className="w-1/2 h-1/2 text-muted-foreground opacity-40" strokeWidth={1.5} />
    </div>
  );
}

/**
 * Mini player bar - always visible at bottom of screen
 */
export function PlayerBar({ sidebarOpen, isDesktop }) {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, setIsPlaying, nextTrack, previousTrack, currentTime, duration } = usePlayerStore();

  if (!currentTrack) return null;

  const handlePlayerClick = () => {
    navigate('/player');
  };
  
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function CircularProgress({ progress, size = 40 }: { progress: number; size?: number }) {
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300 ease-linear"
        />
      </svg>
    );
  }

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-lg",
        isDesktop ? "bottom-0" : "bottom-16"
      )}
      style={{
        ...(isDesktop && {
          left: sidebarOpen ? '16rem' : '5rem'
        })
      }}
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={handlePlayerClick}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Updated Album Art Section */}
        <motion.div
          layoutId="player-art"
          className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden shadow-sm"
        >
          {currentTrack.coverArt ? (
            <img
              src={currentTrack.coverArt}
              alt={`${currentTrack.title} cover`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <FallbackArtwork />
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

          <div className="relative h-10 w-10">
             <CircularProgress progress={progress} size={40} />
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => { vibrate(10); setIsPlaying(!isPlaying); }}
                 className={cn('absolute inset-0 h-10 w-10 rounded-full')}
               >
                {isPlaying ? (
                 <Pause className="h-5 w-5" />
                ) : (
                 <Play className="h-5 w-5 ml-0.5" />
                )}
             </Button>
          </div>
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
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </motion.div>
  );
}
