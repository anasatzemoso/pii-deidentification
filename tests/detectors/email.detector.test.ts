import { emailDetector } from '../../src/detectors/email.detector';
import { DetectionSpan } from '../../src/types/pii.types';

const detect = (text: string): DetectionSpan[] => emailDetector.detect(text);
const values = (text: string): string[] => detect(text).map((s) => s.value);

describe('emailDetector', () => {
  it('exposes entityType EMAIL', () => {
    expect(emailDetector.entityType).toBe('EMAIL');
  });

  // 1. Standard email address + 11. exact indices + 4 fields.
  it('detects a standard email address with exact span', () => {
    const text = 'Contact john.doe@example.com today';
    expect(detect(text)).toEqual([
      {
        entityType: 'EMAIL',
        value: 'john.doe@example.com',
        start: 8,
        end: 28,
      },
    ]);
  });

  // start zero-based inclusive, end exclusive.
  it('reports zero-based inclusive start and exclusive end', () => {
    const text = 'me@x.com rest';
    expect(detect(text)).toEqual([
      { entityType: 'EMAIL', value: 'me@x.com', start: 0, end: 8 },
    ]);
  });

  // 2. Subdomains.
  it('detects emails with multiple subdomains', () => {
    expect(values('user@mail.corp.example.co.uk')).toEqual([
      'user@mail.corp.example.co.uk',
    ]);
  });

  // 3. Plus addressing.
  it('detects plus-addressed emails', () => {
    expect(values('alice+newsletter@example.com')).toEqual([
      'alice+newsletter@example.com',
    ]);
  });

  // 4. Multiple email addresses.
  it('detects multiple emails in one input', () => {
    expect(values('a@x.com and b@y.org then c.d+e@sub.z.io')).toEqual([
      'a@x.com',
      'b@y.org',
      'c.d+e@sub.z.io',
    ]);
  });

  // 5. Leading and trailing punctuation is excluded from the span.
  it('excludes surrounding punctuation from spans', () => {
    const text = '(john@example.com), and <jane@example.org>. end.';
    expect(values(text)).toEqual(['john@example.com', 'jane@example.org']);
  });

  it('excludes a trailing period from the span', () => {
    const text = 'Email me at bob@example.com.';
    expect(detect(text)).toEqual([
      { entityType: 'EMAIL', value: 'bob@example.com', start: 12, end: 27 },
    ]);
  });

  // 6. Adjacent to newlines.
  it('detects emails adjacent to newlines without consuming them', () => {
    const text = 'first@example.com\nsecond@example.net';
    const spans = detect(text);
    expect(spans.map((s) => s.value)).toEqual([
      'first@example.com',
      'second@example.net',
    ]);
    for (const s of spans) {
      expect(s.value).not.toContain('\n');
    }
  });

  // 7. Unicode surrounding text is preserved and does not break detection.
  it('detects an ASCII email surrounded by Unicode text', () => {
    const text = 'Grüße 👋 write to john.doe@example.com — danke schön';
    const spans = detect(text);
    expect(spans.map((s) => s.value)).toEqual(['john.doe@example.com']);
    // Span indices are exact against the original (UTF-16) string.
    for (const s of spans) {
      expect(text.slice(s.start, s.end)).toBe(s.value);
    }
  });

  // 8. Invalid candidates are rejected.
  it('rejects obviously invalid email candidates', () => {
    expect(detect('john@')).toEqual([]);
    expect(detect('@example.com')).toEqual([]);
    expect(detect('john@example')).toEqual([]); // no TLD
    expect(detect('john@example.c')).toEqual([]); // TLD too short
    expect(detect('user@localhost')).toEqual([]); // no dot in domain
    expect(detect('john..doe@example.com')).toEqual([]); // consecutive dots
    expect(detect('.john@example.com')).toEqual([]); // leading dot in local
    expect(detect('john.@example.com')).toEqual([]); // trailing dot in local
  });

  // Domain-label hyphen placement (regression).
  it('rejects domains whose labels start or end with a hyphen', () => {
    expect(values('x@-bad.com')).toEqual([]);
    expect(values('x@bad-.com')).toEqual([]);
  });

  it('still accepts internal hyphens in domain labels', () => {
    expect(values('user@my-domain.co.uk')).toEqual(['user@my-domain.co.uk']);
    expect(values('a@b-c.com')).toEqual(['a@b-c.com']);
  });

  // 9. Empty input.
  it('returns an empty array for empty input', () => {
    expect(detect('')).toEqual([]);
  });

  // 10. Input containing no email + negative: unrelated text not detected.
  it('returns an empty array when there is no email', () => {
    expect(detect('the quick brown fox jumps over the lazy dog')).toEqual([]);
    expect(detect('mention @handle and price 5@store')).toEqual([]);
    expect(detect('version 2.0 released at 10:30')).toEqual([]);
  });

  // 12. Exact substring equality for every returned span.
  it('guarantees value === text.slice(start, end) for every span', () => {
    const samples = [
      'lead a@b.co trail',
      'x (first@one.com) y, z <second@two.io>!',
      'line1@a.com\nline2@b.com\nplain text',
      'tag me+promo@sub.example.org ok',
    ];
    for (const text of samples) {
      for (const s of detect(text)) {
        expect(text.slice(s.start, s.end)).toBe(s.value);
        expect(s.entityType).toBe('EMAIL');
      }
    }
  });
});
