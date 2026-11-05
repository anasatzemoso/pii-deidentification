import { replaceMatches } from '../../src/services/replacer.service';
import { DetectionSpan } from '../../src/types/pii.types';

describe('replaceMatches', () => {
  it('returns the text unchanged when there are no spans', () => {
    expect(replaceMatches('hello world', [])).toBe('hello world');
  });

  it('replaces a single span with its token', () => {
    const text = 'email a@b.com end';
    const spans: DetectionSpan[] = [
      { entityType: 'EMAIL', value: 'a@b.com', start: 6, end: 13 },
    ];
    expect(replaceMatches(text, spans)).toBe('email [EMAIL] end');
  });

  it('replaces multiple spans and preserves surrounding text', () => {
    const text = 'a@b.com / 192.168.0.1';
    const spans: DetectionSpan[] = [
      { entityType: 'EMAIL', value: 'a@b.com', start: 0, end: 7 },
      { entityType: 'IP_ADDRESS', value: '192.168.0.1', start: 10, end: 21 },
    ];
    expect(replaceMatches(text, spans)).toBe('[EMAIL] / [IP_ADDRESS]');
  });

  it('preserves Unicode and newline characters outside spans', () => {
    const text = 'café\n a@b.com 👋';
    const spans: DetectionSpan[] = [
      { entityType: 'EMAIL', value: 'a@b.com', start: 6, end: 13 },
    ];
    expect(replaceMatches(text, spans)).toBe('café\n [EMAIL] 👋');
  });

  it('replaces adjacent/touching spans without losing or duplicating text', () => {
    const text = 'a@b.com10.0.0.1 done';
    const spans: DetectionSpan[] = [
      { entityType: 'EMAIL', value: 'a@b.com', start: 0, end: 7 },
      { entityType: 'IP_ADDRESS', value: '10.0.0.1', start: 7, end: 15 },
    ];
    expect(replaceMatches(text, spans)).toBe('[EMAIL][IP_ADDRESS] done');
  });

  it('preserves astral (emoji) characters immediately around a span', () => {
    // 🎉 and 🚀 are surrogate pairs (2 UTF-16 units each), directly adjacent
    // to the email span at [2, 9].
    const text = '🎉a@b.com🚀';
    const spans: DetectionSpan[] = [
      { entityType: 'EMAIL', value: 'a@b.com', start: 2, end: 9 },
    ];
    expect(replaceMatches(text, spans)).toBe('🎉[EMAIL]🚀');
  });
});
