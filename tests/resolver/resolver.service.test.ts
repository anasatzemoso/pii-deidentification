import { resolveMatches } from '../../src/services/resolver.service';
import { DetectionSpan } from '../../src/types/pii.types';

const span = (
  entityType: DetectionSpan['entityType'],
  start: number,
  end: number,
): DetectionSpan => ({
  entityType,
  value: 'x'.repeat(end - start),
  start,
  end,
});

describe('resolveMatches', () => {
  it('returns an empty array for no input', () => {
    expect(resolveMatches([])).toEqual([]);
  });

  it('keeps the higher-priority entity when two spans overlap', () => {
    const ssn = span('SSN', 0, 11);
    const phone = span('PHONE', 0, 11);
    expect(resolveMatches([phone, ssn])).toEqual([ssn]);
  });

  it('removes duplicate spans', () => {
    const a = span('EMAIL', 0, 5);
    const b = span('EMAIL', 0, 5);
    expect(resolveMatches([a, b])).toEqual([a]);
  });

  it('keeps non-overlapping spans and sorts them by start', () => {
    const second = span('EMAIL', 10, 15);
    const first = span('PHONE', 0, 5);
    expect(resolveMatches([second, first])).toEqual([first, second]);
  });

  it('keeps adjacent (touching) spans', () => {
    const a = span('EMAIL', 0, 5);
    const b = span('PHONE', 5, 9);
    expect(resolveMatches([a, b])).toEqual([a, b]);
  });

  it('keeps the longer span when same-entity spans overlap (equal priority)', () => {
    const longer = span('EMAIL', 0, 8);
    const shorter = span('EMAIL', 0, 5);
    expect(resolveMatches([shorter, longer])).toEqual([longer]);
  });

  it('selects deterministically for same-entity partial overlap', () => {
    const earlier = span('EMAIL', 0, 5);
    const later = span('EMAIL', 3, 8);
    // Equal priority and equal length -> earliest start wins, regardless of
    // input order.
    expect(resolveMatches([later, earlier])).toEqual([earlier]);
  });

  it('higher-priority span defeats an overlapping middle span while a non-overlapping third survives', () => {
    const high = span('SSN', 0, 11); // priority 100
    const middle = span('EMAIL', 5, 15); // priority 80, overlaps high
    const third = span('PHONE', 20, 30); // priority 60, no overlap
    expect(resolveMatches([middle, high, third])).toEqual([high, third]);
  });
});
