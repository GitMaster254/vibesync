import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Heart, Shuffle, Repeat, Repeat1, SkipBack, SkipForward, Play, Pause, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/store/usePlayerStore';
import { seekToTime, formatTime } from '@/lib/audio';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import VisualizerBars from '@/components/VisualizerBars';
import { updateTrack } from '@/lib/db';
import { toast } from 'sonner';
import { getKaraokeEffect, getEffectAnimation } from '@/lib/karaokeEffects';
import { vibrate } from '@/lib/haptics';
import { ListeningParty } from '@/components/ListeningParty';
import { getCurrentUser } from '@/lib/auth';

/**
 * Full-screen player view
 * Shows album art, controls, and progress
 * Includes fullscreen karaoke mode with visual transitions
 */
export default function Player() {
  const navigate = useNavigate();
  const [karaokeMode, setKaraokeMode] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showSpeakerTip, setShowSpeakerTip] = useState(false);
  const [performance, setPerformance] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0], [0, 1]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    shuffle,
    repeat,
    setIsPlaying,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    previousTrack,
  } = usePlayerStore();

  // Exit fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {

    // document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      setShowTransition(false);
      // document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [karaokeMode]);

  // Handle karaoke mode activation
  const activateKaraokeMode = async () => {
    setShowTransition(true);
   // await enterFullscreen();
    // Wait for transition animation
    setTimeout(() => {
      setKaraokeMode(true);
      setShowSpeakerTip(true);
      setShowTransition(false);
      // Pause and seek to zero
      setIsPlaying(false);
      seekToTime(0);
      toast.info('Party mode activated! 🎤');
    }, 800);
  };

  // Handle karaoke mode deactivation
  const deactivateKaraokeMode = async () => {
    // First exit karaoke mode to trigger the transition
    setKaraokeMode(false);
    setPerformance(null);
    setShowTransition(true);
    
    // Wait for transition animation, then clear overlay and exit fullscreen
    setTimeout(async () => {
      setShowTransition(false);
      try { await exitFullscreen(); } catch (e) { /* ignore */ }
    }, 800);
  };

  // Handle swipe to karaoke mode
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100 && !karaokeMode) {
      // Swiped left on album art -> Karaoke
      activateKaraokeMode();
    } else if (info.offset.x > 100 && !karaokeMode) {
      // Swiped right on album art -> go to Visualizer slide
      carouselApi?.scrollNext();
    } else if (info.offset.x > 100 && karaokeMode) {
      // Swiped right while in karaoke -> exit karaoke
      deactivateKaraokeMode();
    }
    x.set(0);
  };

  // Redirect if no track
  useEffect(() => {
    if (!currentTrack) {
      navigate('/');
    }
  }, [currentTrack, navigate]);

  useEffect(() => {
  if (showSpeakerTip) {
    const timer = setTimeout(() => {
      setShowSpeakerTip(false);
    }, 5000);

    return () => clearTimeout(timer);
  }
}, [showSpeakerTip]);

  // Karaoke play button handler

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * duration;
    seekToTime(newTime);
  };

  const handleToggleFavorite = async () => {
    if (!currentTrack) return;
    
    try {
      const updated = { ...currentTrack, favorite: !currentTrack.favorite };
      await updateTrack(updated);
      // Reflect change in local player state so UI updates immediately
      usePlayerStore.setState({ currentTrack: updated });
      toast.success(updated.favorite ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  // Get current karaoke effect
  const currentEffect = getKaraokeEffect();
  // Show transition animation when showTransition is true (for both enter and exit)
  const effectAnimation = getEffectAnimation(currentEffect, showTransition);

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Transition Overlay */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-background"
            {...effectAnimation}
          />
        )}
      </AnimatePresence>

      {/* Party Mode */}
      {karaokeMode ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-purple-900 via-black to-indigo-900">
          {/* Party Header */}
          <div className="flex items-center justify-between p-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent">
           Party Mode
            </h1> 
            <Button
              variant="ghost"
              size="icon"
              onClick={deactivateKaraokeMode}
              className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Party Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
                        {/* Listening Party Section */}
          <motion.div
            id="listening-party-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-lg p-4" 
          >
            <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border p-4">
              <ListeningParty
                userId={getCurrentUser().id}
                username={getCurrentUser().username}
              />
            </div>
          </motion.div>
          </div>
        </div>
      ) : (
        <>
          {/* Normal Player View */}
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
            <h2 className="text-sm font-medium">Now Playing</h2>
            <div className="w-10" />
          </motion.div>

          {/* Center content with swipeable pages: Now Playing (0) -> Visualizer (1) */}
          <div className="flex-1 flex items-center justify-center px-2">
            <Carousel className="w-full" opts={{ watchDrag: false }} setApi={setCarouselApi}>
              <CarouselContent>
                {/* Slide 1: Now Playing (existing album art card) */}
                <CarouselItem>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center px-6"
                  >
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={handleDragEnd}
                      style={{ x, opacity }}
                      className="relative aspect-square w-full max-w-md cursor-grab active:cursor-grabbing"
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-glow opacity-60 blur-3xl" />
                      <motion.div layoutId="player-art" className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl">
                        {currentTrack.coverArt ? (
                          <img
                            src={currentTrack.coverArt}
                            alt={`${currentTrack.title} cover`}
                            className="h-full w-full object-cover"
                            loading="eager"
                          />
                        ) : (
                          <div className="absolute inset-0 rounded-2xl bg-gradient-primary" />
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                  <div className="mt-6 text-center text-xs text-muted-foreground">
                    Swipe left for Party • Swipe right for Visualization
                  </div>
                </CarouselItem>

                {/* Slide 2: Visualizer */}
                <CarouselItem>
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_e, info) => {
                      // On visualizer slide: left swipe returns to album art, right swipe does nothing
                      if (info.offset.x < -100) {
                        carouselApi?.scrollPrev();
                      }
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex h-full items-center justify-center px-6"
                  >
                    <div className="w-full max-w-md">
                      <div className="mb-4 text-center text-sm text-muted-foreground">Visualizer</div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <VisualizerBars bars={24} height={180} accent="purple" />
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>

          {/* Track Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="px-8 pb-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="truncate text-2xl font-bold">{currentTrack.title}</h1>
                <p className="truncate text-muted-foreground">{currentTrack.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={activateKaraokeMode}
                  className="h-10 w-10"
                >
                  <Mic className="h-5 w-5" />
                </Button> */}
                {/* <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => carouselApi?.scrollNext()}
                  className="h-10 w-10"
                >
                  <Headphones className="h-5 w-5" />
                </Button> */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                >
                  <Heart
                    className={cn(
                      'h-6 w-6 transition-colors',
                      currentTrack.favorite ? 'fill-primary text-primary' : 'text-muted-foreground'
                    )}
                  />
                </Button>
                {/* <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    const partySection = document.getElementById('listening-party-section');
                    partySection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Users className="h-5 w-5" />
                </Button> */}
              </div>
            </div>
          </motion.div>

          {/* Listening Party Section */}
          {/* <motion.div
            id="listening-party-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="px-8 pb-4 mt-4 overflow-y-auto max-h-[calc(100vh-500px)]"
          >
            <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border p-4">
              <ListeningParty
                userId={getCurrentUser().id}
                username={getCurrentUser().username}
              />
            </div>
          </motion.div> */}

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="px-8 pb-4"
          >
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-8 pb-8"
          >

            {/* Main controls */}
            <div className="flex items-center justify-center gap-4">
                <Button
                variant="ghost"
                size="icon"
                onClick={() => { vibrate(8); toggleShuffle(); }}
                className={cn(shuffle && 'text-primary')}
              >
                <Shuffle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { vibrate(12); previousTrack(); }}
                className="h-12 w-12"
              >
                <SkipBack className="h-6 w-6" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={() => { vibrate(10); setIsPlaying(!isPlaying); }}
                className="h-16 w-16 rounded-full bg-gradient-primary shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => { vibrate(12); nextTrack(); }}
                className="h-12 w-12"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { vibrate(8); cycleRepeat(); }}
                className={cn(repeat !== 'none' && 'text-primary')}
              >
                <RepeatIcon className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          {/* Bottom safe area */}
          <div className="h-safe-bottom" />
        </>
      )}
    </div>
  );
}
