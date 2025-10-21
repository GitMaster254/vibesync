const KEY = 'vibesync-haptics-enabled';

export function isHapticsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setHapticsEnabled(enabled: boolean) {
  try {
    localStorage.setItem(KEY, String(enabled));
  } catch {}
}

export function vibrate(duration = 15) {
  if (!isHapticsEnabled()) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      (navigator as any).vibrate(duration);
    } catch {}
  }
}
