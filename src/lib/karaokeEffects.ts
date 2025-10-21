/**
 * Karaoke mode transition effects
 */

export type KaraokeEffect = 'curtain' | 'spotlight' | 'vinyl' | 'neon' | 'zoom';

/**
 * Get the user's selected karaoke transition effect
 */
export function getKaraokeEffect(): KaraokeEffect {
  const stored = localStorage.getItem('vibesync-karaoke-effect');
  return (stored as KaraokeEffect) || 'curtain';
}

/**
 * Get animation properties for the selected effect
 */
export function getEffectAnimation(effect: KaraokeEffect, isEntering: boolean): any {
  switch (effect) {
    case 'curtain':
      return {
        initial: isEntering 
          ? { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }
          : { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' },
        animate: isEntering
          ? { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }
          : { clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' },
        transition: { duration: 0.8, ease: [0.4, 0.0, 0.2, 1] as any },
      };

    case 'spotlight':
      return {
        initial: isEntering
          ? { 
              background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 0%)',
              opacity: 0 
            }
          : { 
              background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 100%, rgba(0,0,0,1) 100%)',
              opacity: 1 
            },
        animate: isEntering
          ? { 
              background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 100%, rgba(0,0,0,1) 100%)',
              opacity: 1 
            }
          : { 
              background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 0%)',
              opacity: 0 
            },
        transition: { duration: 0.7, ease: [0.4, 0.0, 0.6, 1] as any },
      };

    case 'vinyl':
      return {
        initial: isEntering
          ? { scale: 0, rotate: 0, opacity: 0 }
          : { scale: 1, rotate: 0, opacity: 1 },
        animate: isEntering
          ? { scale: 1, rotate: 360, opacity: 1 }
          : { scale: 0, rotate: 360, opacity: 0 },
        transition: { duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] as any },
      };

    case 'neon':
      return {
        initial: isEntering
          ? { 
              boxShadow: '0 0 0px rgba(var(--primary-rgb), 0)',
              scale: 0.8,
              opacity: 0 
            }
          : { 
              boxShadow: '0 0 100px rgba(var(--primary-rgb), 0.8)',
              scale: 1,
              opacity: 1 
            },
        animate: isEntering
          ? { 
              boxShadow: [
                '0 0 0px rgba(var(--primary-rgb), 0)',
                '0 0 100px rgba(var(--primary-rgb), 0.6)',
                '0 0 200px rgba(var(--primary-rgb), 0.4)',
                '0 0 100px rgba(var(--primary-rgb), 0.8)',
              ],
              scale: 1,
              opacity: 1 
            }
          : { 
              boxShadow: '0 0 0px rgba(var(--primary-rgb), 0)',
              scale: 0.8,
              opacity: 0 
            },
        transition: { duration: 0.6, ease: [0.4, 0.0, 0.2, 1] as any },
      };

    case 'zoom':
      return {
        initial: isEntering
          ? { scale: 2, opacity: 0, filter: 'blur(20px)' }
          : { scale: 1, opacity: 1, filter: 'blur(0px)' },
        animate: isEntering
          ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
          : { scale: 0.5, opacity: 0, filter: 'blur(20px)' },
        transition: { duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] as any },
      };

    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      };
  }
}
