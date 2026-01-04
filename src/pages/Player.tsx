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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { usePlayerStore } from '@/store/usePlayerStore';
import { seekToTime, formatTime } from '@/lib/audio';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export default function Player() {
  const navigate = useNavigate();
  const [showUpNext, setShowUpNext] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">

      {/* 🌫 Dynamic Blurred Background */}
      <motion.div
        key={currentTrack.coverArt}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 z-0 blur-[120px] scale-150 pointer-events-none"
        style={{
          backgroundImage: `url(${currentTrack.coverArt})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronDown className="h-8 w-8 text-white/80" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-6 w-6 text-white/80" />
          </Button>
        </div>

        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center px-10">
          <motion.div
            key={currentTrack.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-[340px] aspect-square rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            <img
              src={currentTrack.coverArt || '/placeholder.jpg'}
              alt={currentTrack.title}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>

        {/* Track Info */}
        <div className="px-10 pb-2">
          <h1 className="text-3xl font-bold truncate">{currentTrack.title}</h1>
          <p className="text-xl text-white/60 mt-1 truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-10 py-6">
          <Slider
            value={[progress]}
            onValueChange={(v) => seekToTime((v[0] / 100) * duration)}
            max={100}
            step={0.1}
          />
          <div className="mt-3 flex justify-between text-xs text-white/30 font-bold tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-10 pb-10">
          <Button variant="ghost" size="icon" onClick={cycleRepeat} className="text-white/50">
            <RepeatIcon className="h-6 w-6" />
          </Button>

          <Button variant="ghost" size="icon" onClick={previousTrack}>
            <SkipBack className="h-10 w-10" />
          </Button>

          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/10"
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

          <Button variant="ghost" size="icon" className="text-white/50">
            <Share2 className="h-6 w-6" />
          </Button>
        </div>

        {/* Bottom Navigation Tray */}
        <div className="relative bg-white/5 backdrop-blur-3xl rounded-t-[40px] pt-4 pb-10 border-t border-white/10">
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

          <div className="flex justify-around px-10">
            <button
              onClick={() => {
                setShowUpNext(!showUpNext);
                setShowLyrics(false);
              }}
              className={cn(
                'text-xs font-black uppercase tracking-[0.25em] transition-colors',
                showUpNext ? 'text-white' : 'text-white/30'
              )}
            >
              Up Next
            </button>

            <button
              onClick={() => {
                setShowLyrics(!showLyrics);
                setShowUpNext(false);
              }}
              className={cn(
                'text-xs font-black uppercase tracking-[0.25em] transition-colors',
                showLyrics ? 'text-white' : 'text-white/30'
              )}
            >
              Lyrics
            </button>
          </div>
        </div>

        {/* 🔽 Animated Bottom Panels */}
        <AnimatePresence>
          {showUpNext && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 px-10 pb-20 bg-black/50 backdrop-blur-2xl"
            >
              <h3 className="text-sm font-bold tracking-widest mb-4">
                UP NEXT
              </h3>
              <p className="text-sm text-white/60">
                Queue coming soon…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLyrics && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute bottom-0 left-0 right-0 px-10 pb-20 max-h-[45vh] overflow-y-auto bg-black/50 backdrop-blur-2xl"
            >
              <h3 className="text-sm font-bold tracking-widest mb-4">
                LYRICS
              </h3>
              <p className="text-sm leading-relaxed text-white/60 whitespace-pre-line">
                Lyrics will appear here,
                synced with the music 🎶
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}