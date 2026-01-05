import { useState, useMemo } from 'react';
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
  Shuffle,
  RotateCcw,
  RotateCw,
  Heart,
  ArrowRightRight,
  Loader2 // Added for lyrics loading
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';

import { usePlayerStore } from '@/store/usePlayerStore';
import { seekToTime, formatTime } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type Panel = 'upNext' | 'lyrics' | null;

const triggerHaptic = (ms = 15) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(ms);
  }
};

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

function QueueItem({ 
  track, 
  actualIndex, 
  onPlay, 
  onRemove, 
  getArtwork 
}: { 
  track: any, 
  actualIndex: number, 
  onPlay: () => void, 
  onRemove: (idx: number) => void,
  getArtwork: (track: any, size: number) => JSX.Element
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={track}
      id={track.id}
      dragListener={false}
      dragControls={dragControls}
      style={{ touchAction: 'pan-y' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileDrag={{ 
        scale: 1.03, 
        backgroundColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
      }}
      className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors select-none"
    >
      <div 
        className="cursor-grab active:cursor-grabbing p-2 -ml-2 opacity-40 hover:opacity-100 active:text-primary transition-all touch-none"
        onPointerDown={(e) => {
          triggerHaptic(20);
          dragControls.start(e);
        }}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="relative h-12 w-12 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 shadow-md" onClick={onPlay}>
        {getArtwork(track, 48)}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="h-5 w-5 fill-current text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>

      <Button 
        variant="secondary" 
        size="icon" 
        className="h-8 w-8 rounded-full bg-muted/50 hover:bg-destructive hover:text-white transition-all shadow-sm"
        onClick={() => onRemove(actualIndex)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Reorder.Item>
  );
}

export default function Player() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [isFavourite, setIsFavourite] = useState(false); 

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    queue,
    queueIndex,
    setIsPlaying,
    nextTrack,
    previousTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
    setQueue,
    playbackMode, 
    togglePlaybackMode,
    // Lyrics State
    lyrics,
    isFetchingLyrics,
    lyricsError
  } = usePlayerStore();

  const upcomingTracks = useMemo(() => queue.slice(queueIndex + 1), [queue, queueIndex]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getPlaybackIcon = () => {
    switch (playbackMode) {
      case 'loop-all': return <Repeat className="h-6 w-6 text-primary" />;
      case 'repeat-one': return <Repeat1 className="h-6 w-6 text-primary" />;
      case 'shuffle': return <Shuffle className="h-6 w-6 text-primary" />;
      default: return <ArrowRightRight className="h-6 w-6 opacity-60" />; 
    }
  };

  const getArtwork = (track: any, size?: number) => {
    return track.coverArt ? (
      <img src={track.coverArt} alt={track.title} className="h-full w-full object-cover" />
    ) : (
      <FallbackArtwork size={size} />
    );
  };

  const handleClearQueue = () => {
    setActivePanel(null);
    clearQueue();
    navigate(-1);
  };

  const handleReorder = (newUpcoming: typeof queue) => {
    triggerHaptic(10);
    const updatedQueue = [...queue.slice(0, queueIndex + 1), ...newUpcoming];
    setQueue(updatedQueue);
  };

  const handleSeek = (amount: number) => {
    triggerHaptic(10);
    seekToTime(Math.max(0, Math.min(duration, currentTime + amount)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-hidden">
      <motion.div
        key={currentTrack.coverArt || 'fallback'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 blur-[120px] scale-150"
        style={{
          backgroundImage: currentTrack.coverArt ? `url(${currentTrack.coverArt})` : 'none',
          backgroundColor: !currentTrack.coverArt ? '#111' : 'transparent',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between p-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronDown className="h-8 w-8 opacity-80" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-6 w-6 opacity-80" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center px-10">
          <motion.div
            key={currentTrack.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-[340px] aspect-square rounded-[40px] overflow-hidden shadow-2xl"
          >
            {getArtwork(currentTrack)}
          </motion.div>
        </div>

        <div className="px-10 pb-2 text-center">
          <h1 className="text-3xl font-bold truncate">{currentTrack.title}</h1>
          <p className="text-xl text-muted-foreground mt-1 truncate">{currentTrack.artist}</p>
        </div>

        <div className="px-10 py-6">
          <Slider value={[progress]} onValueChange={(v) => seekToTime((v[0] / 100) * duration)} max={100} step={0.1} />
          <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground font-bold tracking-widest">
            <div className="flex items-center gap-2">
              <button onClick={() => handleSeek(-10)} className="hover:text-primary transition-colors p-1">
                <RotateCcw className="h-4 w-4" />
              </button>
              <span>{formatTime(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{formatTime(duration)}</span>
              <button onClick={() => handleSeek(10)} className="hover:text-primary transition-colors p-1">
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-10 pb-8">
          <Button variant="ghost" size="icon" onClick={togglePlaybackMode}>
            {getPlaybackIcon()}
          </Button>

          <Button variant="ghost" size="icon" onClick={previousTrack}>
            <SkipBack className="h-10 w-10" />
          </Button>
          
          <Button onClick={() => setIsPlaying(!isPlaying)} className="h-20 w-20 rounded-full bg-primary/10 backdrop-blur-xl border border-border">
            {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={nextTrack}>
            <SkipForward className="h-10 w-10" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { triggerHaptic(20); setIsFavourite(!isFavourite); }}
          >
            <Heart className={cn("h-6 w-6 transition-colors", isFavourite ? "fill-red-500 text-red-500 opacity-100" : "opacity-60")} />
          </Button>
        </div>

        <div className="relative bg-muted/60 backdrop-blur-3xl rounded-t-[40px] pt-4 pb-8 border-t border-border">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
          <div className="flex justify-around px-10">
            <button onClick={() => setActivePanel('upNext')} className={cn("text-xs font-black uppercase tracking-[0.25em]", activePanel === 'upNext' ? "text-primary" : "text-muted-foreground")}>UP NEXT</button>
            <button onClick={() => setActivePanel('lyrics')} className={cn("text-xs font-black uppercase tracking-[0.25em]", activePanel === 'lyrics' ? "text-primary" : "text-muted-foreground")}>LYRICS</button>
          </div>
        </div>

        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-40 h-[65vh] rounded-t-[32px] bg-background/95 backdrop-blur-2xl border-t border-border px-6 pt-6 pb-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div className="flex gap-8">
                  <button onClick={() => setActivePanel('upNext')} className={cn('text-xs font-black pb-2 transition-colors', activePanel === 'upNext' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground')}>UP NEXT</button>
                  <button onClick={() => setActivePanel('lyrics')} className={cn('text-xs font-black pb-2 transition-colors', activePanel === 'lyrics' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground')}>LYRICS</button>
                </div>
                <button onClick={() => setActivePanel(null)} className="p-2 bg-muted/50 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {activePanel === 'upNext' && (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Queue</span>
                      <Button variant="ghost" size="sm" className="text-[10px] text-destructive font-bold" onClick={handleClearQueue}>CLEAR QUEUE</Button>
                    </div>

                    <Reorder.Group
                      axis="y"
                      values={upcomingTracks}
                      onReorder={handleReorder}
                      layoutScroll
                      className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar overflow-x-hidden"
                    >
                      {upcomingTracks.length > 0 ? (
                        upcomingTracks.map((track, relativeIndex) => (
                          <QueueItem 
                            key={track.id}
                            track={track}
                            actualIndex={queueIndex + 1 + relativeIndex}
                            onPlay={() => playTrack(track, queue)}
                            onRemove={removeFromQueue}
                            getArtwork={getArtwork}
                          />
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20">
                          <Music className="h-10 w-10" />
                          <p className="text-sm">Empty</p>
                        </div>
                      )}
                    </Reorder.Group>
                  </div>
                )}
                {activePanel === 'lyrics' && (
                  <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
                    {isFetchingLyrics ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Searching Database...</p>
                      </div>
                    ) : lyricsError ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 px-10">
                        <Music className="h-12 w-12" />
                        <p className="text-lg font-medium italic leading-tight">{lyricsError}</p>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentTrack.id}
                        className="text-xl font-bold leading-relaxed text-center px-4 whitespace-pre-line"
                      >
                        {lyrics}
                      </motion.div>
                    )}
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
