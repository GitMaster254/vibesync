import { Music, Info, Shield, Trash2, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { addTrack, type Track } from '@/lib/db';
import { type ImportProgress } from '@/lib/importWithProgress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { getStoredTheme, getSystemTheme, setTheme, type Theme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { isHapticsEnabled } from '@/lib/haptics';

/**
 * Settings page - App configuration and info
 */
export default function Settings() {
  // Import progress state
  const [importProgress, setImportProgress] = useState<ImportProgress>({ active: false, total: 0, current: 0 });
  const [importMinimized, setImportMinimized] = useState(false);
  // Theme state is controlled here; persisted and applied via lib/theme
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const switchRef = useRef<HTMLButtonElement | null>(null);

  // Ripple overlay state
  const [ripple, setRipple] = useState<{
    active: boolean;
    x: number;
    y: number;
    color: string;
    radius: number;
    toTheme: Theme;
  }>({ active: false, x: 0, y: 0, color: 'transparent', radius: 0, toTheme: 'light' });

  useEffect(() => {
    // Initialize from stored or system theme
    const initial = getStoredTheme() ?? getSystemTheme();
    setIsDarkTheme(initial === 'dark');
  }, []);

  const startRipple = (toTheme: Theme) => {
    // Determine origin at the center of the switch for both mouse and keyboard toggles
    let x = window.innerWidth / 2;
    let y = 0; // Will adjust below
    const el = switchRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else {
      y = window.innerHeight / 2;
    }

    // Max radius to cover entire viewport from (x,y)
    const dx = Math.max(x, window.innerWidth - x);
    const dy = Math.max(y, window.innerHeight - y);
    const radius = Math.ceil(Math.hypot(dx, dy));

    const color = toTheme === 'dark' ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)';

    setRipple({ active: true, x, y, color, radius, toTheme });
  };

  const handleThemeChange = (checked: boolean) => {
    const nextTheme: Theme = checked ? 'dark' : 'light';
    // Switch UI updates immediately
    setIsDarkTheme(checked);
    // Start ripple animation; apply theme at the end
    startRipple(nextTheme);
  };

  // Auto-scan state
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [scanFolders, setScanFolders] = useState<string[]>([]);
  // Haptics state
  const [haptics, setHaptics] = useState<boolean>(() => isHapticsEnabled());

  // Karaoke transition effect state
  const karaokeEffects = [
    { value: 'curtain', label: 'Stage Curtain', description: 'Theatrical curtain slide' },
    { value: 'spotlight', label: 'Spotlight Sweep', description: 'Stage lighting effect' },
    { value: 'vinyl', label: 'Vinyl Spin', description: 'Rotating music disc' },
    { value: 'neon', label: 'Neon Glow', description: 'Pulsing neon waves' },
    { value: 'zoom', label: 'Zoom & Blur', description: 'Cinematic transition' },
  ];
  const [karaokeEffect, setKaraokeEffect] = useState(() => 
    localStorage.getItem('vibesync-karaoke-effect') || 'curtain'
  );
  const [karaokeMinimized, setKaraokeMinimized] = useState(true);

  const handleKaraokeEffectChange = (value: string) => {
    setKaraokeEffect(value);
    localStorage.setItem('vibesync-karaoke-effect', value);
    toast.success(`Karaoke effect: ${karaokeEffects.find(e => e.value === value)?.label}`);
  };


  const handleHapticsToggle = (checked: boolean) => {
    setHaptics(checked);
    toast.success(checked ? 'Haptics enabled' : 'Haptics disabled');
  };

// importAudioFilesWithProgress now handled by Web Worker

  const handleClearCache = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all app data? This will delete all tracks, playlists, and settings. This action cannot be undone.'
    );
    
    if (!confirmed) return;

    try {
      // Clear IndexedDB
      const { clearAllData } = await import('@/lib/db');
      await clearAllData();

      // Clear localStorage
      localStorage.clear();

      // Clear sessionStorage
      sessionStorage.clear();

      // Show success message
      toast.success('All app data cleared successfully');

      // Reload the page after a short delay to reinitialize the app
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error('Failed to clear app data. Please try closing all tabs and reopening.');
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'VibeSync',
      text: 'Check out VibeSync – your personal music player.',
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Share sheet opened');
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast.success('Link copied to clipboard');
      }
    } catch (err: unknown) {
      // Ignore user cancellation; show error for other failures
      const name = (err as { name?: string } | null)?.name;
      if (name && name.toLowerCase().includes('abort')) return;
      toast.error('Unable to share');
    }
  };

  // Ambient Mode
  const [ambientEnabled, setAmbientEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('vibesync-ambient-enabled') === 'true'; } catch { return false; }
  });
  const toggleAmbient = (checked: boolean) => {
    setAmbientEnabled(checked);
    try { localStorage.setItem('vibesync-ambient-enabled', String(checked)); } catch {
      // ignore storage write failures
    }
    toast.success(checked ? 'Ambient Mode enabled' : 'Ambient Mode disabled');
  };

  const settingsSections = [
    {
      title: 'About',
      items: [
        { icon: Music, label: 'Version', value: '1.0.0' },
        { icon: Info, label: 'PWA Status', value: 'Installed' },
      ],
    },
    {
      title: 'Storage',
      items: [
        { icon: Shield, label: 'Data stored locally', value: 'Secure' },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-40 pt-4">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">App configuration and info</p>
        </div>

        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-lg border border-border bg-card p-4 mb-4"
        >
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
            Theme
          </h2>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{isDarkTheme ? 'Dark Mode' : 'Light Mode'}</span>
            <Switch ref={switchRef as unknown as React.RefObject<HTMLButtonElement>} checked={isDarkTheme} onCheckedChange={handleThemeChange} />
          </div>
        </motion.div>

        {/* Party Effect Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-border bg-card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Party Mode
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setKaraokeMinimized(!karaokeMinimized)}
              className="h-8 px-3 text-xs"
            >
              {karaokeMinimized ? 'Expand' : 'Minimize'}
            </Button>
          </div>
          
          {!karaokeMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <label className="font-medium">Transition Effect</label>
              <div className="grid gap-2">
                {karaokeEffects.map((effect) => (
                  <button
                    key={effect.value}
                    onClick={() => handleKaraokeEffectChange(effect.value)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left',
                      karaokeEffect === effect.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{effect.label}</div>
                      <div className="text-xs text-muted-foreground">{effect.description}</div>
                    </div>
                    {karaokeEffect === effect.value && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          
          {karaokeMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              Current: {karaokeEffects.find(e => e.value === karaokeEffect)?.label}
            </motion.div>
          )}
        </motion.div>

        {/* Haptics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-lg border border-border bg-card p-4 mb-4"
        >
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
            Haptics
          </h2>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Vibrate on play/pause/skip</span>
            <Switch checked={haptics} onCheckedChange={handleHapticsToggle} />
          </div>
          <p className="text-xs text-muted-foreground">Only on supported devices. You can disable this anytime.</p>
        </motion.div>

        {/* Ambient Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="rounded-lg border border-border bg-card p-4 mb-4"
        >
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
            Ambient Mode
          </h2>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Show subtle colors when idle</span>
            <Switch checked={ambientEnabled} onCheckedChange={toggleAmbient} />
          </div>
          <p className="text-xs text-muted-foreground">Fills the screen with a soft, color-cycling background after 30s of inactivity. Tap to dismiss.</p>
        </motion.div>

        {/* Ripple overlay for theme transition */}
        {ripple.active && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ backgroundColor: ripple.color }}
            initial={{ clipPath: `circle(0px at ${ripple.x}px ${ripple.y}px)` }}
            animate={{ clipPath: `circle(${ripple.radius}px at ${ripple.x}px ${ripple.y}px)` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            onAnimationComplete={() => {
              // Apply theme and remove overlay
              setTheme(ripple.toTheme);
              setRipple(prev => ({ ...prev, active: false }));
            }}
          />
        )}

        {/* Settings sections */}
        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase">
              Actions
            </h2>
            <Button
              variant="default"
              className="w-full gap-2 mb-2"
              onClick={handleShareApp}
            >
              <Share className="h-4 w-4" />
              Share App
            </Button>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={handleClearCache}
            >
              <Trash2 className="h-4 w-4" />
              Clear Cache
            </Button>
          </motion.div>

          {/* App Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted-foreground"
          >
            <p>VibeSync - Your Personal Music Player</p>
            <p className="mt-1">Built with React, TypeScript, and love for music</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
