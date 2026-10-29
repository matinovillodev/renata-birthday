import { describe, expect, it, vi } from 'vitest';
import { createMotionGate, REDUCED_MOTION_QUERY } from './motion-gate';

function fakeQuery(matches: boolean) {
  let onChange: ((event: { matches: boolean }) => void) | undefined;
  const query = {
    matches,
    addEventListener: vi.fn((_type: 'change', listener: (event: { matches: boolean }) => void) => {
      onChange = listener;
    }),
    removeEventListener: vi.fn(),
  };
  const change = (next: boolean) => {
    query.matches = next;
    onChange?.({ matches: next });
  };
  return { query, change };
}

describe('createMotionGate', () => {
  it('watches the reduced-motion media query', () => {
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
  });

  it('allows motion when the user has not asked to reduce it', () => {
    expect(createMotionGate(fakeQuery(false).query).allowed).toBe(true);
  });

  it('forbids motion when the user asks to reduce it', () => {
    expect(createMotionGate(fakeQuery(true).query).allowed).toBe(false);
  });

  it('follows live changes of the preference and notifies subscribers', () => {
    const { query, change } = fakeQuery(false);
    const gate = createMotionGate(query);
    const listener = vi.fn();
    gate.subscribe(listener);

    change(true);
    expect(gate.allowed).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(false);

    change(false);
    expect(gate.allowed).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(true);
  });

  it('stops notifying a subscriber after it unsubscribes', () => {
    const { query, change } = fakeQuery(false);
    const gate = createMotionGate(query);
    const listener = vi.fn();
    const unsubscribe = gate.subscribe(listener);
    unsubscribe();
    change(true);
    expect(listener).not.toHaveBeenCalled();
  });
});
