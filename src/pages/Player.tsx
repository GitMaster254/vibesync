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
  GripVertical,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

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
        'flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg',
        size ? `w-[${size}px] h-[${size}px]` : 'w-full h-full'
      )}
    >
      <Music className={cn(size && size < 40 ? 'w-4 h-4' : 'w-1/2 h-1/2')} strokeWidth={1.5} />
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
    queue,
    queueIndex,
    setIsPlaying,
    cycleRepeat,
    nextTrack,
    previousTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    setQueue,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  // Helper to get artwork or fallback
  const getArtwork = (track: any, size?: number) => {
    return track.coverArt ? (
      <img
        src={track.coverArt}
        alt={track.title}
        className="h-full w-full object-cover"
      />
    ) : (
      <FallbackArtwork size={size} />
    );
  };

  const handleReorder = (newUpcoming: typeof queue) => {
    // Keep played tracks, append the newly ordered upcoming tracks
    const updatedQueue = [...queue.slice(0, queueIndex + 1), ...newUpcoming];
    setQueue(updatedQueue);
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
            {getArtwork(currentTrack)}
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
            {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={nextTrack}>
            <SkipForward className="h-10 w-10" />
          </Button>

          <Button variant="ghost" size="icon" className="opacity-60">
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Mini Tabs */}
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
              className="absolute bottom-0 left-0 right-0 z-40 h-[65vh] rounded-t-[32px] bg-background/95 backdrop-blur-2xl border-t border-border px-6 pt-6 pb-10 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex gap-8">
                  <button
                    onClick={() => setActivePanel('upNext')}
                    className={cn(
                      'text-xs font-black uppercase tracking-[0.25em] pb-2 transition-colors',
                      activePanel === 'upNext'
                        ? 'text-foreground border-b-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    UP NEXT
                  </button>
                  <button
                    onClick={() => setActivePanel('lyrics')}
                    className={cn(
                      'text-xs font-black uppercase tracking-[0.25em] pb-2 transition-colors',
                      activePanel === 'lyrics'
                        ? 'text-foreground border-b-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    LYRICS
                  </button>
                </div>
                <button 
                  onClick={() => setActivePanel(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-hidden">
                {activePanel === 'upNext' && (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                        Drag to Reorder
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] font-bold text-muted-foreground hover:text-destructive"
                        onClick={clearQueue}
                      >
                        CLEAR QUEUE
                      </Button>
                    </div>

                    <Reorder.Group
                      axis="y"
                      values={queue.slice(queueIndex + 1)}
                      onReorder={handleReorder}
                      className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar"
                    >
                      {queue.slice(queueIndex + 1).length > 0 ? (
                        queue.slice(queueIndex + 1).map((track, relativeIndex) => {
                          const actualIndex = queueIndex + 1 + relativeIndex;
                          return (
                            <Reorder.Item
                              key={track.id}
                              value={track}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              whileDrag={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                              className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-all"
                            >
                              {/* Drag Handle */}
                              <div className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity">
                                <GripVertical className="h-5 w-5" />
                              </div>

                              {/* Artwork */}
                              <div 
                                className="relative h-12 w-12 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 shadow-md"
                                onClick={() => playTrack(track, queue)}
                              >
                                {getArtwork(track, 48)}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="h-5 w-5 fill-current text-white" />
                                </div>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-sm">{track.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                              </div>

                              {/* Remove Button - High Visibility */}
                              <Button 
                                variant="secondary" 
                                size="icon" 
                                className="h-8 w-8 rounded-full bg-muted/80 hover:bg-destructive hover:text-destructive-foreground opacity-100 shadow-sm border border-border transition-all"
                                onClick={() => removeFromQueue(actualIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </Reorder.Item>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-30 py-10">
                          <Music className="h-12 w-12 mb-2" />
                          <p className="text-sm italic font-medium">Your queue is empty</p>
                        </div>
                      )}
                    </Reorder.Group>
                  </div>
                )}

                {activePanel === 'lyrics' && (
                  <div className="h-full overflow-y-auto pr-2 custom-scrollbar text-lg font-medium leading-relaxed text-muted-foreground/80 whitespace-pre-line pb-10">
                    Lyrics will appear here,
                    synced with the music 🎶
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
