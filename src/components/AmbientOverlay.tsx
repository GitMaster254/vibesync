import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const KEY = 'vibesync-ambient-enabled';

export default function AmbientOverlay() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === 'true'; } catch { return false; }
  });
  const [visible, setVisible] = useState(false);
  const idleTimer = useRef<number | null>(null);

  const idleMs = 30000; // 30s idle threshold

  const resetTimer = () => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      if (enabled) setVisible(true);
    }, idleMs);
  };

  useEffect(() => {
    const updateFromStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEnabled(e.newValue === 'true');
    };
    window.addEventListener('storage', updateFromStorage);
    return () => window.removeEventListener('storage', updateFromStorage);
  }, []);

  useEffect(() => {
    const onActivity = () => {
      if (visible) setVisible(false);
      resetTimer();
    };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, onActivity, { passive: true } as any));
    resetTimer();
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      events.forEach(ev => window.removeEventListener(ev, onActivity as any));
    };
  }, [enabled, visible]);

  if (!enabled || !visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] cursor-pointer"
      onClick={() => setVisible(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ background: 'linear-gradient(120deg, #1e3a8a, #7c3aed, #ec4899)' }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/70 text-sm">Ambient Mode — tap to dismiss</div>
      </div>
    </motion.div>
  );
}
