// Replicates Vue 2 <transition> class semantics, which the vendored theme CSS
// targets: enter = `${name}-enter ${name}-enter-active` for one frame, then
// `${name}-enter-active` until done; leave = `${name}-leave-active` until done.
import { useEffect, useState } from 'react';

type Phase = 'unmounted' | 'enter-start' | 'entering' | 'entered' | 'leaving';

export function useVueTransition(
  show: boolean,
  name: string,
  duration: number,
  onAfterLeave?: () => void,
) {
  const [phase, setPhase] = useState<Phase>(show ? 'entered' : 'unmounted');

  useEffect(() => {
    if (show && (phase === 'unmounted' || phase === 'leaving')) {
      setPhase('enter-start');
    } else if (!show && (phase === 'entered' || phase === 'entering' || phase === 'enter-start')) {
      setPhase('leaving');
    }
  }, [show, phase]);

  useEffect(() => {
    if (phase === 'enter-start') {
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setPhase('entering'));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    if (phase === 'entering') {
      const t = setTimeout(() => setPhase('entered'), duration);
      return () => clearTimeout(t);
    }
    if (phase === 'leaving') {
      const t = setTimeout(() => {
        setPhase('unmounted');
        onAfterLeave?.();
      }, duration);
      return () => clearTimeout(t);
    }
  }, [phase, duration, onAfterLeave]);

  const className =
    phase === 'enter-start'
      ? `${name}-enter ${name}-enter-active`
      : phase === 'entering'
        ? `${name}-enter-active`
        : phase === 'leaving'
          ? `${name}-leave-active`
          : '';

  return { mounted: phase !== 'unmounted', className };
}
