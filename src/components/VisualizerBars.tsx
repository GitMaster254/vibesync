import { useMemo } from 'react';
import { useAudioAnalyser } from '@/hooks/useAudioAnalyser';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  bars?: number; // 12..64
  height?: number; // px
  rounded?: boolean;
  accent?: 'primary' | 'teal' | 'pink' | 'purple';
};

export default function VisualizerBars({ className, bars = 24, height = 190, rounded = true, accent = 'primary' }: Props) {
  const { bins, level } = useAudioAnalyser({ bins: bars, fftSize: 256, smoothing: 0.8 });
  const barCount = Math.max(8, Math.min(64, bars));
  const items = useMemo(() => Array.from({ length: barCount }), [barCount]);

  const gradientClass =
    accent === 'teal' ? 'from-teal-400 to-emerald-500' :
    accent === 'pink' ? 'from-pink-400 to-fuchsia-500' :
    accent === 'purple' ? 'from-purple-400 to-violet-500' :
    'from-primary to-violet-500';

  return (
    <div className={cn('relative w-full select-none', className)} style={{ height }}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-white/0" />
      <div className="absolute inset-0 flex items-end gap-[6px] px-3">
        {items.map((_, i) => {
          const v = bins[i] ?? 0; // 0..255
          // normalize and add subtle global level influence
          const h = Math.max(4, (v / 255) * height * 0.95 + level * 10);
          return (
            <div key={i} className={cn('flex-1 bg-gradient-to-t', gradientClass, rounded ? 'rounded-t-full' : 'rounded-t')} style={{ transform: `scaleY(${h / height})`, transformOrigin: 'bottom', height }} />
          );
        })}
      </div>
      {/* subtle glow */}
      <div className="absolute inset-x-6 bottom-0 h-8 blur-2xl bg-primary/20 pointer-events-none" style={{ opacity: 0.4 + level * 0.6 }} />
    </div>
  );
}
