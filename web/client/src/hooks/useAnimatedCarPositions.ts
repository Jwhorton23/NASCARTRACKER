import { useCallback, useEffect, useRef } from 'react';
import type { LiveFeed } from '@nascar/shared';
import type { ArcTable } from '../tracks/geometry';
import { pointAtProgress } from '../tracks/geometry';
import {
  computeTargets,
  initialSynthesisState,
  type CarTarget,
  type SynthesisState,
} from '../tracks/positionSynthesis';

const SNAP_THRESHOLD = 0.15; // laps — beyond this, teleport instead of easing
const EASE_TAU = 0.35; // seconds — exponential correction time constant

function wrapSigned(d: number): number {
  return ((d % 1) + 1.5) % 1 - 0.5;
}

/**
 * Drives car dot transforms. A single requestAnimationFrame loop advances the
 * field at 60fps (the leader dead-reckons forward between 1s polls; each car
 * eases toward its target so corrections are invisible), and a synchronous
 * pass on every feed update keeps dots placed even when rAF is throttled
 * (hidden tab). Transforms are written directly on registered <g> elements —
 * React never touches them, so there are zero re-renders per frame.
 */
export function useAnimatedCarPositions(
  feed: LiveFeed | undefined,
  table: ArcTable,
  registry: React.MutableRefObject<Map<string, SVGGElement>>,
  pitSlotFor: (target: CarTarget, pitIndex: number) => { x: number; y: number },
) {
  const feedRef = useRef<LiveFeed | undefined>(feed);
  feedRef.current = feed;
  const synthRef = useRef<SynthesisState>(initialSynthesisState());
  const displayRef = useRef<Map<string, number>>(new Map());

  const applyFrame = useCallback(
    (dt: number, ease: boolean) => {
      const currentFeed = feedRef.current;
      if (!currentFeed) return;

      const targets = computeTargets(currentFeed, synthRef.current, dt);
      const display = displayRef.current;
      const blend = ease ? 1 - Math.exp(-dt / EASE_TAU) : 1;
      let pitIndex = 0;

      for (const target of targets) {
        const el = registry.current.get(target.carNumber);
        if (!el) continue;

        if (target.inPit || !target.running) {
          const slot = pitSlotFor(target, pitIndex++);
          el.setAttribute('transform', `translate(${slot.x.toFixed(1)} ${slot.y.toFixed(1)})`);
          el.setAttribute('opacity', target.running ? '0.55' : '0.3');
          display.delete(target.carNumber);
          continue;
        }
        el.setAttribute('opacity', '1');

        let d = display.get(target.carNumber);
        if (d === undefined || !ease) {
          d = target.progress;
        } else {
          const err = wrapSigned(target.progress - d);
          d = Math.abs(err) > SNAP_THRESHOLD ? target.progress : d + err * blend;
        }
        display.set(target.carNumber, d);

        const pt = pointAtProgress(table, d);
        el.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      }
    },
    [table, registry, pitSlotFor],
  );

  useEffect(() => {
    // new session/track: reset accumulated state
    synthRef.current = initialSynthesisState();
    displayRef.current.clear();
  }, [feed?.race_id, feed?.track_id]);

  // synchronous pass per poll — covers hidden tabs and the first paint
  useEffect(() => {
    applyFrame(0, false);
  }, [feed, applyFrame]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      applyFrame(dt, !reducedMotion);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [applyFrame]);
}
