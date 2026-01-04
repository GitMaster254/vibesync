import { useState } from 'react';
import {
  ChevronDown,
  MoreVertical,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Share2,
  X,
  Music,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { usePlayerStore } from '@/store/usePlayerStore';
import { seekToTime, formatTime } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type Panel = 'upNext' | 'lyrics' | null;

// Fallback Artwork Component
function FallbackArtwork({ size }: { size?: number }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800',
        size ? `w-[${size}px] h-[${size}px]` : 'w-full h-full'
      )}
    >
      <Music className={cn(size ? `w-[${size}px] h-[${size}px]` : 'w-24 h-24')} strokeWidth={1.5} />
    </div>
  );
}

export default function Player() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<Panel>(null);

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    repeat,
    setIsPlaying,
    cycleRepeat,
    nextTrack,
    previousTrack,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  const getArtwork = (size?: number) => {
    return currentTrack.coverArt ? (
      <img
        src={currentTrack.coverArt}
        alt={currentTrack.title}
        className="h-full w-full object-cover"
      />
    ) : (
      <FallbackArtwork size={size} />
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">

      {/* 🌫 Blurred Album Background */}
      <motion.div
        key={currentTrack.coverArt || 'fallback'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 blur-[120px] scale-150"
        style={{
          backgroundImage: currentTrack.coverArt
            ? `url(${currentTrack.coverArt})`
            : 'linear-gradient(to bottom right, #111, #333)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronDown className="h-8 w-8 opacity-80" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-6 w-6 opacity-80" />
          </Button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center px-10">
          <motion.div
            key={currentTrack.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[340px] aspect-square rounded-[40px] overflow-hidden shadow-2xl"
          >
            {getArtwork()}
          </motion.div>
        </div>

        {/* Track Info */}
        <div className="px-10 pb-2">
          <h1 className="text-3xl font-bold truncate">{currentTrack.title}</h1>
          <p className="text-xl text-muted-foreground mt-1 truncate">
            {currentTrack.artist || 'Unknown Artist'}
          </p>
        </div>

        {/* Progress */}
        <div className="px-10 py-6">
          <Slider
            value={[progress]}
            onValueChange={(v) => seekToTime((v[0] / 100) * duration)}
            max={100}
            step={0.1}
          />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground font-bold tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-10 pb-8">
          <Button variant="ghost" size="icon" onClick={cycleRepeat} className="opacity-60">
            <RepeatIcon className="h-6 w-6" />
          </Button>

          <Button variant="ghost" size="icon" onClick={previousTrack}>
            <SkipBack className="h-10 w-10" />
          </Button>

          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-20 w-20 rounded-full bg-primary/10 backdrop-blur-xl border border-border"
          >
            {isPlaying ? (
              <Pause className="h-10 w-10" />
            ) : (
              <Play className="h-10 w-10 ml-1" />
            )}
          </Button>

          <Button variant="ghost" size="icon" onClick={nextTrack}>
            <SkipForward className="h-10 w-10" />
          </Button>

          <Button variant="ghost" size="icon" className="opacity-60">
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Mini Tabs (open drawer) */}
        <div className="relative bg-muted/60 backdrop-blur-3xl rounded-t-[40px] pt-4 pb-8 border-t border-border">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

          <div className="flex justify-around px-10">
            <button
              onClick={() => setActivePanel('upNext')}
              className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground"
            >
              UP NEXT
            </button>

            <button
              onClick={() => setActivePanel('lyrics')}
              className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground"
            >
              LYRICS
            </button>
          </div>
        </div>

        {/* 🔽 Persistent Bottom Drawer */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 z-40
                         h-[60vh]
                         rounded-t-[32px]
                         bg-background/90
                         backdrop-blur-2xl
                         border-t border-border
                         px-6 pt-6 pb-10"
            >
              {/* Drawer Header Tabs */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-8">
                  <button
                    onClick={() => setActivePanel('upNext')}
                    className={cn(
                      'text-xs font-black uppercase tracking-[0.25em] pb-2',
                      activePanel === 'upNext'
                        ? 'text-foreground border-b-2 border-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    UP NEXT
                  </button>

                  <button
                    onClick={() => setActivePanel('lyrics')}
                    className={cn(
                      'text-xs font-black uppercase tracking-[0.25em] pb-2',
                      activePanel === 'lyrics'
                        ? 'text-foreground border-b-2 border-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    LYRICS
                  </button>
                </div>

                <button onClick={() => setActivePanel(null)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Drawer Content */}
              {activePanel === 'upNext' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl overflow-hidden">
                      {currentTrack.coverArt ? (
                        <img
                          src={currentTrack.coverArt}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FallbackArtwork size={56} />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold truncate">
                        {currentTrack.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {currentTrack.artist || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Queue coming soon…
                  </p>
                </div>
              )}

              {activePanel === 'lyrics' && (
                <div className="max-h-full overflow-y-auto text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  Lyrics will appear here,
                  synced with the music 🎶
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}