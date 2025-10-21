import { useEffect, useRef, useState } from 'react';
import { getAudioAnalyser } from '@/lib/audio';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * Lightweight audio analyser hook using Web Audio API.
 * - Uses a single global AnalyserNode with low FFT for performance
 * - Exposes overall level (0..1) and frequency bins (Uint8Array)
 */
export function useAudioAnalyser(opts?: { fftSize?: 256; smoothing?: number; bins?: number }) {
  const { isPlaying } = usePlayerStore();
  const fftSize = opts?.fftSize ?? 256;
  const smoothing = opts?.smoothing ?? 0.8;
  const targetBins = Math.max(8, Math.min(64, opts?.bins ?? 24));

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState(0);
  const [bins, setBins] = useState<Uint8Array>(() => new Uint8Array(targetBins));

  // Initialize analyser once using global singleton
  useEffect(() => {
    try {
      const { context, analyser } = getAudioAnalyser(fftSize, smoothing);
      ctxRef.current = context;
      analyserRef.current = analyser;
      setReady(true);
    } catch (err) {
      console.error('Failed to initialize audio analyser:', err);
    }

    return () => {
      // Don't disconnect or close - these are global singletons
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [fftSize, smoothing]);

  // Resize bins array if prop changes
  useEffect(() => {
    setBins(new Uint8Array(targetBins));
  }, [targetBins]);

  // Animation loop (runs only when playing)
  useEffect(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !ctx) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(freqData);
      // Downsample into targetBins buckets
      const bucketSize = Math.floor(freqData.length / targetBins) || 1;
      const nextBins = new Uint8Array(targetBins);
      let sum = 0;
      for (let i = 0; i < targetBins; i++) {
        let acc = 0;
        for (let j = 0; j < bucketSize; j++) {
          const idx = i * bucketSize + j;
          acc += freqData[idx] ?? 0;
        }
        const avg = acc / bucketSize; // 0..255
        nextBins[i] = avg;
        sum += avg;
      }
      setBins(nextBins);
      // Rough level from average
      const avgLevel = sum / (targetBins * 255);
      setLevel(avgLevel);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isPlaying) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, targetBins]);

  return { ready, level, bins };
}
