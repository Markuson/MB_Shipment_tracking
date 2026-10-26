import { describe, expect, it } from 'vitest';
import { formatWaitingTime } from './format-date';

describe('formatWaitingTime', () => {
  it('reads less than 1h right after an event is reported, never 0h', () => {
    expect(formatWaitingTime(0)).toBe('less than 1h');
    expect(formatWaitingTime(0.9)).toBe('less than 1h');
  });

  it('shows whole hours below two days and whole days from then on', () => {
    expect(formatWaitingTime(5.5)).toBe('5h');
    expect(formatWaitingTime(50)).toBe('2d');
  });
});
