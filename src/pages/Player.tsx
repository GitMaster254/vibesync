import { useEffect, useState, useRef } from 'react';
import { ChevronDown, Heart, Shuffle, Repeat, Repeat1, SkipBack, SkipForward, Play, Pause, Mic, Star, Headphones, X, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { ListeningParty } from '@/components/ListeningParty';
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
    volume,
    currentTime,
    duration,
    shuffle,
    repeat,
    setIsPlaying,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    previousTrack,
  } = usePlayerStore();

  // Add state for countdown
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      if (containerRef.current && document.fullscreenEnabled) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

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
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && karaokeMode) {
        // If fullscreen exits, also exit karaoke mode
        setKaraokeMode(false);
        setPerformance(null);
      }
      // Always ensure transition overlay is cleared on fullscreen changes
      setShowTransition(false);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      setShowTransition(false);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [karaokeMode]);

  // Handle karaoke mode activation
  const activateKaraokeMode = async () => {
    setShowTransition(true);
    await enterFullscreen();
    // Wait for transition animation
    setTimeout(() => {
      setKaraokeMode(true);
      setShowSpeakerTip(true);
      setShowTransition(false);
      // Pause and seek to zero
      setIsPlaying(false);
      seekToTime(0);
      toast.info('Karaoke mode activated! 🎤');
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

  // Karaoke play button handler
  const handleKaraokePlay = async () => {
    setShowCountdown(true);
    setCountdown(3);
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(res => setTimeout(res, 1000)); // 1 second per number
    }
    setShowCountdown(false);
    setIsPlaying(true);
  };

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

      {/* Karaoke Mode Full Screen */}
      {karaokeMode ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-purple-900 via-black to-indigo-900">
          {/* Countdown Overlay */}
          {showCountdown && (
            <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60">
              {countdown && (
                <span
                  className={`text-[8rem] font-extrabold drop-shadow-lg animate-fade-in-out ${countdown === 3 ? 'text-red-500' : countdown === 2 ? 'text-yellow-400' : 'text-green-500'}`}
                  style={{ transition: 'opacity 0.5s' }}
                >
                  {countdown}
                </span>
              )}
            </div>
          )}

          {/* Karaoke Header */}
          <div className="flex items-center justify-between p-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-pink-500 to-purple-500 bg-clip-text text-transparent">
              🎤 Karaoke Mode
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

          {/* Karaoke Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
            {/* Speaker Tip */}
            {showSpeakerTip && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl rounded-lg border border-primary/30 bg-primary/10 p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <Headphones className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-base font-medium">Better Experience</p>
                    <p className="text-sm text-muted-foreground">
                      Connect external speakers or earphones for the best karaoke experience!
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSpeakerTip(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Lyrics Display */}
            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-8 mb-6 min-h-[400px]">
              <div className="space-y-6 text-center">
                <div className="text-2xl font-bold text-primary mb-4">
                  {currentTrack.title}
                </div>
                <div className="text-lg text-muted-foreground mb-4">
                  {currentTrack.artist}
                </div>
                <div className="space-y-4 mt-8">
                  <p className="text-2xl leading-relaxed opacity-50 animate-pulse">
                    [Instrumental]
                  </p>
                  <p className="text-3xl leading-relaxed font-medium">
                    Sing along with the music...
                  </p>
                  <p className="text-2xl leading-relaxed opacity-75">
                    🎵 Feel the rhythm 🎵
                  </p>
                  <p className="text-2xl leading-relaxed opacity-50 animate-pulse">
                    [Music continues]
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-12">
                  💡 Lyrics sync coming soon! For now, feel the rhythm and sing your heart out! 🎵
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="pb-4 w-full max-w-3xl mx-auto"
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
              <div className="flex items-center justify-center gap-8">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={showCountdown ? undefined : handleKaraokePlay}
                  className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20"
                  disabled={showCountdown}
                >
                  {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
              </div>
            </motion.div>

            {/* Performance Rating (only show at end) */}
            {performance !== null && !isPlaying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-purple-500/10 backdrop-blur-sm p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-medium">Performance Score</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-5 w-5',
                          i < Math.floor(performance / 20)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-primary">{performance}</span>
                  <span className="text-lg text-muted-foreground">/ 100</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {performance >= 90 ? '🔥 Amazing performance!' : performance >= 80 ? '✨ Great job!' : performance >= 70 ? '👍 Good effort!' : 'Keep practicing!'}
                </p>
              </motion.div>
            )}
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
                    Swipe left for Karaoke • Swipe right for Visualization
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={activateKaraokeMode}
                  className="h-10 w-10"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => carouselApi?.scrollNext()}
                  className="h-10 w-10"
                >
                  <Headphones className="h-5 w-5" />
                </Button>
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
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    const partySection = document.getElementById('listening-party-section');
                    partySection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Users className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Listening Party Section */}
          <motion.div
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
          </motion.div>

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
            {/* Playback modes */}
            <div className="mb-6 flex items-center justify-center gap-8">
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
                onClick={() => { vibrate(8); cycleRepeat(); }}
                className={cn(repeat !== 'none' && 'text-primary')}
              >
                <RepeatIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-center gap-4">
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
            </div>
          </motion.div>

          {/* Bottom safe area */}
          <div className="h-safe-bottom" />
        </>
      )}
    </div>
  );
}
