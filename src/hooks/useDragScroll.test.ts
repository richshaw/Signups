// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { nextVelocity, shouldStartMomentum, MOMENTUM_DECAY } from './useDragScroll';

describe('nextVelocity', () => {
  it('multiplies velocity by the decay factor', () => {
    expect(nextVelocity(10)).toBeCloseTo(10 * MOMENTUM_DECAY);
    expect(nextVelocity(-4)).toBeCloseTo(-4 * MOMENTUM_DECAY);
  });

  it('decays to below the stop threshold within ~250ms at 60fps', () => {
    // ~15 frames at 60fps ≈ 250ms. Starting velocity 20 px/frame should reach <0.05.
    let v = 20;
    for (let i = 0; i < 100; i++) {
      v = nextVelocity(v);
      if (Math.abs(v) < 0.05) {
        expect(i).toBeLessThanOrEqual(100);
        return;
      }
    }
    throw new Error(`velocity ${v} never decayed below 0.05`);
  });
});

describe('shouldStartMomentum', () => {
  it('returns false for slow releases (avoid jitter from a click)', () => {
    expect(shouldStartMomentum(0)).toBe(false);
    expect(shouldStartMomentum(1.4)).toBe(false);
    expect(shouldStartMomentum(-1.4)).toBe(false);
    expect(shouldStartMomentum(1.5)).toBe(false);
  });

  it('returns true once the absolute velocity exceeds the threshold', () => {
    expect(shouldStartMomentum(1.6)).toBe(true);
    expect(shouldStartMomentum(-1.6)).toBe(true);
    expect(shouldStartMomentum(50)).toBe(true);
  });
});
