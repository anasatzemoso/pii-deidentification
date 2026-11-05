import { phoneDetector } from '../../src/detectors/phone.detector';

const values = (text: string): string[] =>
  phoneDetector.detect(text).map((s) => s.value);

describe('phoneDetector', () => {
  it('exposes entityType PHONE', () => {
    expect(phoneDetector.entityType).toBe('PHONE');
  });

  it('detects common NANP formats', () => {
    expect(values('(123) 456-7890')).toEqual(['(123) 456-7890']);
    expect(values('123-456-7890')).toEqual(['123-456-7890']);
    expect(values('123.456.7890')).toEqual(['123.456.7890']);
    expect(values('1234567890')).toEqual(['1234567890']);
  });

  it('detects a number with a country code', () => {
    expect(values('call +1 123 456 7890 now')).toEqual(['+1 123 456 7890']);
  });

  it('detects multiple numbers', () => {
    expect(values('a 111-222-3333 b 444.555.6666')).toEqual([
      '111-222-3333',
      '444.555.6666',
    ]);
  });

  it('excludes a trailing period from the span', () => {
    expect(phoneDetector.detect('Call 123-456-7890.')).toEqual([
      { entityType: 'PHONE', value: '123-456-7890', start: 5, end: 17 },
    ]);
  });

  it('ignores short digit groups and non-phone numbers', () => {
    expect(values('')).toEqual([]);
    expect(values('call me at 12345')).toEqual([]);
    expect(values('the year is 2020')).toEqual([]);
  });

  it('guarantees value === text.slice(start, end)', () => {
    for (const s of phoneDetector.detect('x (123) 456-7890 y 999.888.7777')) {
      expect('x (123) 456-7890 y 999.888.7777'.slice(s.start, s.end)).toBe(
        s.value,
      );
    }
  });
});
