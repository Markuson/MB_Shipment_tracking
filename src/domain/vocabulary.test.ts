import { describe, expect, it } from 'vitest';
import { statusPhrase } from './vocabulary';

describe('statusPhrase', () => {
  it('gives the phrase of the leg type for a defined code', () => {
    const phrase = statusPhrase('sea', 'in-transit');

    expect(phrase).toBe('At sea');
  });

  it('falls back to unrecognised wording for a code the vocabulary does not define', () => {
    const phrase = statusPhrase('road', 'unrecognised');

    expect(phrase).toBe('Unrecognised wording');
  });
});
